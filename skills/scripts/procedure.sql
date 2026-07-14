USE STMX_V2;

GO


-- Truy vấn 1: Procedure MakeOrder (Atomic booking)
-- Chức năng: Xử lý giao dịch đặt nhiều vé cùng lúc. Tự động tính tiền, kiểm tra ghế trống. ROLLBACK nếu có lỗi.

CREATE OR ALTER PROCEDURE MakeOrder
    @p_customer_id INT,
    @p_staff_id INT, 
    @p_method_id INT,
    @p_tickets_json NVARCHAR(MAX) 
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @v_total_amount FLOAT = 0;
    DECLARE @v_unavailable_count INT = 0;
    DECLARE @v_new_order_id INT; -- Biến dùng để hứng mã order_id tự sinh
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Kiểm tra xem có ghế nào trong danh sách bị người khác đặt mất chưa 
        SELECT @v_unavailable_count = COUNT(*) 
        FROM SEAT s
        INNER JOIN OPENJSON(@p_tickets_json)
        WITH (seat_id INT '$.seat_id') jt ON s.seat_id = jt.seat_id
        WHERE s.[status] <> 'Available';

        IF @v_unavailable_count > 0 
        BEGIN 
            RAISERROR('Ghế không khả dụng!', 16, 1);
        END;

        -- 2. Tạo đơn hàng (Bỏ cột order_id để SQL Server tự tăng)
        INSERT INTO [ORDER] (customer_id, staff_id) 
        VALUES (@p_customer_id, @p_staff_id);

        -- Lấy mã ID của đơn hàng vừa tạo ở lệnh INSERT ngay phía trên
        SET @v_new_order_id = SCOPE_IDENTITY();

        -- 3. Tạo chi tiết vé từ mảng JSON (Bỏ cột ticket_id, dùng @v_new_order_id vừa lấy được)
        INSERT INTO TICKET (order_id, seat_id, pass_name, pass_cccd, applied_price, [status])
        SELECT @v_new_order_id, seat_id, pass_name, pass_cccd, applied_price, 'Used'
        FROM OPENJSON(@p_tickets_json)
        WITH (
            seat_id INT '$.seat_id', 
            pass_name NVARCHAR(100) '$.pass_name', 
            pass_cccd VARCHAR(20) '$.pass_cccd', 
            applied_price FLOAT '$.applied_price'
        );

        -- 4. Tính tổng tiền và lưu vào PAY_DETAIL
        SELECT @v_total_amount = SUM(applied_price) 
        FROM OPENJSON(@p_tickets_json) WITH (applied_price FLOAT '$.applied_price');
        
        INSERT INTO PAY_DETAIL (order_id, method_id, final_amount) 
        VALUES (@v_new_order_id, @p_method_id, @v_total_amount);

        COMMIT TRANSACTION;
        SELECT 'Đặt vé thành công!' AS Message, @v_new_order_id AS GeneratedOrderId;
    END TRY
    BEGIN CATCH
        -- Xử lý ngoại lệ: bắt lỗi và tự động ROLLBACK
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 'Giao dịch thất bại do lỗi hệ thống hoặc trùng ghế!' AS Message;
    END CATCH
END;
GO

-- Truy vấn 2: Procedure ticket_cancel (Hủy vé)
CREATE or alter PROCEDURE ticket_cancel
    @p_ticket_id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE TICKET 
    SET [status] = 'Canceled', seat_id = NULL 
    WHERE ticket_id = @p_ticket_id;
END;
GO
-- Truy vấn 3: Procedure ticket_change (Đổi vé)
CREATE or alter PROCEDURE ticket_change
    @p_ticket_id INT, 
    @p_seat_id INT, 
    @p_pass_cccd VARCHAR(20), 
    @p_pass_name NVARCHAR(100)
AS
BEGIN 
    SET NOCOUNT ON;
    UPDATE TICKET
    SET seat_id = @p_seat_id, pass_cccd = @p_pass_cccd, pass_name = @p_pass_name
    WHERE ticket_id = @p_ticket_id;
END;
GO

-- Truy vấn 4: Procedure create_new_customer (Thêm khách hàng)
-- SQL Server không có INSERT IGNORE, thay vào đó ta dùng cấu trúc IF NOT EXISTS hoặc WHERE NOT EXISTS
CREATE or alter PROCEDURE create_new_customer
    @p_full_name NVARCHAR(100), 
    @p_gender NVARCHAR(10), 
    @p_phone VARCHAR(20), 
    @p_birthdate DATE
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN
        INSERT INTO CUSTOMER(full_name, gender, phone, birthdate, point, rank)
        VALUES(@p_full_name, @p_gender, @p_phone, @p_birthdate, 0, 'Bronze');
    END
END;
GO

-- Truy vấn 5: Trigger create_ticket (Khóa ghế)
-- T-SQL kích hoạt trigger theo Batch, sử dụng bảng lồng 'Inserted'
CREATE or alter TRIGGER trg_create_ticket ON TICKET AFTER INSERT 
AS
BEGIN 
    SET NOCOUNT ON;
    UPDATE s
    SET s.[status] = 'Unavailable' 
    FROM SEAT s
    INNER JOIN Inserted i ON s.seat_id = i.seat_id
    WHERE i.seat_id IS NOT NULL;
END;
GO

-- Truy vấn 6: Trigger update_ticket (Hoán đổi ghế)
-- Kết hợp cả bảng 'Deleted' (chứa dữ liệu cũ) và 'Inserted' (chứa dữ liệu mới)
CREATE or alter TRIGGER trg_update_ticket ON TICKET AFTER UPDATE 
AS
BEGIN 
    SET NOCOUNT ON;
    
    -- Nhả ghế cũ ra (Available) nếu ghế bị thay đổi hoặc gán bằng NULL
    UPDATE s
    SET s.[status] = 'Available'
    FROM SEAT s
    INNER JOIN Deleted d ON s.seat_id = d.seat_id
    INNER JOIN Inserted i ON d.ticket_id = i.ticket_id
    WHERE d.seat_id IS NOT NULL AND d.seat_id <> ISNULL(i.seat_id, -1);

    -- Khóa ghế mới vào (Unavailable)
    UPDATE s
    SET s.[status] = 'Unavailable'
    FROM SEAT s
    INNER JOIN Inserted i ON s.seat_id = i.seat_id
    INNER JOIN Deleted d ON i.ticket_id = d.ticket_id
    WHERE i.seat_id IS NOT NULL AND i.seat_id <> ISNULL(d.seat_id, -1);
END;
GO
CREATE or alter TRIGGER trg_create_ticket ON TICKET AFTER DELETE
AS
BEGIN 
    SET NOCOUNT ON;
    UPDATE s
    SET s.[status] = 'Available' 
    FROM SEAT s
    INNER JOIN Inserted i ON s.seat_id = i.seat_id
    WHERE i.seat_id IS NOT NULL;
END;
GO


-- Truy vấn 7: Trigger create_pay_detail (Tích điểm tự động)
CREATE or alter TRIGGER trg_create_pay_detail ON PAY_DETAIL AFTER INSERT 
AS
BEGIN
    SET NOCOUNT ON;

    -- Cập nhật điểm và hạng của khách hàng dựa vào dữ liệu mới thêm từ bảng Inserted
    UPDATE c
    SET c.point = ISNULL(c.point, 0) + (i.final_amount / 100000),
        c.rank = CASE 
            WHEN (ISNULL(c.point, 0) + (i.final_amount / 100000)) >= 20 THEN 'Gold'
            WHEN (ISNULL(c.point, 0) + (i.final_amount / 100000)) >= 10 THEN 'Silver'
            ELSE 'Bronze' 
        END
    FROM CUSTOMER c
    INNER JOIN [ORDER] o ON c.customer_id = o.customer_id
    INNER JOIN Inserted i ON o.order_id = i.order_id;
END;
GO

-- Truy vấn 8: Trigger delete_order (Hoàn trừ điểm)
-- SQL Server không có BEFORE DELETE, thay vào đó ta dùng INSTEAD OF DELETE hoặc AFTER DELETE.
-- Ở đây dùng AFTER DELETE để đồng bộ dữ liệu chuẩn xác nhất dựa trên bảng 'Deleted'
CREATE or alter TRIGGER trg_delete_order_trigger ON [ORDER] AFTER DELETE 
AS
BEGIN
    SET NOCOUNT ON;

    -- Tính tổng tiền hoàn của từng order bị xóa bằng CTE (Bảng tạm thời)
    WITH RefundCTE AS (
        SELECT d.customer_id, ISNULL(SUM(p.final_amount), 0) AS v_refund_amount
        FROM Deleted d
        LEFT JOIN PAY_DETAIL p ON d.order_id = p.order_id
        GROUP BY d.customer_id
    )
    UPDATE c
    SET c.point = CASE WHEN (ISNULL(c.point, 0) - (r.v_refund_amount / 100000)) < 0 THEN 0 
                       ELSE (ISNULL(c.point, 0) - (r.v_refund_amount / 100000)) END,
        c.rank = CASE 
            WHEN CASE WHEN (ISNULL(c.point, 0) - (r.v_refund_amount / 100000)) < 0 THEN 0 
                      ELSE (ISNULL(c.point, 0) - (r.v_refund_amount / 100000)) END >= 20 THEN 'Gold'
            WHEN CASE WHEN (ISNULL(c.point, 0) - (r.v_refund_amount / 100000)) < 0 THEN 0 
                      ELSE (ISNULL(c.point, 0) - (r.v_refund_amount / 100000)) END >= 10 THEN 'Silver'
            ELSE 'Bronze' 
        END
    FROM CUSTOMER c
    INNER JOIN RefundCTE r ON c.customer_id = r.customer_id;
END;

GO
CREATE OR ALTER TRIGGER trg_delete_order_instead_of ON [ORDER]
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Xóa PAY_DETAIL trước (Lúc này Trigger DELETE trên PAY_DETAIL SẼ CHẠY)
    DELETE pd 
    FROM PAY_DETAIL pd
    INNER JOIN Deleted d ON pd.order_id = d.order_id;

    -- 2. Xóa TICKET (Lúc này Trigger DELETE trên TICKET SẼ CHẠY để nhả ghế)
    DELETE t
    FROM TICKET t
    INNER JOIN Deleted d ON t.order_id = d.order_id;

    -- 3. Cuối cùng mới xóa ORDER chính
    DELETE o
    FROM [ORDER] o
    INNER JOIN Deleted d ON o.order_id = d.order_id;
END;
GO