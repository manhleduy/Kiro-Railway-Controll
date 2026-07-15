# Requirements Document

## Introduction

The Railway Control System is a full-stack monorepo application for railway booking and operations management. It exposes a NestJS GraphQL API (code-first, backed by PostgreSQL via Prisma) and a React + Vite SPA frontend. The platform serves two user classes: Customers who browse trips and manage bookings, and Staff who approve orders, assign tickets, and manage operational data. The system leverages native database stored procedures (`p_make_order`, `ticket_cancel`, `ticket_change`) and triggers (`trg_update_at`, `trg_create_ticket`, `trg_update_ticket`, `trg_delete_ticket`) for transactional integrity — no application layer logic shall duplicate these behaviors.

---

## Glossary

- **System**: The Railway Control System application (backend API + frontend SPA).
- **API**: The NestJS GraphQL backend service.
- **SPA**: The React + Vite frontend single-page application.
- **Customer**: A registered passenger user who browses trips, creates orders, and submits feedback.
- **Staff**: An operations employee with a defined role who can approve orders, manage tickets, and record shifts.
- **Trip**: A scheduled railway journey identified by a track string and an arrival date/time.
- **Seat**: An individual seat on a Trip with a status of `Available`, `Booked`, or `Unavailable`.
- **SeatClass**: A category (e.g., Economy, Business) with an associated price, shared across seats.
- **Order**: A booking record created by a Customer that aggregates one or more Tickets; status is `Pending`, `Confirmed`, or `Denied`.
- **Ticket**: A single passenger entry within an Order, carrying passenger CCCD (national ID) and name, linked to one Seat; status is `Open`, `Canceled`, or `Resolved`.
- **Payment**: A financial record linked one-to-one with an Order, referencing a Method and a calculated price.
- **Method**: A payment method entry with a name and description.
- **Station**: A graph node representing a railway station with a name, location, and zero-or-more directed `nextStations` links (self-relation).
- **Feedback**: A text comment submitted by a Customer.
- **Shift**: A work period (start time, end time) assigned to a Staff member.
- **AuthToken**: A JWT or session token issued upon successful login, used to identify the caller.
- **CCCD**: Vietnamese national identity card number carried on a Ticket.
- **Resolver**: A NestJS GraphQL resolver class that handles a Query or Mutation.
- **DTO**: Data transfer object — an `@InputType()` class used to carry mutation arguments.
- **Redux_Store**: The client-side Redux store managing authentication state and cached API data.

---

## Requirements

### Requirement 1: Customer Registration

**User Story:** As a visitor, I want to create a Customer account, so that I can log in and book railway trips.

#### Acceptance Criteria

1. WHEN a registration request is submitted with a unique email, valid phone number, full name, and password of at least 8 characters, THE API SHALL create a Customer record with the provided data, a hashed password, `rank` defaulting to `0`, and `point` defaulting to `0`.
2. IF a registration request is submitted with an email that already exists, THEN THE API SHALL return a descriptive error indicating the email is already in use.
3. IF a registration request is submitted with a password shorter than 8 characters, THEN THE API SHALL return a descriptive validation error.
4. THE API SHALL store the Customer password as a bcrypt hash and SHALL NOT store or return the plaintext password in any response.
5. WHEN a Customer is successfully registered, THE SPA SHALL navigate the user to the login page and display a success notification.

---

### Requirement 2: Customer Authentication

**User Story:** As a registered Customer, I want to log in with my email and password, so that I can access booking features.

#### Acceptance Criteria

1. WHEN a login request is submitted with a valid Customer email and correct password, THE API SHALL return an AuthToken and the Customer's non-sensitive profile data (customerId, fullname, email, phone, rank, point).
2. IF a login request is submitted with an email that does not match any Customer record, THEN THE API SHALL return a generic authentication error without revealing whether the email exists.
3. IF a login request is submitted with a correct email but incorrect password, THEN THE API SHALL return a generic authentication error.
4. WHEN a Customer logs in successfully, THE SPA SHALL persist the AuthToken in the Redux_Store and redirect the user to the customer dashboard.
5. WHEN a Customer logs out, THE SPA SHALL clear the AuthToken from the Redux_Store and redirect the user to the login page.

---

### Requirement 3: Staff Authentication

**User Story:** As a Staff member, I want to log in with my staff credentials, so that I can access the operations management interface.

#### Acceptance Criteria

1. WHEN a staff login request is submitted with a valid Staff email and correct password, THE API SHALL return an AuthToken and the Staff's non-sensitive profile data (staffId, fullname, email, phone, role).
2. IF a staff login request is submitted with an email that does not match any Staff record, THEN THE API SHALL return a generic authentication error.
3. IF a staff login request is submitted with a correct email but incorrect password, THEN THE API SHALL return a generic authentication error.
4. THE API SHALL store the Staff password as a bcrypt hash and SHALL NOT store or return the plaintext password in any response.
5. WHEN a Staff member logs in successfully, THE SPA SHALL persist the AuthToken in the Redux_Store and redirect the user to the staff operations dashboard.

---

### Requirement 4: Trip Browsing and Seat Selection

**User Story:** As a Customer, I want to browse available trips and view seat availability by class, so that I can choose the seats I want to book.

#### Acceptance Criteria

1. THE API SHALL expose a query that returns a list of all Trips, each including its tripId, track, arrivalDate, and associated Seats with their seatId, status, and SeatClass (name and price).
2. WHEN a customer queries trips with an optional track filter string, THE API SHALL return only Trips whose track field contains the filter string (case-insensitive).
3. THE API SHALL expose a query that returns a single Trip by tripId, including all Seats and their current status.
4. WHILE a Seat status is `Booked` or `Unavailable`, THE API SHALL return that Seat with its current status so the SPA can render it as non-selectable.
5. WHEN a Customer views a Trip detail page, THE SPA SHALL display Seats grouped by SeatClass with visual distinction between `Available`, `Booked`, and `Unavailable` statuses.

---

### Requirement 5: Order Creation

**User Story:** As a Customer, I want to place an order for one or more seats on a trip by providing passenger details, so that tickets are reserved for my chosen seats.

#### Acceptance Criteria

1. WHEN a Customer submits an order with a valid customerId, a valid methodId, and a non-empty array of ticket inputs (each containing seatId, passName, and passCCCD), THE API SHALL invoke the `p_make_order` stored procedure using a raw `$executeRaw` call with the tickets serialized as a JSONB block, and return the newly created Order.
2. IF any requested seatId is not in `Available` status at the time of procedure execution, THEN THE API SHALL propagate the error from `p_make_order` and return a descriptive error to the caller without creating any partial Order or Ticket records.
3. THE API SHALL NOT manually update any Seat status after invoking `p_make_order`, as the `trg_create_ticket` trigger handles this automatically.
4. WHEN an Order is successfully created, THE SPA SHALL display the Order summary with all tickets, passenger details, payment method, and total price, and navigate to the order confirmation page.
5. IF the order creation request fails due to a seat conflict, THEN THE SPA SHALL display a descriptive error notification and return the user to the seat selection view.

---

### Requirement 6: Order Management (Customer)

**User Story:** As a Customer, I want to view all my past and current orders, so that I can track my booking history and order statuses.

#### Acceptance Criteria

1. WHEN a Customer queries their orders, THE API SHALL return all Orders belonging to that customerId, each including orderId, status, createdAt, associated Tickets (with ticketId, passName, passCCCD, status, and Seat with SeatClass), and Payment (with price and Method name).
2. THE API SHALL return Orders sorted by createdAt in descending order by default.
3. WHEN a Customer views the order list page, THE SPA SHALL display each Order with its status badge (`Pending`, `Confirmed`, `Denied`), creation date, total price, and a link to the order detail page.

---

### Requirement 7: Ticket Cancellation

**User Story:** As a Customer, I want to cancel an individual ticket within an order, so that the seat is released back to availability.

#### Acceptance Criteria

1. WHEN a ticket cancellation request is submitted with a valid seatId belonging to a Ticket in `Open` status, THE API SHALL invoke the `ticket_cancel` stored procedure via raw `$executeRaw` passing the seatId.
2. THE API SHALL NOT manually update the Seat status or Ticket status after calling `ticket_cancel`, as the database trigger handles these state transitions automatically.
3. IF a cancellation request is submitted with a seatId whose associated Ticket is already in `Canceled` or `Resolved` status, THEN THE API SHALL return an error indicating the ticket cannot be cancelled.
4. WHEN a Ticket is successfully cancelled, THE SPA SHALL update the displayed ticket status to `Canceled` and show a success notification.

---

### Requirement 8: Ticket Change

**User Story:** As a Customer, I want to change the seat assignment, passenger CCCD, or passenger name on a ticket, so that I can correct booking details without cancelling the entire order.

#### Acceptance Criteria

1. WHEN a ticket change request is submitted with a valid ticketId, a new seatId (or null to keep current), a new passCCCD, and a new passName, THE API SHALL invoke the `ticket_change` stored procedure via raw `$executeRaw` passing ticketId, newSeatId, newCCCD, and newName.
2. THE API SHALL NOT manually update the Seat status for either the old or new Seat, as the `trg_update_ticket` trigger automatically resolves seat state transitions.
3. IF a ticket change request references a newSeatId that is not in `Available` status, THEN THE API SHALL propagate the error from `ticket_change` and return a descriptive error.
4. WHEN a Ticket is successfully updated, THE SPA SHALL refresh the Ticket display with the new passenger details and seat assignment.

---

### Requirement 9: Staff Order Approval

**User Story:** As a Staff member, I want to approve or deny pending orders, so that confirmed bookings are ready for travel.

#### Acceptance Criteria

1. THE API SHALL expose a query that returns all Orders with `Pending` status, including customer details, ticket list, and payment information, accessible only to authenticated Staff.
2. WHEN a Staff member submits an approval action with a valid orderId and a new status of `Confirmed` or `Denied`, THE API SHALL update the Order status and set the staffId on the Order to the acting Staff member's staffId.
3. IF an approval action is submitted for an Order that is not in `Pending` status, THEN THE API SHALL return an error indicating the Order status cannot be changed.
4. THE API SHALL NOT pass an updatedAt value when updating an Order, as the `trg_update_at` trigger handles this automatically.
5. WHEN an Order status is updated, THE SPA SHALL reflect the new status immediately on the staff operations dashboard.

---

### Requirement 10: Staff Ticket Oversight

**User Story:** As a Staff member, I want to view all tickets across all orders, so that I can monitor passenger assignments and ticket states.

#### Acceptance Criteria

1. THE API SHALL expose a query that returns all Tickets across all Orders, each including ticketId, passName, passCCCD, status, associated Order (orderId, customerId, status), and Seat (seatId, status, SeatClass name and price).
2. WHEN filtering by orderId, THE API SHALL return only Tickets belonging to that Order.
3. WHEN filtering by Ticket status, THE API SHALL return only Tickets matching the specified status (`Open`, `Canceled`, or `Resolved`).

---

### Requirement 11: Shift Management

**User Story:** As a Staff member, I want to manage work shift schedules, so that operational coverage can be tracked and planned.

#### Acceptance Criteria

1. THE API SHALL expose a query that returns all Shifts for a given staffId, each including shiftId, staffId, startTime, and endTime.
2. WHEN a shift creation request is submitted with a valid staffId, startTime, and endTime, THE API SHALL create a Shift record and return it.
3. IF a shift creation request references a staffId that does not exist, THEN THE API SHALL return a foreign key violation error.
4. WHEN a shift deletion request is submitted with a valid shiftId, THE API SHALL delete the Shift record and return a success indicator.
5. THE SPA SHALL display a shift schedule view for staff members showing all their assigned shifts with start and end times.

---

### Requirement 12: Station Network Management

**User Story:** As a Staff member, I want to manage railway stations and their connections, so that the route network graph is accurate and navigable.

#### Acceptance Criteria

1. THE API SHALL expose a query that returns all Stations, each including stationId, name, location, and the list of nextStations (stationId, name, location).
2. WHEN a station creation request is submitted with a unique stationId, name, and location, THE API SHALL create a Station record and return it.
3. IF a station creation request is submitted with a stationId that already exists, THEN THE API SHALL return a descriptive uniqueness conflict error.
4. WHEN a station update request is submitted with a valid stationId, name, location, and an optional list of nextStation stationIds, THE API SHALL update the Station record and replace the nextStations relations with the provided list.
5. WHEN a station deletion request is submitted with a valid stationId, THE API SHALL delete the Station and remove all directed links to and from that Station.
6. THE SPA SHALL render the Station network as an interactive graph view where nodes represent Stations and directed edges represent nextStation links.

---

### Requirement 13: Feedback Submission and Listing

**User Story:** As a Customer, I want to submit feedback and view my past feedback, so that I can communicate about my experience.

#### Acceptance Criteria

1. WHEN a feedback submission request is submitted with a valid customerId and non-empty content string, THE API SHALL create a Feedback record and return it with feedbackId, customerId, content, and createdAt.
2. IF a feedback submission is made with an empty content string, THEN THE API SHALL return a validation error.
3. THE API SHALL expose a query that returns all Feedback records for a given customerId, sorted by createdAt in descending order.
4. WHEN a Customer submits feedback, THE SPA SHALL display a success notification and clear the feedback form.

---

### Requirement 14: Payment Methods Listing

**User Story:** As a Customer, I want to see the available payment methods before placing an order, so that I can select the method I prefer.

#### Acceptance Criteria

1. THE API SHALL expose a query that returns all available Methods, each including methodId, name, and description.
2. WHEN a Customer navigates to the order creation flow, THE SPA SHALL fetch and display the list of Methods for the user to select from.
3. WHEN no Method records exist in the database, THE API SHALL return an empty array without an error.

---

### Requirement 15: SeatClass Management

**User Story:** As a Staff member, I want to manage seat classes and their pricing, so that seat pricing is correctly reflected when customers browse trips.

#### Acceptance Criteria

1. THE API SHALL expose a query that returns all SeatClass records, each including seatClassId, name, and price.
2. WHEN a seat class creation request is submitted with a valid name and positive price, THE API SHALL create a SeatClass record and return it.
3. IF a seat class creation request includes a price of zero or a negative value, THEN THE API SHALL return a validation error.
4. WHEN a seat class update request is submitted with a valid seatClassId, updated name, and updated price, THE API SHALL update the SeatClass record and return the updated object.

---

### Requirement 16: Trip and Seat Management

**User Story:** As a Staff member, I want to create and manage trips and their seats, so that new journeys are available for customers to book.

#### Acceptance Criteria

1. WHEN a trip creation request is submitted with a valid track string and arrivalDate, THE API SHALL create a Trip record and return it with tripId, track, and arrivalDate.
2. WHEN a seat creation request is submitted with a valid tripId, seatClassId, and an initial status of `Available`, THE API SHALL create a Seat record linked to the specified Trip and SeatClass and return it.
3. IF a seat creation request references a tripId that does not exist, THEN THE API SHALL return a foreign key error.
4. IF a seat creation request references a seatClassId that does not exist, THEN THE API SHALL return a foreign key error.
5. WHEN a trip deletion request is submitted with a valid tripId, THE API SHALL delete the Trip; all associated Seats SHALL be deleted via cascading delete.

---

### Requirement 17: Customer Profile Management

**User Story:** As a Customer, I want to view and update my profile information, so that my contact details stay current.

#### Acceptance Criteria

1. WHEN a profile query is submitted with a valid customerId, THE API SHALL return the Customer's fullname, email, phone, rank, and point fields without the password field.
2. WHEN a profile update request is submitted with a valid customerId and updated fullname or phone, THE API SHALL update those fields and return the updated Customer record.
3. THE API SHALL NOT accept or apply changes to the password field through the profile update mutation; password changes SHALL require a dedicated password change mutation.
4. WHEN a password change request is submitted with a valid customerId, the correct current password, and a new password of at least 8 characters, THE API SHALL hash the new password with bcrypt and persist the updated hash.
5. IF a password change request provides an incorrect current password, THEN THE API SHALL return an authentication error.

---

### Requirement 18: Frontend Navigation and Layout

**User Story:** As a user, I want a consistent navigation structure, so that I can move between sections without confusion.

#### Acceptance Criteria

1. THE SPA SHALL implement a customer-facing route group protected by an authentication guard that redirects unauthenticated users to the login page.
2. THE SPA SHALL implement a staff-facing route group protected by an authentication guard that redirects unauthenticated users to the staff login page.
3. WHILE a user is authenticated as a Customer, THE SPA SHALL display the customer navigation menu including links to Trips, My Orders, and Feedback.
4. WHILE a user is authenticated as Staff, THE SPA SHALL display the staff navigation menu including links to Orders (pending approvals), Tickets, Trips, Stations, Shifts, and SeatClasses.
5. THE SPA SHALL use React Router DOM 7 for all client-side routing with no full-page reloads between navigated views.
6. THE SPA SHALL use the Redux_Store to persist authentication state across page refreshes via localStorage or sessionStorage hydration on app load.
