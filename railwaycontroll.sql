--
-- PostgreSQL database dump
--

\restrict a6SskbCsLnqlHfFFfzSDQJsn80twdv5girJXcE3ZI8FuJje6HCfQNNy2oksBR8f

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-07-23 20:32:15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE railwaycontroll;
--
-- TOC entry 5216 (class 1262 OID 19994)
-- Name: railwaycontroll; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE railwaycontroll WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE railwaycontroll OWNER TO postgres;

\unrestrict a6SskbCsLnqlHfFFfzSDQJsn80twdv5girJXcE3ZI8FuJje6HCfQNNy2oksBR8f
\connect railwaycontroll
\restrict a6SskbCsLnqlHfFFfzSDQJsn80twdv5girJXcE3ZI8FuJje6HCfQNNy2oksBR8f

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 903 (class 1247 OID 20026)
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'Pending',
    'Confirmed',
    'Denied'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- TOC entry 897 (class 1247 OID 20012)
-- Name: SeatStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SeatStatus" AS ENUM (
    'Available',
    'Booked',
    'Unavailable'
);


ALTER TYPE public."SeatStatus" OWNER TO postgres;

--
-- TOC entry 900 (class 1247 OID 20020)
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'Open',
    'Resolved',
    'Canceled'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

--
-- TOC entry 267 (class 1255 OID 29603)
-- Name: clean_tickets_on_denied_order(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.clean_tickets_on_denied_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if the status has transitioned to 'Denied'
    -- (OLD.status IS DISTINCT FROM NEW.status ensures we only run this when the status actually changes)
    IF NEW.status = 'Denied' AND OLD.status IS DISTINCT FROM NEW.status THEN
        
        UPDATE "Ticket"
        SET "seatId" = NULL
        WHERE "orderId" = NEW.id; -- Adjust "orderId" and "id" to match your primary/foreign keys
        
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.clean_tickets_on_denied_order() OWNER TO postgres;

--
-- TOC entry 261 (class 1255 OID 29598)
-- Name: fn_get_customer_monthly_report(character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_get_customer_monthly_report(p_customer_id character varying, p_year integer) RETURNS TABLE(month numeric, "orderNumber" bigint, "totalExpense" double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(MONTH FROM o."createdAt") AS "month",
        COUNT(*) AS "orderNumber",
        SUM(p."price") AS "totalExpense"
    FROM "Customer" c
    INNER JOIN "Order" o ON o."customerId" = c."customerId" 
    INNER JOIN "Payment" p ON p."orderId" = o."orderId" 
    WHERE c."customerId" LIKE p_customer_id
      AND EXTRACT(YEAR FROM o."createdAt") = p_year
    GROUP BY EXTRACT(MONTH FROM o."createdAt")
    ORDER BY "month" ASC; -- Added order by month for cleaner reporting
END;
$$;


ALTER FUNCTION public.fn_get_customer_monthly_report(p_customer_id character varying, p_year integer) OWNER TO postgres;

--
-- TOC entry 260 (class 1255 OID 29600)
-- Name: fn_get_staff_monthly_report(character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_get_staff_monthly_report(p_staff_id character varying, p_year integer) RETURNS TABLE(month numeric, "orderNumber" bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(MONTH FROM o."createdAt") AS "month",
        COUNT(*) AS "orderNumber"
    FROM "Staff" s
    INNER JOIN "Order" o ON o."staffId" = s."staffId" 
    WHERE s."staffId" LIKE p_staff_id
      AND EXTRACT(YEAR FROM o."createdAt") = p_year
    GROUP BY EXTRACT(MONTH FROM o."createdAt")
    ORDER BY "month" ASC; -- Added order by month for cleaner reporting
END;
$$;


ALTER FUNCTION public.fn_get_staff_monthly_report(p_staff_id character varying, p_year integer) OWNER TO postgres;

--
-- TOC entry 271 (class 1255 OID 23702)
-- Name: fn_lock_seat_on_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_lock_seat_on_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update the SEAT status corresponding to the newly inserted TICKET's seat_id [1].
    UPDATE "Seat"
    SET "status" = 'Booked'
    WHERE "seatId" = NEW."seatId";
    
    RETURN NEW; -- Return the new row to complete the INSERT operation.
END;
$$;


ALTER FUNCTION public.fn_lock_seat_on_insert() OWNER TO postgres;

--
-- TOC entry 262 (class 1255 OID 26592)
-- Name: fn_refund_points_on_order_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_refund_points_on_order_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_refund_amount FLOAT := 0;
BEGIN
	IF(NOT (OLD."status" = 'Denied')) THEN
    -- Calculate the total payment amount associated with the deleted order.
	    SELECT COALESCE(SUM("price"), 0) INTO v_refund_amount
	    FROM "Payment"
	    WHERE "orderId" = OLD."orderId";
	
	    -- Update the customer's profile by deducting the calculated points.
	    UPDATE "Customer" c
	    SET point = CASE 
	            WHEN (COALESCE(c."point", 0) - (v_refund_amount / 100000)) < 0 THEN 0 
	            ELSE (COALESCE(c."point", 0) - (v_refund_amount / 100000)) 
	        END,
	        rank = CASE 
				WHEN GREATEST(0, COALESCE(c."point", 0) - (v_refund_amount / 100000)) >= 35 THEN 3
	            WHEN GREATEST(0, COALESCE(c."point", 0) - (v_refund_amount / 100000)) >= 20 THEN 2
	            WHEN GREATEST(0, COALESCE(c."point", 0) - (v_refund_amount / 100000)) >= 10 THEN 1
	            ELSE 0
	        END
	    WHERE c."customerId" = OLD."customerId";
	END IF;
    RETURN OLD; -- Proceed with the order deletion.
END;
$$;


ALTER FUNCTION public.fn_refund_points_on_order_delete() OWNER TO postgres;

--
-- TOC entry 266 (class 1255 OID 29601)
-- Name: fn_refund_points_on_order_deny(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_refund_points_on_order_deny() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_refund_amount FLOAT := 0;
BEGIN
	IF(NEW.status = 'Denied') THEN 
    -- Calculate the total payment amount associated with the deleted order.
    SELECT COALESCE(SUM("price"), 0) INTO v_refund_amount
    FROM "Payment"
    WHERE "orderId" = OLD."orderId";

    -- Update the customer's profile by deducting the calculated points.
    UPDATE "Customer" c
    SET point = CASE 
            WHEN (COALESCE(c."point", 0) - (v_refund_amount / 100000)) < 0 THEN 0 
            ELSE (COALESCE(c."point", 0) - (v_refund_amount / 100000)) 
        END,
        rank = CASE 
			WHEN GREATEST(0, COALESCE(c."point", 0) - (v_refund_amount / 100000)) >= 35 THEN 3
            WHEN GREATEST(0, COALESCE(c."point", 0) - (v_refund_amount / 100000)) >= 20 THEN 2
            WHEN GREATEST(0, COALESCE(c."point", 0) - (v_refund_amount / 100000)) >= 10 THEN 1
            ELSE 0
        END
    WHERE c."customerId" = OLD."customerId";
	END IF;
    RETURN OLD; -- Proceed with the order deletion.
END;
$$;


ALTER FUNCTION public.fn_refund_points_on_order_deny() OWNER TO postgres;

--
-- TOC entry 269 (class 1255 OID 23706)
-- Name: fn_release_seat_on_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_release_seat_on_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- When a ticket record is removed, set the associated seat back to 'Available' [4].
    UPDATE "Seat"
    SET status = 'Available'
    WHERE "seatId" = OLD."seatId";
    RETURN OLD; -- Return the deleted row to finalize the removal.
END;
$$;


ALTER FUNCTION public.fn_release_seat_on_delete() OWNER TO postgres;

--
-- TOC entry 259 (class 1255 OID 26596)
-- Name: fn_seat_is_booked(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_seat_is_booked() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- 1. Check the current status of the seat before the update happens.
    -- According to the sources, 'Unavailable' means the seat is assigned to a ticket [1].
    IF OLD."status" = 'Booked' THEN
        -- 2. Raise an exception to block the transaction if the seat is occupied.
        RAISE EXCEPTION 'Update Denied: Seat ID % is currently reserved/occupied and cannot be modified.', OLD."seatId";
    END IF;

    -- 3. If the seat is 'Available', allow the update (e.g., changing to 'Damaged' or 'Maintenance').
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_seat_is_booked() OWNER TO postgres;

--
-- TOC entry 256 (class 1255 OID 26590)
-- Name: fn_update_loyalty_on_payment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_update_loyalty_on_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update customer points and rank based on the new payment detail.
    -- Joins with the "ORDER" table to identify the correct customer.
    UPDATE "Customer" c
    SET "point" = COALESCE(c."point", 0) + (NEW."price" / 100000),
        "rank" = CASE 
			WHEN (COALESCE(c."point", 0) + (NEW."price" / 100000)) >= 35 THEN 3
            WHEN (COALESCE(c."point", 0) + (NEW."price" / 100000)) >= 20 THEN 2
            WHEN (COALESCE(c."point", 0) + (NEW."price" / 100000)) >= 10 THEN 1
            ELSE 0
        END
    FROM "Order" o
    WHERE c."customerId" = o."customerId" AND o."orderId" = NEW."orderId";

    RETURN NEW; -- Proceed with the payment insertion.
END;
$$;


ALTER FUNCTION public.fn_update_loyalty_on_payment() OWNER TO postgres;

--
-- TOC entry 272 (class 1255 OID 23704)
-- Name: fn_update_ticket_seats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_update_ticket_seats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.fn_update_ticket_seats() OWNER TO postgres;

--
-- TOC entry 263 (class 1255 OID 29570)
-- Name: fn_update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Cập nhật cột updatedAt của dòng dữ liệu sắp được ghi
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_timestamp() OWNER TO postgres;

--
-- TOC entry 268 (class 1255 OID 31907)
-- Name: notify_seat_change(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_seat_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    payload JSON;
BEGIN
    -- Only emit if the state actually transitioned
    IF (OLD."status" IS DISTINCT FROM NEW."status") THEN
        payload = json_build_object(
            'seat_id', NEW."seatId",
            'old_state', OLD."status",
            'new_state', NEW."status"
        );
        
        -- Broadcast to a channel named 'seat_updates'
        -- (Cast payload to text since pg_notify requires string payloads)
        PERFORM pg_notify('seat_status_update', payload::text);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_seat_change() OWNER TO postgres;

--
-- TOC entry 264 (class 1255 OID 29599)
-- Name: p_make_order(character varying, integer, jsonb); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.p_make_order(IN p_customer_id character varying, IN p_method_id integer, IN p_tickets_json jsonb)
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
    VALUES (p_customer_id, NULL, 'Pending')
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
    VALUES (v_new_order_id, p_method_id , v_total_amount)
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


ALTER PROCEDURE public.p_make_order(IN p_customer_id character varying, IN p_method_id integer, IN p_tickets_json jsonb) OWNER TO postgres;

--
-- TOC entry 265 (class 1255 OID 20278)
-- Name: p_make_order(integer, integer, integer, jsonb); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.p_make_order(IN p_customer_id integer, IN p_staff_id integer, IN p_method_id integer, IN p_tickets_json jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_total_amount FLOAT := 0;
    v_new_order_id INT;
BEGIN
    -- 1. Check if any requested seats are already taken (Status is not 'Available')
    -- Replicates Query 12 logic for checking availability
    IF EXISTS (
        SELECT 1 
        FROM "Seat" s
        INNER JOIN jsonb_to_recordset(p_tickets_json) AS jt(seatId INT) 
        ON s.seatId = jt.seatId
        WHERE s.status <> 'Available'
    ) THEN 
        RAISE EXCEPTION 'Booking failed: One or more seats are no longer available!';
    END IF;

    -- 2. Create the main Order record
    -- "ORDER" is a reserved keyword in Postgres, so it must be in double quotes [4]
    INSERT INTO "Order" (customerId, staffId) 
    VALUES (p_customer_id, p_staff_id)
    RETURNING orderId INTO v_new_order_id; -- Captures the generated ID (Postgres equivalent of SCOPE_IDENTITY)

    -- 3. Insert ticket details from the JSON array
    -- Maps to TICKET table: order_id, seat_id, pass_name, pass_cccd, applied_price, status [3, 4]
    INSERT INTO "Ticket" (orderId, seatId, passName, passCCCD, appliedPrice, status)
    SELECT v_new_order_id, seatId, passName, passCCCD, appliedPrice, 'Used'
    FROM jsonb_to_recordset(p_tickets_json) AS jt(
        seatId INT, 
        passName TEXT, 
        passCCCD VARCHAR, 
        appliedPrice FLOAT
    );

    -- 4. Calculate total amount and record in PAY_DETAIL
    -- This ensures data consistency between ticket prices and final payment [5, 6]
    SELECT SUM(appliedPrice) INTO v_total_amount 
    FROM jsonb_to_recordset(p_tickets_json) AS jt(appliedPrice FLOAT);
    
    INSERT INTO "Payment" (orderId, methodId, finalAmount) 
    VALUES (v_new_order_id, p_method_id, v_total_amount);

    -- Postgres procedures automatically handle the transaction context, 
    -- but explicit COMMIT can be used if not called inside another transaction block.
    COMMIT;

    RAISE NOTICE 'Booking successful! Generated Order ID: %', v_new_order_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Standard PostgreSQL exception handling: automatically rolls back the transaction
        RAISE NOTICE 'Transaction failed due to system error or seat conflict: %', SQLERRM;
        ROLLBACK;
END;
$$;


ALTER PROCEDURE public.p_make_order(IN p_customer_id integer, IN p_staff_id integer, IN p_method_id integer, IN p_tickets_json jsonb) OWNER TO postgres;

--
-- TOC entry 270 (class 1255 OID 20888)
-- Name: p_make_order(character varying, character varying, integer, jsonb); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.p_make_order(IN p_customer_id character varying, IN p_staff_id character varying, IN p_method_id integer, IN p_tickets_json jsonb)
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
    INSERT INTO "Order" ("customerId", "staffId", "status", "createdAt") 
    VALUES (p_customer_id, p_staff_id, 'Pending', now())
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


ALTER PROCEDURE public.p_make_order(IN p_customer_id character varying, IN p_staff_id character varying, IN p_method_id integer, IN p_tickets_json jsonb) OWNER TO postgres;

--
-- TOC entry 258 (class 1255 OID 26594)
-- Name: ticket_cancel(integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.ticket_cancel(IN p_ticket_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update the status and set seat_id to NULL. 
    -- This action typically triggers a separate process to mark the seat as 'Available'. [1-3]
    UPDATE "Ticket"
    SET "status" = 'Canceled', 
        "seatId" = NULL 
    WHERE "ticketId" = p_ticket_id;
END;
$$;


ALTER PROCEDURE public.ticket_cancel(IN p_ticket_id integer) OWNER TO postgres;

--
-- TOC entry 257 (class 1255 OID 26595)
-- Name: ticket_change(integer, integer, character varying, text); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.ticket_change(IN p_ticket_id integer, IN p_seat_id integer, IN p_pass_cccd character varying, IN p_pass_name text)
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


ALTER PROCEDURE public.ticket_change(IN p_ticket_id integer, IN p_seat_id integer, IN p_pass_cccd character varying, IN p_pass_name text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 20033)
-- Name: Customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customer" (
    "customerId" text NOT NULL,
    fullname text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    password text NOT NULL,
    rank integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    point integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Customer" OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 20177)
-- Name: Feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Feedback" (
    "customerId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "feedbackId" integer NOT NULL
);


ALTER TABLE public."Feedback" OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 20807)
-- Name: Feedback_feedbackId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Feedback_feedbackId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Feedback_feedbackId_seq" OWNER TO postgres;

--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 235
-- Name: Feedback_feedbackId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Feedback_feedbackId_seq" OWNED BY public."Feedback"."feedbackId";


--
-- TOC entry 226 (class 1259 OID 20093)
-- Name: Method; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Method" (
    "methodId" integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL
);


ALTER TABLE public."Method" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 20092)
-- Name: Method_methodId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Method_methodId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Method_methodId_seq" OWNER TO postgres;

--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 225
-- Name: Method_methodId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Method_methodId_seq" OWNED BY public."Method"."methodId";


--
-- TOC entry 228 (class 1259 OID 20105)
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    "orderId" integer NOT NULL,
    "customerId" text NOT NULL,
    "staffId" text,
    status public."OrderStatus" NOT NULL,
    "paymentId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 20104)
-- Name: Order_orderId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Order_orderId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Order_orderId_seq" OWNER TO postgres;

--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 227
-- Name: Order_orderId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Order_orderId_seq" OWNED BY public."Order"."orderId";


--
-- TOC entry 224 (class 1259 OID 20079)
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    "paymentId" integer NOT NULL,
    "orderId" integer NOT NULL,
    "methodId" integer NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 20078)
-- Name: Payment_paymentId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Payment_paymentId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Payment_paymentId_seq" OWNER TO postgres;

--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 223
-- Name: Payment_paymentId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Payment_paymentId_seq" OWNED BY public."Payment"."paymentId";


--
-- TOC entry 244 (class 1259 OID 31898)
-- Name: Route; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Route" (
    "routeId" integer NOT NULL,
    "tripId" integer NOT NULL,
    "travelTime" integer NOT NULL
);


ALTER TABLE public."Route" OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 31897)
-- Name: Route_routeId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Route_routeId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Route_routeId_seq" OWNER TO postgres;

--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 243
-- Name: Route_routeId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Route_routeId_seq" OWNED BY public."Route"."routeId";


--
-- TOC entry 230 (class 1259 OID 20139)
-- Name: Seat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Seat" (
    status public."SeatStatus" DEFAULT 'Available'::public."SeatStatus" NOT NULL,
    "tripId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "seatClassId" integer NOT NULL,
    "seatId" integer NOT NULL
);


ALTER TABLE public."Seat" OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 20165)
-- Name: SeatClass; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SeatClass" (
    name text NOT NULL,
    price double precision NOT NULL,
    "seatClassId" integer NOT NULL
);


ALTER TABLE public."SeatClass" OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 20827)
-- Name: SeatClass_seatClassId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SeatClass_seatClassId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SeatClass_seatClassId_seq" OWNER TO postgres;

--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 237
-- Name: SeatClass_seatClassId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SeatClass_seatClassId_seq" OWNED BY public."SeatClass"."seatClassId";


--
-- TOC entry 236 (class 1259 OID 20818)
-- Name: Seat_seatId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Seat_seatId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Seat_seatId_seq" OWNER TO postgres;

--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 236
-- Name: Seat_seatId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Seat_seatId_seq" OWNED BY public."Seat"."seatId";


--
-- TOC entry 221 (class 1259 OID 20050)
-- Name: Shift; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Shift" (
    "staffId" text NOT NULL,
    "startTime" time without time zone NOT NULL,
    "endTime" time without time zone NOT NULL,
    "shiftId" integer NOT NULL
);


ALTER TABLE public."Shift" OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 20838)
-- Name: Shift_shiftId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Shift_shiftId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Shift_shiftId_seq" OWNER TO postgres;

--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 238
-- Name: Shift_shiftId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Shift_shiftId_seq" OWNED BY public."Shift"."shiftId";


--
-- TOC entry 222 (class 1259 OID 20062)
-- Name: Staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Staff" (
    "staffId" text NOT NULL,
    fullname text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Staff" OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 20191)
-- Name: Station; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Station" (
    "stationId" text NOT NULL,
    name text NOT NULL,
    location text NOT NULL
);


ALTER TABLE public."Station" OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 31886)
-- Name: StationConnection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StationConnection" (
    "stationConnectionId" integer NOT NULL,
    "startStationId" text NOT NULL,
    "endStationId" text NOT NULL
);


ALTER TABLE public."StationConnection" OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 31885)
-- Name: StationConnection_stationConnectionId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."StationConnection_stationConnectionId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."StationConnection_stationConnectionId_seq" OWNER TO postgres;

--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 241
-- Name: StationConnection_stationConnectionId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."StationConnection_stationConnectionId_seq" OWNED BY public."StationConnection"."stationConnectionId";


--
-- TOC entry 229 (class 1259 OID 20121)
-- Name: Ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ticket" (
    "orderId" integer NOT NULL,
    "passCCCD" text NOT NULL,
    "passName" text NOT NULL,
    status public."TicketStatus" DEFAULT 'Open'::public."TicketStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "seatId" integer,
    "ticketId" integer NOT NULL
);


ALTER TABLE public."Ticket" OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 20849)
-- Name: Ticket_ticketId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Ticket_ticketId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Ticket_ticketId_seq" OWNER TO postgres;

--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 239
-- Name: Ticket_ticketId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Ticket_ticketId_seq" OWNED BY public."Ticket"."ticketId";


--
-- TOC entry 231 (class 1259 OID 20153)
-- Name: Trip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Trip" (
    track text NOT NULL,
    "arrivalDate" timestamp(3) without time zone NOT NULL,
    "tripId" integer NOT NULL,
    "stationId" text
);


ALTER TABLE public."Trip" OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 20861)
-- Name: Trip_tripId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Trip_tripId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Trip_tripId_seq" OWNER TO postgres;

--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 240
-- Name: Trip_tripId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Trip_tripId_seq" OWNED BY public."Trip"."tripId";


--
-- TOC entry 219 (class 1259 OID 19997)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- TOC entry 4975 (class 2604 OID 20808)
-- Name: Feedback feedbackId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Feedback" ALTER COLUMN "feedbackId" SET DEFAULT nextval('public."Feedback_feedbackId_seq"'::regclass);


--
-- TOC entry 4959 (class 2604 OID 20096)
-- Name: Method methodId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Method" ALTER COLUMN "methodId" SET DEFAULT nextval('public."Method_methodId_seq"'::regclass);


--
-- TOC entry 4960 (class 2604 OID 20108)
-- Name: Order orderId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order" ALTER COLUMN "orderId" SET DEFAULT nextval('public."Order_orderId_seq"'::regclass);


--
-- TOC entry 4956 (class 2604 OID 20082)
-- Name: Payment paymentId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN "paymentId" SET DEFAULT nextval('public."Payment_paymentId_seq"'::regclass);


--
-- TOC entry 4977 (class 2604 OID 31901)
-- Name: Route routeId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Route" ALTER COLUMN "routeId" SET DEFAULT nextval('public."Route_routeId_seq"'::regclass);


--
-- TOC entry 4970 (class 2604 OID 20819)
-- Name: Seat seatId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seat" ALTER COLUMN "seatId" SET DEFAULT nextval('public."Seat_seatId_seq"'::regclass);


--
-- TOC entry 4972 (class 2604 OID 20828)
-- Name: SeatClass seatClassId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeatClass" ALTER COLUMN "seatClassId" SET DEFAULT nextval('public."SeatClass_seatClassId_seq"'::regclass);


--
-- TOC entry 4953 (class 2604 OID 20839)
-- Name: Shift shiftId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Shift" ALTER COLUMN "shiftId" SET DEFAULT nextval('public."Shift_shiftId_seq"'::regclass);


--
-- TOC entry 4976 (class 2604 OID 31889)
-- Name: StationConnection stationConnectionId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StationConnection" ALTER COLUMN "stationConnectionId" SET DEFAULT nextval('public."StationConnection_stationConnectionId_seq"'::regclass);


--
-- TOC entry 4966 (class 2604 OID 20850)
-- Name: Ticket ticketId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket" ALTER COLUMN "ticketId" SET DEFAULT nextval('public."Ticket_ticketId_seq"'::regclass);


--
-- TOC entry 4971 (class 2604 OID 20862)
-- Name: Trip tripId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Trip" ALTER COLUMN "tripId" SET DEFAULT nextval('public."Trip_tripId_seq"'::regclass);


--
-- TOC entry 5186 (class 0 OID 20033)
-- Dependencies: 220
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Customer" VALUES ('202416978', 'Manh Le Duy', 'mle529189@gmail.com', '0906031146', '$2b$10$kuwrhj.C26fbUnTZtXpNze8z5h7TMEZKwAsoQqp2qNyrLm/W6q6nS', 0, '2026-07-15 03:55:12.299', '2026-07-15 10:44:39.672', 1);


--
-- TOC entry 5199 (class 0 OID 20177)
-- Dependencies: 233
-- Data for Name: Feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Feedback" VALUES ('202416978', 'hdfkjdfkdkfasd', '2026-07-15 10:34:35.766', '2026-07-15 10:34:35.766', 1);


--
-- TOC entry 5192 (class 0 OID 20093)
-- Dependencies: 226
-- Data for Name: Method; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Method" VALUES (1, 'visa card', '"throught the visa');


--
-- TOC entry 5194 (class 0 OID 20105)
-- Dependencies: 228
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Order" VALUES (36, '202416978', '202416977', 'Confirmed', 24, '2026-07-20 18:31:23.858', '2026-07-21 08:21:43.58');


--
-- TOC entry 5190 (class 0 OID 20079)
-- Dependencies: 224
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Payment" VALUES (23, 35, 1, 100000, '2026-07-15 17:33:11.179', '2026-07-15 17:33:11.179');
INSERT INTO public."Payment" VALUES (24, 36, 1, 100000, '2026-07-20 18:31:23.858', '2026-07-20 18:31:23.858');


--
-- TOC entry 5210 (class 0 OID 31898)
-- Dependencies: 244
-- Data for Name: Route; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Route" VALUES (1, 7, 230);
INSERT INTO public."Route" VALUES (2, 6, 199);
INSERT INTO public."Route" VALUES (3, 3, 168);
INSERT INTO public."Route" VALUES (4, 4, 109);
INSERT INTO public."Route" VALUES (5, 2, 229);
INSERT INTO public."Route" VALUES (6, 1, 288);
INSERT INTO public."Route" VALUES (7, 6, 202);
INSERT INTO public."Route" VALUES (8, 8, 113);
INSERT INTO public."Route" VALUES (9, 10, 102);
INSERT INTO public."Route" VALUES (10, 1, 36);
INSERT INTO public."Route" VALUES (11, 2, 90);
INSERT INTO public."Route" VALUES (12, 5, 278);
INSERT INTO public."Route" VALUES (13, 11, 58);
INSERT INTO public."Route" VALUES (14, 1, 239);
INSERT INTO public."Route" VALUES (15, 12, 212);
INSERT INTO public."Route" VALUES (16, 1, 157);
INSERT INTO public."Route" VALUES (17, 4, 285);
INSERT INTO public."Route" VALUES (18, 11, 53);
INSERT INTO public."Route" VALUES (19, 2, 143);
INSERT INTO public."Route" VALUES (20, 5, 162);
INSERT INTO public."Route" VALUES (21, 1, 36);
INSERT INTO public."Route" VALUES (22, 4, 227);
INSERT INTO public."Route" VALUES (23, 12, 39);
INSERT INTO public."Route" VALUES (24, 2, 72);
INSERT INTO public."Route" VALUES (25, 1, 184);
INSERT INTO public."Route" VALUES (26, 1, 108);
INSERT INTO public."Route" VALUES (27, 6, 296);
INSERT INTO public."Route" VALUES (28, 8, 183);
INSERT INTO public."Route" VALUES (29, 5, 61);
INSERT INTO public."Route" VALUES (30, 1, 179);


--
-- TOC entry 5196 (class 0 OID 20139)
-- Dependencies: 230
-- Data for Name: Seat; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 3, 14);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 3, 15);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 1, 7);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 3, 13);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 1, 4);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 1, 5);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 1, 6);
INSERT INTO public."Seat" VALUES ('Booked', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 1, 2);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 1, 1);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 1, 3);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 2, 8);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 2, 9);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 2, 10);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 2, 11);
INSERT INTO public."Seat" VALUES ('Available', 1, '2023-10-15 14:30:00', '2023-10-15 14:30:00', 3, 12);


--
-- TOC entry 5198 (class 0 OID 20165)
-- Dependencies: 232
-- Data for Name: SeatClass; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."SeatClass" VALUES ('High', 100000, 1);
INSERT INTO public."SeatClass" VALUES ('Medium', 50000, 2);
INSERT INTO public."SeatClass" VALUES ('Low', 20000, 3);


--
-- TOC entry 5187 (class 0 OID 20050)
-- Dependencies: 221
-- Data for Name: Shift; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Shift" VALUES ('202416977', '05:14:00', '06:15:00', 1);


--
-- TOC entry 5188 (class 0 OID 20062)
-- Dependencies: 222
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Staff" VALUES ('202416977', 'manh le', 'mle400000@gmail.com', '0906031146', '$2b$10$2U.LlRUF.90ELzj1Ok1hMOKTIOGOkF.nd0IacHarsa63ZFZIzfCAW', 'staff', '2026-07-15 16:07:46.199', '2026-07-15 16:07:46.199');


--
-- TOC entry 5200 (class 0 OID 20191)
-- Dependencies: 234
-- Data for Name: Station; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Station" VALUES ('VN1000', 'Emmittview', 'Hai phong');
INSERT INTO public."Station" VALUES ('VN1001', 'Rolfson, Abernathy and Larkin', 'Lake Vada');
INSERT INTO public."Station" VALUES ('VN1002', 'Bins LLC', 'O''Konstead');
INSERT INTO public."Station" VALUES ('VN1003', 'Wuckert LLC', 'West Willisstad');
INSERT INTO public."Station" VALUES ('VN1004', 'Emard and Sons', 'Rockybury');
INSERT INTO public."Station" VALUES ('VN1005', 'Lynch and Sons', 'Aldastad');
INSERT INTO public."Station" VALUES ('VN1006', 'Schoen and Sons', 'Xavierside');


--
-- TOC entry 5208 (class 0 OID 31886)
-- Dependencies: 242
-- Data for Name: StationConnection; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."StationConnection" VALUES (1, 'Norberto', 'Bernhard');
INSERT INTO public."StationConnection" VALUES (2, 'VN1000', 'VN1001');
INSERT INTO public."StationConnection" VALUES (3, 'VN1000', 'VN1002');
INSERT INTO public."StationConnection" VALUES (4, 'VN1000', 'VN1003');
INSERT INTO public."StationConnection" VALUES (5, 'VN1000', 'VN1004');
INSERT INTO public."StationConnection" VALUES (7, 'VN1001', 'VN1005');
INSERT INTO public."StationConnection" VALUES (8, 'VN1001', 'VN1003');
INSERT INTO public."StationConnection" VALUES (9, 'VN1001', 'VN1000');
INSERT INTO public."StationConnection" VALUES (10, 'VN1000', 'VN1006');
INSERT INTO public."StationConnection" VALUES (11, 'VN1002', 'VN1005');
INSERT INTO public."StationConnection" VALUES (12, 'VN1002', 'VN1003');
INSERT INTO public."StationConnection" VALUES (13, 'VN1002', 'VN1001');
INSERT INTO public."StationConnection" VALUES (14, 'VN1003', 'VN1004');
INSERT INTO public."StationConnection" VALUES (15, 'VN1003', 'VN1000');
INSERT INTO public."StationConnection" VALUES (16, 'VN1004', 'VN1005');
INSERT INTO public."StationConnection" VALUES (17, 'VN1005', 'VN1006');
INSERT INTO public."StationConnection" VALUES (18, 'VN1006', 'VN1003');
INSERT INTO public."StationConnection" VALUES (19, 'VN1006', 'VN1002');
INSERT INTO public."StationConnection" VALUES (20, 'VN1006', 'VN1000');
INSERT INTO public."StationConnection" VALUES (6, 'VN1000', 'VN1005');


--
-- TOC entry 5195 (class 0 OID 20121)
-- Dependencies: 229
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Ticket" VALUES (36, '123456789', 'Le duy manh', 'Open', '2026-07-20 18:31:23.858', '2026-07-20 18:31:23.858', 2, 63);


--
-- TOC entry 5197 (class 0 OID 20153)
-- Dependencies: 231
-- Data for Name: Trip; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Trip" VALUES ('hai phong', '2023-10-15 14:30:00', 1, NULL);
INSERT INTO public."Trip" VALUES ('HaiPhong', '2081-09-18 19:41:50.968', 15, 'VN1003');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2080-05-20 01:13:20.16', 16, 'VN1000');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2068-10-23 20:25:03.428', 2, 'VN1000');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2034-10-02 08:24:15.992', 3, 'VN1000');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2019-03-11 18:12:01.392', 4, 'VN1001');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2070-05-05 23:04:14.233', 5, 'VN1001');
INSERT INTO public."Trip" VALUES ('Hai Phong', '1994-09-08 19:28:28.274', 6, 'VN1002');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2005-10-16 19:44:52.328', 7, 'VN1002');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2037-09-15 10:59:01.447', 8, 'VN1002');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2093-01-23 02:43:07.189', 9, 'VN1003');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2004-05-20 14:52:22.118', 10, 'VN1003');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2018-08-01 12:52:10.253', 11, 'VN1004');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2070-03-12 18:01:24.42', 12, 'VN1005');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2050-12-04 20:55:36.641', 13, 'VN1006');
INSERT INTO public."Trip" VALUES ('Hai Phong', '2089-09-13 01:32:03.695', 14, 'VN1006');


--
-- TOC entry 5185 (class 0 OID 19997)
-- Dependencies: 219
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations VALUES ('d705cb2e-a4be-43a5-808f-9ed46ae92685', '6a9edccb5a167c2d84996a219f5910eb04e38c71141c2c0ea2ca8b9c4f5c4aff', '2026-07-14 09:36:14.919754+07', '20260714023614_first', NULL, NULL, '2026-07-14 09:36:14.815218+07', 1);
INSERT INTO public._prisma_migrations VALUES ('1ed433d9-6965-432f-9525-d50648c6ae48', '08b21f14cb4445eebf51279ad3279415b8929b5c5dbc28cab1700661dc64b52a', '2026-07-14 16:43:16.16603+07', '20260714094316_chage', NULL, NULL, '2026-07-14 16:43:16.064444+07', 1);
INSERT INTO public._prisma_migrations VALUES ('a142c9f3-aa1a-439f-9c8f-b36b9a3ee053', 'e158d5e2d7470e7ffa91128411dc36d78d3914755ead9f05e6496c500afa1671', '2026-07-14 16:59:34.682047+07', '20260714095934_chage', NULL, NULL, '2026-07-14 16:59:34.675509+07', 1);
INSERT INTO public._prisma_migrations VALUES ('c4b07b90-b74b-4487-a6ed-d34fe6c93b87', '1e6ab96b586fc1dc28cdcaa1b870275f2e7f02c0552323f03b19a8b96d478778', '2026-07-14 17:25:34.652675+07', '20260714102534_make', NULL, NULL, '2026-07-14 17:25:34.646154+07', 1);
INSERT INTO public._prisma_migrations VALUES ('b56ed09f-da60-448e-9ca3-775fc38d6e41', '28c33caa1cbb27d0a71ba12e2f1396f8b8e0c1e8a3ebdb7681d70ad5afb5f2d2', '2026-07-14 17:30:47.00472+07', '20260714103046_make', NULL, NULL, '2026-07-14 17:30:46.999254+07', 1);
INSERT INTO public._prisma_migrations VALUES ('f8170c64-6ccf-4742-b614-23a3248d277f', '2f8a1f5f3e771da6babfaad6a35b8c4d5d4445054975924d2ad2619cafc05f12', '2026-07-14 18:43:37.394282+07', '20260714114337_add', NULL, NULL, '2026-07-14 18:43:37.387218+07', 1);
INSERT INTO public._prisma_migrations VALUES ('451102e7-d64c-4cbf-95e0-697c8edc183b', 'e25732f4ed92bb4698f65e2a197d0b5a1cf3707f38c8dffe70f6974684b091b7', '2026-07-14 20:04:14.85644+07', '20260714130414_add', NULL, NULL, '2026-07-14 20:04:14.848342+07', 1);
INSERT INTO public._prisma_migrations VALUES ('ac161e29-98d4-4c02-b574-5b49e1acc503', '93d9fab1da125408c5366d660ba8b29d50b1d7c3089490343668422d88ff2484', '2026-07-14 20:43:27.054229+07', '20260714134327_add_canceled_to_ticket', NULL, NULL, '2026-07-14 20:43:27.05127+07', 1);
INSERT INTO public._prisma_migrations VALUES ('113fbf33-a506-4bf6-8df7-0aa7b5332cfd', '2a9f55abf716498984556ffa49a3d3b1ebbeb92601970038760ebe9a72bf6fcc', '2026-07-14 20:46:42.781085+07', '20260714134642_nullable_the_seat_on_ticket', NULL, NULL, '2026-07-14 20:46:42.773939+07', 1);
INSERT INTO public._prisma_migrations VALUES ('0e3e6aad-0eee-4a3f-8c91-206add887aad', '9c31e564c9ef23e23c9860648527139feb146f56a5e707e7d244d2f3305d6a7d', '2026-07-18 17:42:56.198514+07', '20260718104256_add', NULL, NULL, '2026-07-18 17:42:56.188462+07', 1);
INSERT INTO public._prisma_migrations VALUES ('1e4cf57b-a54c-47bf-b6c4-f6c3c9201368', '7b582f33d9f911d4aa1ec060ba43f225c02f2ce25ecafd791e97c8b8a0803daa', '2026-07-18 18:32:36.124135+07', '20260718113236_change', NULL, NULL, '2026-07-18 18:32:36.106107+07', 1);


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 235
-- Name: Feedback_feedbackId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Feedback_feedbackId_seq"', 1, true);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 225
-- Name: Method_methodId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Method_methodId_seq"', 1, true);


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 227
-- Name: Order_orderId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Order_orderId_seq"', 36, true);


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 223
-- Name: Payment_paymentId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Payment_paymentId_seq"', 24, true);


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 243
-- Name: Route_routeId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Route_routeId_seq"', 1, false);


--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 237
-- Name: SeatClass_seatClassId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SeatClass_seatClassId_seq"', 3, true);


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 236
-- Name: Seat_seatId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Seat_seatId_seq"', 15, true);


--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 238
-- Name: Shift_shiftId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Shift_shiftId_seq"', 1, true);


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 241
-- Name: StationConnection_stationConnectionId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."StationConnection_stationConnectionId_seq"', 1, false);


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 239
-- Name: Ticket_ticketId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Ticket_ticketId_seq"', 63, true);


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 240
-- Name: Trip_tripId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Trip_tripId_seq"', 1, true);


--
-- TOC entry 4982 (class 2606 OID 20048)
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY ("customerId");


--
-- TOC entry 5005 (class 2606 OID 20811)
-- Name: Feedback Feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedbackId");


--
-- TOC entry 4991 (class 2606 OID 20103)
-- Name: Method Method_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Method"
    ADD CONSTRAINT "Method_pkey" PRIMARY KEY ("methodId");


--
-- TOC entry 4994 (class 2606 OID 20119)
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("orderId");


--
-- TOC entry 4989 (class 2606 OID 20091)
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("paymentId");


--
-- TOC entry 5011 (class 2606 OID 31906)
-- Name: Route Route_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Route"
    ADD CONSTRAINT "Route_pkey" PRIMARY KEY ("routeId");


--
-- TOC entry 5003 (class 2606 OID 20831)
-- Name: SeatClass SeatClass_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeatClass"
    ADD CONSTRAINT "SeatClass_pkey" PRIMARY KEY ("seatClassId");


--
-- TOC entry 4999 (class 2606 OID 20822)
-- Name: Seat Seat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seat"
    ADD CONSTRAINT "Seat_pkey" PRIMARY KEY ("seatId");


--
-- TOC entry 4984 (class 2606 OID 20842)
-- Name: Shift Shift_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_pkey" PRIMARY KEY ("shiftId");


--
-- TOC entry 4987 (class 2606 OID 20077)
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY ("staffId");


--
-- TOC entry 5009 (class 2606 OID 31896)
-- Name: StationConnection StationConnection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StationConnection"
    ADD CONSTRAINT "StationConnection_pkey" PRIMARY KEY ("stationConnectionId");


--
-- TOC entry 5007 (class 2606 OID 20200)
-- Name: Station Station_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Station"
    ADD CONSTRAINT "Station_pkey" PRIMARY KEY ("stationId");


--
-- TOC entry 4996 (class 2606 OID 20854)
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY ("ticketId");


--
-- TOC entry 5001 (class 2606 OID 20865)
-- Name: Trip Trip_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Trip"
    ADD CONSTRAINT "Trip_pkey" PRIMARY KEY ("tripId");


--
-- TOC entry 4979 (class 2606 OID 20010)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4980 (class 1259 OID 20210)
-- Name: Customer_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Customer_email_key" ON public."Customer" USING btree (email);


--
-- TOC entry 4992 (class 1259 OID 20212)
-- Name: Order_paymentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Order_paymentId_key" ON public."Order" USING btree ("paymentId");


--
-- TOC entry 4985 (class 1259 OID 20211)
-- Name: Staff_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Staff_email_key" ON public."Staff" USING btree (email);


--
-- TOC entry 4997 (class 1259 OID 20872)
-- Name: Ticket_seatId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Ticket_seatId_key" ON public."Ticket" USING btree ("seatId");


--
-- TOC entry 5025 (class 2620 OID 26591)
-- Name: Payment trg_create_pay_detail; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_create_pay_detail AFTER INSERT ON public."Payment" FOR EACH ROW EXECUTE FUNCTION public.fn_update_loyalty_on_payment();


--
-- TOC entry 5031 (class 2620 OID 23703)
-- Name: Ticket trg_create_ticket; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_create_ticket AFTER INSERT ON public."Ticket" FOR EACH ROW EXECUTE FUNCTION public.fn_lock_seat_on_insert();


--
-- TOC entry 5027 (class 2620 OID 26593)
-- Name: Order trg_delete_order_point_refund; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_delete_order_point_refund AFTER DELETE ON public."Order" FOR EACH ROW EXECUTE FUNCTION public.fn_refund_points_on_order_delete();


--
-- TOC entry 5032 (class 2620 OID 23707)
-- Name: Ticket trg_delete_ticket; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_delete_ticket AFTER DELETE ON public."Ticket" FOR EACH ROW EXECUTE FUNCTION public.fn_release_seat_on_delete();


--
-- TOC entry 5028 (class 2620 OID 29602)
-- Name: Order trg_deny_order_point_refund; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_deny_order_point_refund AFTER UPDATE ON public."Order" FOR EACH ROW EXECUTE FUNCTION public.fn_refund_points_on_order_deny();


--
-- TOC entry 5029 (class 2620 OID 29604)
-- Name: Order trg_on_order_denied; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_on_order_denied AFTER UPDATE ON public."Order" FOR EACH ROW WHEN ((new.status = 'Denied'::public."OrderStatus")) EXECUTE FUNCTION public.clean_tickets_on_denied_order();


--
-- TOC entry 5035 (class 2620 OID 31908)
-- Name: Seat trg_seat_state_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_seat_state_change AFTER UPDATE ON public."Seat" FOR EACH ROW EXECUTE FUNCTION public.notify_seat_change();


--
-- TOC entry 5033 (class 2620 OID 23705)
-- Name: Ticket trg_update_ticket; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_update_ticket AFTER UPDATE ON public."Ticket" FOR EACH ROW EXECUTE FUNCTION public.fn_update_ticket_seats();


--
-- TOC entry 5023 (class 2620 OID 29571)
-- Name: Customer trg_updated_at_customer; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_updated_at_customer AFTER UPDATE ON public."Customer" FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


--
-- TOC entry 5037 (class 2620 OID 29572)
-- Name: Feedback trg_updated_at_feedback; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_updated_at_feedback AFTER UPDATE ON public."Feedback" FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


--
-- TOC entry 5030 (class 2620 OID 29573)
-- Name: Order trg_updated_at_order; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_updated_at_order AFTER UPDATE ON public."Order" FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


--
-- TOC entry 5026 (class 2620 OID 29574)
-- Name: Payment trg_updated_at_payment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_updated_at_payment AFTER UPDATE ON public."Payment" FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


--
-- TOC entry 5036 (class 2620 OID 29575)
-- Name: Seat trg_updated_at_seat; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_updated_at_seat AFTER UPDATE ON public."Seat" FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


--
-- TOC entry 5024 (class 2620 OID 29576)
-- Name: Staff trg_updated_at_staff; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_updated_at_staff AFTER UPDATE ON public."Staff" FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


--
-- TOC entry 5034 (class 2620 OID 29577)
-- Name: Ticket trg_updated_at_ticket; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_updated_at_ticket AFTER UPDATE ON public."Ticket" FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


--
-- TOC entry 5022 (class 2606 OID 20260)
-- Name: Feedback Feedback_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"("customerId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5014 (class 2606 OID 20225)
-- Name: Order Order_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"("customerId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5015 (class 2606 OID 22272)
-- Name: Order Order_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"("paymentId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5016 (class 2606 OID 20230)
-- Name: Order Order_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"("staffId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5013 (class 2606 OID 20220)
-- Name: Payment Payment_methodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES public."Method"("methodId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5019 (class 2606 OID 20878)
-- Name: Seat Seat_seatClassId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seat"
    ADD CONSTRAINT "Seat_seatClassId_fkey" FOREIGN KEY ("seatClassId") REFERENCES public."SeatClass"("seatClassId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 5020 (class 2606 OID 27327)
-- Name: Seat Seat_tripId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seat"
    ADD CONSTRAINT "Seat_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES public."Trip"("tripId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5012 (class 2606 OID 27322)
-- Name: Shift Shift_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"("staffId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5017 (class 2606 OID 20240)
-- Name: Ticket Ticket_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"("orderId") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5018 (class 2606 OID 29565)
-- Name: Ticket Ticket_seatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES public."Seat"("seatId") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5021 (class 2606 OID 31116)
-- Name: Trip Trip_stationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Trip"
    ADD CONSTRAINT "Trip_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES public."Station"("stationId") ON UPDATE CASCADE ON DELETE SET NULL;


-- Completed on 2026-07-23 20:32:16

--
-- PostgreSQL database dump complete
--

\unrestrict a6SskbCsLnqlHfFFfzSDQJsn80twdv5girJXcE3ZI8FuJje6HCfQNNy2oksBR8f

