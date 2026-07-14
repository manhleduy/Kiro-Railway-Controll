---
description: "Rules for interacting with the database schema, views, procedures, and triggers"
globs: ["prisma/schema.prisma", "src/controllers/**/*", "src/services/db.ts"]
---

# 🗄️ Database Native Logic & Capabilities

The underlying database contains pre-built native Views, Triggers, and Stored Procedures. You MUST read this file before writing queries to prevent writing redundant logic in the application layer.

---

## 1. Database Views (Read-Only Schemas)
Do not write complex multi-table joins in the application layer for the following datasets. Use these existing database views instead:

### `v_user_activity_summary`
* **Purpose:** Combines `users`, `sessions`, and `logs` to give an aggregated active time count.
* **How to query via ORM:** Treat this as a read-only model using `prisma.v_user_activity_summary.findMany()`. Never run manual joins across these tables.

---

## 2. Database Triggers (Automated Side-Effects)
The database automatically handles the following lifecycle events. **Do not write backend application logic to duplicate these actions:**

### `trg_update_at`
* **Table:** All major tables (`Customer`, `Feedback`, `Order`, `Payment`, `Seat`, `Staff`, `Ticket`).
* **Behavior:** Automatically updates the `updatedAt` column to `now()` on any `UPDATE` operation. 
* **Agent Rule:** Never pass an updated timestamp manually when using the update query

### `trg_create_ticket
* **Table:** `Ticket`
* **Behavior:** when a ticket is created the seat which is booked will be automatically set to 'Booked'
* **Agent Rule:** Never manually update the status of the seat when a ticket is created

### `trg_update_ticket`
* **Table:** `Ticket`
* **Bahavior:** Ticket can be deleted without delete the order consist of this, ticket can only be calceled, this trigger automatically resolve the state of the seat especially when user change the seat
* **Agent Rule:** Never manually update the status of the seat when the ticket is updated


### `trg_delete_ticket`
* **Table:** `Ticket`
* **Behavior:** automatically update the status of the seat to Available when a order be deleted the related ticket also be deleted
* **Agent rules:** Never manually update the status of the seat when the ticket is updated



### `tg_create_audit_log`
* **Table:** `billing_transactions`
* **Behavior:** Automatically inserts a record into the `audit_logs` security table whenever a transaction status changes. Do not trigger a secondary Prisma create request for logs here.

---

## 3. Stored Procedures & Functions
Heavy computations and batch updates are encapsulated inside database procedures. 

### `p_make_order( p_customer_id INT, p_staff_id INT, p_method_id INT, p_tickets_json JSONB)`
* **Purpose:** check if any requested seat is already taken, reate the main order record, insert ticket detail from the json array, Maps to TICKET table: order_id, seat_id, pass_name, pass_cccd, applied_price, status. Calculate total amount and record in PAY_DETAIL 
* **How to invoke:** Execute this directly via raw query syntax. 
* **Example for Agent:** ```typescript
    await prisma.$executeRaw`
        DO $$ 
        DECLARE 
            -- initialize with  JSONB datatype of Postgres
            v_json_data JSONB := '[
                { "seatId": 4,  "passName": "Trần Thị B", "passCCCD": "012345678912" },
                { "seatId": 5, "passName": "Nguyễn Văn C", "passCCCD": "012345678913" }
            ]';
        BEGIN 
        
            CALL p_make_order(
                '202416978',           -- p_customer_id
                1,                      -- p_method_id
                v_json_data           -- p_tickets_json
            );
        END $$;
    `;
    ```
* **Agent Rule:** remember this procedure using the v_json_data data block 
**
### `ticket_cancel`
* **Purpose:** cancel a ticket
* **How to invoke** Execute directly via raw query syntax
* **Example for Agent: ```typescript
    await prisma.$executeRaw`
        call ticket_cancel(30); --- id of the selected seat
    `
### `ticket_change`
* **Purpose:** change the information of an ticket
* **How to invoke** Execute directly via raw query syntax
* **Example for Agent: ```typescript
    await prisma.$executeRaw`
     call ticket_change(
        31,
        12,
        '202516879',
        'robert haha'
     )
    `

---

## 4. Strict Guardrails for the Agent
1.  **Check Before You Join:** Before writing any backend aggregation or multi-table lookup, look at the Views list above.
2.  **No Direct Schema DDL:** Do not attempt to drop, alter, or create raw SQL triggers or views directly from the app codebase without asking the user to prepare a structured migration step first.