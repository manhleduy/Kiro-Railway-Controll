


CREATE OR REPLACE PROCEDURE p_make_order(
    p_customer_id VARCHAR(100),
    p_method_id INT,
    p_tickets_json JSONB -- Using JSONB for efficient ticket array processing
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_amount FLOAT := 0;
    v_new_order_id INT;
	v_new_payment_id INT;
BEGIN
    -- 1. Check if any requested seats are already taken (Status is not 'Available')
    -- Replicates Query 12 logic for checking availability
    IF EXISTS (
        SELECT 1 
        FROM "Seat" s
        INNER JOIN jsonb_to_recordset(p_tickets_json) AS jt("seatId" INT) 
        ON s."seatId" = jt."seatId"
        WHERE s.status <> 'Available'
    ) THEN 
        RAISE EXCEPTION 'Booking failed: One or more seats are no longer available!';
    END IF;

    -- 2. Create the main Order record
    -- "ORDER" is a reserved keyword in Postgres, so it must be in double quotes [4]
    INSERT INTO "Order" ("customerId", "staffId", "status") 
    VALUES (p_customer_id, p_staff_id, 'Pending')
    RETURNING "orderId" INTO v_new_order_id; -- Captures the generated ID (Postgres equivalent of SCOPE_IDENTITY)

    -- 3. Insert ticket details from the JSON array
    -- Maps to TICKET table: order_id, seat_id, pass_name, pass_cccd, applied_price, status [3, 4]
    INSERT INTO "Ticket" ("orderId", "seatId", "passName", "passCCCD")
    SELECT v_new_order_id, "seatId", "passName", "passCCCD"
    FROM jsonb_to_recordset(p_tickets_json) AS jt(
        "seatId" INT, 
        "passName" TEXT, 
        "passCCCD" VARCHAR(100)
    );

    -- 4. Calculate total amount and record in PAY_DETAIL
    -- This ensures data consistency between ticket prices and final payment [5, 6]
    SELECT SUM(sc."price") INTO v_total_amount 
    FROM jsonb_to_recordset(p_tickets_json) AS jt("seatId" INT)
	INNER JOIN "Seat" s ON s."seatId" = jt."seatId"
	INNER JOIN "SeatClass" sc ON s."seatClassId" = sc."seatClassId";
	
    
    INSERT INTO "Payment" ("orderId", "methodId", "price") 
    VALUES (v_new_order_id, p_method_id, v_total_amount)
	RETURNING "paymentId" INTO v_new_payment_id;
	
	UPDATE "Order" SET "paymentId" = v_new_payment_id
	WHERE "orderId" = v_new_order_id;
    -- Postgres procedures automatically handle the transaction context, 
    -- but explicit COMMIT can be used if not called inside another transaction block.

    RAISE NOTICE 'Booking successful! Generated Order ID: %', v_new_order_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Standard PostgreSQL exception handling: automatically rolls back the transaction
        RAISE NOTICE 'Transaction failed due to system error or seat conflict: %', SQLERRM;
        ROLLBACK;
END;
$$;
DO $$ 
DECLARE 
    -- Khai báo biến với kiểu dữ liệu JSONB của Postgres
    v_json_data JSONB := '[
        { "seatId": 6,  "passName": "Trần Thị B", "passCCCD": "012345678912", "appliedPrice": 150000.0 },
        { "seatId": 7, "passName": "Nguyễn Văn C", "passCCCD": "012345678913", "appliedPrice": 150000.0 }
    ]';
BEGIN 
    -- Sử dụng lệnh CALL thay cho EXEC trong PostgreSQL
    CALL p_make_order(
        '202416978',           -- p_customer_id
        '202416978',           -- p_staff_id
        1,           -- p_method_id
        v_json_data  -- p_tickets_json
    );
END $$;

-- Query 2: Procedure ticket_cancel (Ticket Cancellation)
-- Description: Handles ticket cancellation logic by updating the ticket status to 'Canceled' 
-- and clearing the assigned seat ID to avoid foreign key conflicts and free the seat. [1, 2]

CREATE OR REPLACE PROCEDURE ticket_cancel(
    p_ticket_id INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the status and set seat_id to NULL. 
    -- This action typically triggers a separate process to mark the seat as 'Available'. [1-3]
    UPDATE "Ticket"
    SET "status" = 'Canceled', 
        "seatId" = NULL ,
        "updatedAt" = now()
    WHERE "ticketId" = p_ticket_id;
END;
$$;

-- Query 3: Procedure ticket_change (Ticket Exchange/Modification)
-- Description: Modifies existing ticket information, including passenger identification (CCCD), 
-- passenger name, and assigned seat position. [2]

CREATE OR REPLACE PROCEDURE ticket_change(
    p_ticket_id INT, 
    p_seat_id INT, 
    p_pass_cccd VARCHAR(20), 
    p_pass_name TEXT -- NVARCHAR is mapped to TEXT in PostgreSQL
    
)
LANGUAGE plpgsql
AS $$
BEGIN 
    -- Update the ticket record with new passenger details and the new seat assignment. [2]
    UPDATE "Ticket"
    SET "seatId" = p_seat_id, 
        "passCCCD" = p_pass_cccd, 
        "passName" = p_pass_name,
        "updatedAt"= now()
    WHERE "ticket" = p_ticket_id;
END;
$$;



-------------------------------------------------------------------------
-- 1. TRIGGER: trg_lock_seat_on_insert (Query 5)
-- Purpose: Automatically marks a seat as 'Unavailable' when a new ticket is created [1, 3].
-------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_lock_seat_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the SEAT status corresponding to the newly inserted TICKET's seat_id [1].
    UPDATE "Seat"
    SET "status" = 'Booked'
    WHERE "seatId" = NEW."seatId";
    
    RETURN NEW; -- Return the new row to complete the INSERT operation.
END;
$$ LANGUAGE plpgsql;

create or Replace TRIGGER trg_create_ticket
AFTER INSERT ON "Ticket"
FOR EACH ROW -- Executes for every individual ticket inserted [1].
EXECUTE FUNCTION fn_lock_seat_on_insert();


-------------------------------------------------------------------------
-- 2. TRIGGER: trg_update_ticket_seats (Query 6)
-- Purpose: Handles seat swaps. Releases the old seat and locks the new one [1, 2].
-------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_update_ticket_seats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only perform updates if the seat_id has actually changed [2].
    IF (OLD."seatId" IS DISTINCT FROM NEW."seatId") THEN
    
        -- Step A: Release the previous seat (Set to 'Available') [2].
        IF OLD."seatId" IS NOT NULL THEN
            UPDATE "Seat"
            SET "status" = 'Available'
            WHERE "seatId" = OLD."seatId";
        END IF;

        -- Step B: Lock the new seat (Set to 'Unavailable') [2].
        IF NEW."seatId" IS NOT NULL THEN
            UPDATE "Seat"
            SET status = 'Unavailable'
            WHERE "seatId" = NEW."seatId";
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

create or replace TRIGGER trg_update_ticket
AFTER UPDATE ON  "Ticket"
FOR EACH ROW
EXECUTE FUNCTION fn_update_ticket_seats();


-------------------------------------------------------------------------
-- 3. TRIGGER: trg_release_seat_on_delete
-- Purpose: Frees up the seat when a ticket is deleted from the system [4].
-------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_release_seat_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- When a ticket record is removed, set the associated seat back to 'Available' [4].
    UPDATE "Seat"
    SET status = 'Available'
    WHERE "seatId" = OLD."seatId";
    RETURN OLD; -- Return the deleted row to finalize the removal.
END;
$$ LANGUAGE plpgsql;

create or replace trigger trg_delete_ticket 
after delete on "Ticket"
for each row 
execute function fn_release_seat_on_delete();

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Cập nhật cột updatedAt của dòng dữ liệu sắp được ghi
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

create or replace trigger trg_updated_at_customer
after update on "Customer"
for each row
execute function fn_update_timestamp();

create or replace trigger trg_updated_at_feedback
after update on "Feedback"
for each row 
execute function fn_update_timestamp();

create or replace trigger trg_updated_at_order
after update on "Order"
for each row
execute function fn_update_timestamp();

create or replace trigger trg_updated_at_payment
after update on "Payment"
for each row
execute function fn_update_timestamp();

create or replace trigger trg_updated_at_seat
after update on "Seat"
for each row
execute function fn_update_timestamp();

create or replace trigger trg_updated_at_staff
after update on "Staff"
for each row
execute function fn_update_timestamp();

create or replace trigger trg_updated_at_ticket
after update on "Ticket"
for each row
execute function fn_update_timestamp();

-- 2. Attach the trigger to your Seats table
create or replace TRIGGER trg_seat_state_change
AFTER UPDATE ON "Seat"
FOR EACH ROW
EXECUTE FUNCTION notify_seat_change();