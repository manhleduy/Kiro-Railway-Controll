# Railway Control System

A railway management platform for booking and operations management.

## Core Capabilities

- **Customer-facing**: Browse trips, book seats, manage orders, submit feedback
- **Staff/Operations**: Manage bookings, assign tickets, handle order approvals (Confirmed/Denied), manage shifts
- **Network management**: Station graph with linked next-stations, trip scheduling with arrival dates and seat classes
- **Payments**: Multi-method payment tracking linked to orders

## Domain Entities

- **Customer** — registered passengers with a loyalty rank
- **Staff** — employees with roles and shift schedules
- **Trip** — a scheduled journey on a track with an arrival date
- **Seat / SeatClass** — seats belong to a trip and a class (e.g., economy, business) with a price
- **Order** — created by a customer, optionally handled by staff; status: `Pending | Confirmed | Denied`
- **Ticket** — one ticket per seat per order, carries passenger ID (CCCD) and name; status: `Open | Resolved`
- **Payment / Method** — payment record linked to an order with a chosen payment method
- **Station** — graph node with `nextStations` self-relation for route modeling
- **Feedback** — customer comments attached to their account
