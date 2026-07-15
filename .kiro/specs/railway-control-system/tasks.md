# Implementation Plan: Railway Control System

## Overview

Full-stack implementation of the Railway Control System — a NestJS 11 GraphQL API (code-first, Prisma 7, PostgreSQL) and a React 19 + Vite SPA. The backend is organized into feature modules; the frontend uses Redux, React Router DOM 7, and Axios. Transactional logic is delegated to PostgreSQL stored procedures and triggers; the application layer never duplicates those behaviors.

---

## Tasks

- [x] 0. Install required backend packages
  - Run in the `backend/` directory:
    ```bash
    npm install @nestjs/jwt @nestjs/passport passport passport-jwt class-validator class-transformer @prisma/adapter-pg
    npm install --save-dev @types/passport-jwt @types/bcryptjs
    ```
  - Verify install succeeded: `Get-ChildItem node_modules/@nestjs/jwt` should return a result
  - _All subsequent tasks depend on this step_

- [x] 1. Backend foundation — PrismaModule, AppModule, auth utilities
  - [x] 1.1 Wire PrismaService and PrismaModule
    - Create `backend/prisma/prisma.service.ts` extending `PrismaClient` with `onModuleInit` / `onModuleDestroy`
    - Create `backend/prisma/prisma.module.ts` decorated with `@Global()` and exporting `PrismaService`
    - Update `backend/src/app.module.ts` to import `PrismaModule`, configure `GraphQLModule` (code-first, `autoSchemaFile: 'src/schema.gql'`, `playground: true`), and register JWT via `JwtModule`
    - _Requirements: all modules depend on this foundation_

  - [x] 1.2 Implement JWT utilities and guards
    - Create `backend/src/auth/jwt.strategy.ts` reading `JWT_SECRET` from env, extracting `{ sub, role }` payload
    - Create `backend/src/auth/jwt-auth.guard.ts` extending `AuthGuard('jwt')`
    - Create `backend/src/auth/roles.guard.ts` checking `role === 'staff'`
    - Create `backend/src/auth/current-user.decorator.ts` that extracts JWT payload from GraphQL context
    - _Requirements: 2.1, 3.1, 9.1, 11.1_


- [ ] 2. Auth module — register, login resolvers/services
  - [-] 2.1 Implement AuthModule scaffolding and DTOs
    - Create `backend/src/auth/dto/register-customer.input.ts` with `@InputType()` (fullname, email, phone, password with `@MinLength(8)`)
    - Create `backend/src/auth/dto/auth-payload.type.ts` with `@ObjectType()` (token, user union)
    - Create `backend/src/auth/auth.module.ts` importing `JwtModule`, exporting `AuthService`
    - _Requirements: 1.1, 1.3_

  - [-] 2.2 Implement AuthService (register + login logic)
    - `registerCustomer`: hash password with `bcryptjs`, create Customer with `rank: 0`, `point: 0` using `prisma.customer.create`; catch Prisma `P2002` and throw `ConflictException`
    - `loginCustomer`: `findUnique` by email, `bcrypt.compare`, sign JWT `{ sub: customerId, role: 'customer' }`
    - `loginStaff`: `findUnique` by email on Staff, `bcrypt.compare`, sign JWT `{ sub: staffId, role: 'staff' }`
    - Never return password field in any response object
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [~] 2.3 Write property test for customer registration defaults (Property 1)
    - **Property 1: Customer registration sets secure defaults**
    - **Validates: Requirements 1.1, 1.3, 1.4**

  - [~] 2.4 Write property test for password length boundary (Property 2)
    - **Property 2: Password length boundary**
    - **Validates: Requirements 1.3**

  - [~] 2.5 Write property test for customer login round-trip (Property 3)
    - **Property 3: Customer login round-trip**
    - **Validates: Requirements 2.1**

  - [~] 2.6 Write property test for staff login round-trip (Property 4)
    - **Property 4: Staff login round-trip**
    - **Validates: Requirements 3.1, 3.4**

  - [~] 2.7 Implement AuthResolver
    - `@Mutation registerCustomer(input: RegisterCustomerInput)` → `AuthPayload`
    - `@Mutation loginCustomer(email, password)` → `AuthPayload`
    - `@Mutation loginStaff(email, password)` → `AuthPayload`
    - _Requirements: 1.1, 2.1, 3.1_


- [ ] 3. Customers module — profile queries and mutations
  - [~] 3.1 Implement CustomersModule, DTOs, and resolver
    - Create `CustomerProfile` `@ObjectType()` without `password` field
    - Create `UpdateCustomerInput` `@InputType()` (fullname?, phone?) — no password field accepted
    - Create `ChangePasswordInput` `@InputType()` (currentPassword, newPassword with `@MinLength(8)`)
    - `@Query customer(id)`: `prisma.customer.findUnique`, return `CustomerProfile` (select excludes password)
    - `@Mutation updateCustomer(id, input)`: `prisma.customer.update` with only `fullname`/`phone`; never accept password via this mutation; omit `updatedAt` from data
    - `@Mutation changePassword(id, input)`: verify current password with `bcrypt.compare`, hash new password, `prisma.customer.update`
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [~] 3.2 Write property test for customer profile never exposes password (Property 23)
    - **Property 23: Customer profile never exposes password**
    - **Validates: Requirements 17.1**

  - [~] 3.3 Write property test for profile update does not change password (Property 24)
    - **Property 24: Profile update does not change password**
    - **Validates: Requirements 17.3**

- [ ] 4. Staff module — profile query
  - [-] 4.1 Implement StaffModule, DTOs, and resolver
    - Create `StaffProfile` `@ObjectType()` (staffId, fullname, email, phone, role) — no password field
    - `@Query staff(id)`: `prisma.staff.findUnique`, return `StaffProfile`; protect with `JwtAuthGuard` + `RolesGuard`
    - _Requirements: 3.1, 3.4_


- [ ] 5. SeatClasses module
  - [-] 5.1 Implement SeatClassesModule, DTOs, and resolver
    - Create `SeatClassType` `@ObjectType()` (seatClassId, name, price)
    - Create `CreateSeatClassInput` with price validated `@Min(0.01)` (or custom validator rejecting ≤ 0)
    - Create `UpdateSeatClassInput`
    - `@Query seatClasses`: `prisma.seatClass.findMany()`
    - `@Mutation createSeatClass(input)`: validate price > 0, `prisma.seatClass.create`
    - `@Mutation updateSeatClass(id, input)`: `prisma.seatClass.update`, omit `updatedAt`
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [~] 5.2 Write property test for SeatClass price boundary (Property 21)
    - **Property 21: SeatClass price boundary**
    - **Validates: Requirements 15.2, 15.3**

- [ ] 6. Trips module — CRUD with seat query
  - [-] 6.1 Implement TripsModule, DTOs, and resolver
    - Create `SeatType`, `TripType` `@ObjectType()` types with nested `seatClass`
    - Create `CreateTripInput` (track, arrivalDate)
    - `@Query trips(track?: string)`: `prisma.trip.findMany({ where: track ? { track: { contains: track, mode: 'insensitive' } } : undefined, include: { seats: { include: { seatClass: true } } } })`
    - `@Query trip(id)`: `prisma.trip.findUnique` with seats + seatClass
    - `@Mutation createTrip(input)`: `prisma.trip.create`
    - `@Mutation deleteTrip(id)`: `prisma.trip.delete` (cascade deletes seats via schema)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 16.1, 16.5_

  - [~] 6.2 Write property test for trip query nested structure (Property 5)
    - **Property 5: Trip query returns complete nested structure**
    - **Validates: Requirements 4.1**

  - [~] 6.3 Write property test for track filter correctness (Property 6)
    - **Property 6: Track filter correctness**
    - **Validates: Requirements 4.2**

  - [~] 6.4 Write property test for trip cascade deletion (Property 22)
    - **Property 22: Trip cascade deletion**
    - **Validates: Requirements 16.5**


- [ ] 7. Seats module
  - [-] 7.1 Implement SeatsModule, DTO, and resolver
    - Create `CreateSeatInput` `@InputType()` (tripId, seatClassId)
    - `@Mutation createSeat(input)`: `prisma.seat.create({ data: { tripId, seatClassId, status: 'Available' } })`; catch Prisma `P2003` FK errors and throw `BadRequestException`
    - _Requirements: 16.2, 16.3, 16.4_

- [ ] 8. Orders module — createOrder, myOrders, pendingOrders, approveOrder
  - [-] 8.1 Implement OrdersModule, DTOs, and GraphQL types
    - Create `TicketInput`, `CreateOrderInput` `@InputType()` classes
    - Create `OrderType`, `PaymentType`, `MethodType` `@ObjectType()` classes with nested relations
    - Create `orders.module.ts` and wire `OrdersResolver` + `OrdersService`
    - _Requirements: 5.1, 6.1, 9.1, 9.2_

  - [~] 8.2 Implement OrdersService.createOrder
    - Build JSONB ticket array, invoke `p_make_order` via `$executeRaw` using the `DO $$ DECLARE v_json_data JSONB` block pattern from database docs
    - Wrap in try/catch; extract PostgreSQL error message and throw `BadRequestException` on seat conflict
    - After procedure, `prisma.order.findUnique` with full includes (tickets, payment.method, customer) and return
    - Never call `prisma.seat.update` after the procedure — `trg_create_ticket` handles seat status
    - _Requirements: 5.1, 5.2, 5.3_

  - [~] 8.3 Write property test for order creation stored procedure invocation (Property 7)
    - **Property 7: Order creation invokes stored procedure atomically**
    - **Validates: Requirements 5.1, 5.2**

  - [~] 8.4 Implement OrdersService.myOrders and OrdersService.pendingOrders
    - `myOrders(customerId)`: `prisma.order.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' }, include: { tickets: { include: { seat: { include: { seatClass: true } } } }, payment: { include: { method: true } }, customer: true } })`
    - `pendingOrders()`: same includes with `where: { status: 'Pending' }`; protected by `JwtAuthGuard` + `RolesGuard`
    - _Requirements: 6.1, 6.2, 9.1_

  - [~] 8.5 Write property test for customer orders ownership filter (Property 8)
    - **Property 8: Customer orders ownership filter**
    - **Validates: Requirements 6.1, 6.2**

  - [~] 8.6 Write property test for pending orders access control (Property 11)
    - **Property 11: Pending orders access control**
    - **Validates: Requirements 9.1**

  - [~] 8.7 Implement OrdersService.approveOrder and OrdersResolver
    - `approveOrder(orderId, status, staffId)`: guard that existing order has `status === 'Pending'`, throw `BadRequestException` otherwise; `prisma.order.update({ data: { status, staffId } })` — omit `updatedAt`
    - Wire `@Query myOrders`, `@Query pendingOrders`, `@Mutation createOrder`, `@Mutation approveOrder` in resolver
    - _Requirements: 9.2, 9.3, 9.4_

  - [~] 8.8 Write property test for order approval stamps staffId (Property 12)
    - **Property 12: Order approval stamps staffId**
    - **Validates: Requirements 9.2, 9.4**


- [ ] 9. Tickets module — cancelTicket, changeTicket, tickets query
  - [~] 9.1 Implement TicketsModule, DTOs, and GraphQL types
    - Create `TicketType` `@ObjectType()` with nested `seat.seatClass` and parent `order`
    - Create resolver with `@Query tickets(orderId?: number, status?: TicketStatus)` — apply both filters when provided; accessible to staff with `JwtAuthGuard` + `RolesGuard`
    - _Requirements: 10.1, 10.2, 10.3_

  - [~] 9.2 Write property test for ticket list filter exclusivity (Property 13)
    - **Property 13: Ticket list filters are exclusive**
    - **Validates: Requirements 10.2, 10.3**

  - [~] 9.3 Implement TicketsService.cancelTicket
    - Accept `seatId`; invoke `prisma.$executeRaw\`CALL ticket_cancel(${seatId})\`` inside try/catch; rethrow as `BadRequestException`
    - Never call `prisma.seat.update` or `prisma.ticket.update` after the call
    - Return updated ticket via `prisma.ticket.findFirst({ where: { seatId } })`
    - _Requirements: 7.1, 7.2, 7.3_

  - [~] 9.4 Write property test for ticket cancellation delegates to stored procedure (Property 9)
    - **Property 9: Ticket cancellation delegates to stored procedure**
    - **Validates: Requirements 7.1, 7.2**

  - [~] 9.5 Implement TicketsService.changeTicket
    - Accept `(ticketId, newSeatId, passCCCD, passName)`; invoke `prisma.$executeRaw\`CALL ticket_change(${ticketId}, ${newSeatId}, ${passCCCD}, ${passName})\`` inside try/catch
    - Never call `prisma.seat.update` for old or new seat
    - Return updated ticket via `prisma.ticket.findUnique({ where: { ticketId }, include: { seat: { include: { seatClass: true } } } })`
    - _Requirements: 8.1, 8.2, 8.3_

  - [~] 9.6 Write property test for ticket change delegates to stored procedure (Property 10)
    - **Property 10: Ticket change delegates to stored procedure**
    - **Validates: Requirements 8.1, 8.2**

  - [~] 9.7 Wire cancelTicket and changeTicket mutations in TicketsResolver
    - `@Mutation cancelTicket(seatId: number)` → `TicketType`
    - `@Mutation changeTicket(ticketId, newSeatId, passCCCD, passName)` → `TicketType`
    - _Requirements: 7.1, 8.1_


- [ ] 10. Stations module — CRUD with nextStations graph
  - [~] 10.1 Implement StationsModule, DTOs, and resolver
    - Create `StationType` `@ObjectType()` with `nextStations: StationType[]` self-reference
    - Create `CreateStationInput` (stationId, name, location, nextStationIds?: string[])
    - Create `UpdateStationInput` (name?, location?, nextStationIds?: string[])
    - `@Query stations`: `prisma.station.findMany({ include: { nextStations: true } })`
    - `@Mutation createStation`: `prisma.station.create` with `nextStations: { connect: ids.map(id => ({ stationId: id })) }`; catch `P2002` → `ConflictException`
    - `@Mutation updateStation(id, input)`: `prisma.station.update` replacing nextStations with `{ set: [], connect: [...] }` pattern for exact replacement
    - `@Mutation deleteStation(id)`: `prisma.station.delete` (Prisma cascade removes relation records)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [~] 10.2 Write property test for station query includes nextStations (Property 16)
    - **Property 16: Station query includes nextStations**
    - **Validates: Requirements 12.1**

  - [~] 10.3 Write property test for station nextStations replacement (Property 17)
    - **Property 17: Station nextStations replacement**
    - **Validates: Requirements 12.4**

  - [~] 10.4 Write property test for station deletion removes directed links (Property 18)
    - **Property 18: Station deletion removes all directed links**
    - **Validates: Requirements 12.5**

- [ ] 11. Shifts module — CRUD
  - [~] 11.1 Implement ShiftsModule, DTOs, and resolver
    - Create `ShiftType` `@ObjectType()` (shiftId, staffId, startTime, endTime)
    - Create `CreateShiftInput` (staffId, startTime, endTime)
    - `@Query shifts(staffId)`: `prisma.shift.findMany({ where: { staffId } })`
    - `@Mutation createShift(input)`: `prisma.shift.create`; catch `P2003` FK error → `BadRequestException`
    - `@Mutation deleteShift(shiftId)`: `prisma.shift.delete`, return `true`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [~] 11.2 Write property test for shift ownership filter (Property 14)
    - **Property 14: Shift ownership filter**
    - **Validates: Requirements 11.1, 11.2**

  - [~] 11.3 Write property test for shift deletion removes from list (Property 15)
    - **Property 15: Shift deletion removes from list**
    - **Validates: Requirements 11.4**


- [ ] 12. Feedback module — create and list
  - [~] 12.1 Implement FeedbackModule, DTO, and resolver
    - Create `FeedbackType` `@ObjectType()` (feedbackId, customerId, content, createdAt)
    - Create `CreateFeedbackInput` with `@IsNotEmpty()` on `content` (rejects empty/whitespace-only strings)
    - `@Mutation createFeedback(customerId, content)`: validate content is non-empty/whitespace before Prisma call; throw `BadRequestException` if invalid; `prisma.feedback.create`
    - `@Query feedbacks(customerId)`: `prisma.feedback.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } })`
    - _Requirements: 13.1, 13.2, 13.3_

  - [~] 12.2 Write property test for feedback empty content rejected (Property 19)
    - **Property 19: Feedback empty content rejected**
    - **Validates: Requirements 13.2**

  - [~] 12.3 Write property test for feedback ownership and ordering (Property 20)
    - **Property 20: Feedback ownership and ordering**
    - **Validates: Requirements 13.3**

- [ ] 13. Methods module — payments listing
  - [-] 13.1 Implement MethodsModule and resolver
    - Create `MethodType` `@ObjectType()` (methodId, name, description)
    - `@Query methods`: `prisma.method.findMany()`, returns empty array when no records
    - _Requirements: 14.1, 14.3_

- [~] 14. Backend checkpoint — wire all modules into AppModule and verify build
  - Update `backend/src/app.module.ts` to import all feature modules: `AuthModule`, `CustomersModule`, `StaffModule`, `TripsModule`, `SeatsModule`, `SeatClassesModule`, `OrdersModule`, `TicketsModule`, `StationsModule`, `ShiftsModule`, `FeedbackModule`, `MethodsModule`
  - Ensure all resolvers are registered and `ValidationPipe` is applied globally in `main.ts`
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 15. Frontend foundation — Vite config, types, Redux store, Axios service layer
  - [-] 15.1 Configure Vite, path aliases, and global types
    - Update `frontend/vite.config.ts` to add `@/` path alias pointing to `src/`
    - Update `frontend/tsconfig.json` paths to match
    - Create `frontend/src/types/api.types.ts` mirroring all GraphQL response types (Customer, Staff, Trip, Seat, SeatClass, Order, Ticket, Payment, Method, Station, Feedback, Shift, AuthPayload, enums)
    - Create `frontend/src/types/index.ts` barrel
    - _Requirements: 18.1, 18.2, 18.5_

  - [~] 15.2 Implement Redux store and auth slice
    - Create `frontend/src/store/authSlice.ts` with `AuthState` interface (token, role, user), `setAuth` and `clearAuth` actions
    - Create `frontend/src/store/tripsSlice.ts` with `TripsState` (trips, selectedTrip, loading, error)
    - Create `frontend/src/store/ordersSlice.ts` with `OrdersState` (orders, loading, error)
    - Create `frontend/src/store/index.ts` combining all slices into root store with TypeScript `RootState` and `AppDispatch` exports
    - Hydrate from `localStorage` in `frontend/src/main.tsx` on app load
    - _Requirements: 2.4, 3.5, 18.6_

  - [~] 15.3 Write Vitest property test for auth state hydration round-trip (Property 25)
    - **Property 25: Auth state hydration round-trip**
    - **Validates: Requirements 18.6**

  - [~] 15.4 Implement Axios GraphQL service layer
    - Create `frontend/src/services/graphql.service.ts` with single Axios instance (`baseURL: VITE_API_URL`), request interceptor attaching `Authorization: Bearer <token>` from Redux store, and typed `gql<T>(query, variables?)` function
    - Create `frontend/src/hooks/useGraphQL.ts` wrapping `gql` with loading/error state management
    - Create `frontend/src/hooks/useAuth.ts` for dispatching `setAuth` / `clearAuth` and reading auth state
    - Create `frontend/src/hooks/index.ts` barrel
    - _Requirements: 2.4, 3.5, 18.5_


- [ ] 16. Frontend service layer — one file per feature
  - [~] 16.1 Implement all feature service files
    - Create `auth.service.ts` (registerCustomer, loginCustomer, loginStaff mutations)
    - Create `trips.service.ts` (trips query with optional track filter, trip by ID, createTrip, deleteTrip mutations)
    - Create `orders.service.ts` (myOrders, pendingOrders queries; createOrder, approveOrder mutations)
    - Create `tickets.service.ts` (tickets query with orderId/status filters; cancelTicket, changeTicket mutations)
    - Create `stations.service.ts` (stations query; createStation, updateStation, deleteStation mutations)
    - Create `shifts.service.ts` (shifts query; createShift, deleteShift mutations)
    - Create `seatClasses.service.ts` (seatClasses query; createSeatClass, updateSeatClass mutations)
    - Create `feedback.service.ts` (feedbacks query; createFeedback mutation)
    - Create `methods.service.ts` (methods query)
    - Create `frontend/src/services/index.ts` barrel
    - _Requirements: 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1, 13.1, 14.1, 15.1_

- [ ] 17. Frontend routing, layouts, and guards
  - [~] 17.1 Implement route guards and layouts
    - Create `frontend/src/guards/CustomerGuard.tsx`: reads Redux auth state, redirects to `/login` if no customer token
    - Create `frontend/src/guards/StaffGuard.tsx`: redirects to `/staff/login` if no staff token
    - Create `frontend/src/guards/index.ts` barrel
    - Create `frontend/src/components/layout/CustomerLayout.tsx`: top nav (Trips, My Orders, Feedback, Profile) + `<Outlet />`
    - Create `frontend/src/components/layout/StaffLayout.tsx`: top nav (Orders, Tickets, Trips, Stations, Shifts, SeatClasses) + `<Outlet />`
    - Create `frontend/src/components/layout/index.ts` barrel
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [~] 17.2 Wire React Router DOM 7 route tree in App.tsx
    - Define complete route tree: `/`, `/login`, `/register`, `/staff/login`, `[CustomerGuard]/customer/*`, `[StaffGuard]/staff/*`
    - Map every page component to its path per the design route map
    - _Requirements: 18.1, 18.2, 18.5_


- [ ] 18. Frontend shared UI components
  - [~] 18.1 Implement shared UI components
    - Create `frontend/src/components/ui/Badge.tsx`: status badge accepting `Pending | Confirmed | Denied | Open | Canceled | Resolved` with distinct Tailwind colors
    - Create `frontend/src/components/ui/SeatGrid.tsx`: displays seats grouped by SeatClass, visually distinct `Available` / `Booked` / `Unavailable` states, calls `onSelect(seatId)` callback for available seats
    - Create `frontend/src/components/ui/StationGraph.tsx`: SVG-based interactive directed graph where nodes = stations and edges = nextStation links; uses D3-free SVG layout or a simple force-directed approach
    - Create `frontend/src/components/ui/index.ts` barrel
    - Create `frontend/src/components/index.ts` barrel
    - _Requirements: 4.5, 12.6, 18.3_

- [ ] 19. Frontend auth pages
  - [~] 19.1 Implement LoginCustomerPage
    - React Hook Form + Zod schema (email, password required)
    - On success: dispatch `setAuth`, persist to localStorage, navigate to `/customer/trips`
    - On error: show `react-hot-toast` error notification
    - _Requirements: 2.1, 2.4_

  - [~] 19.2 Implement LoginStaffPage
    - Same pattern targeting `loginStaff` mutation; on success navigate to `/staff/orders`
    - _Requirements: 3.1, 3.5_

  - [~] 19.3 Implement RegisterPage
    - React Hook Form + Zod schema (fullname, email, phone, password ≥ 8 characters)
    - On success: show success toast, navigate to `/login`
    - On error: show field-level validation or conflict error
    - _Requirements: 1.1, 1.3, 1.5_


- [ ] 20. Frontend customer pages
  - [~] 20.1 Implement TripsListPage (customer)
    - Fetch trips via `trips.service.ts`, support track filter input
    - Display trip cards showing track, arrivalDate, available seat count grouped by class
    - Link each card to `/customer/trips/:tripId`
    - _Requirements: 4.1, 4.2_

  - [~] 20.2 Implement TripDetailPage
    - Fetch single trip by ID, render `SeatGrid` component grouped by SeatClass
    - Selected seat IDs stored in local state; CTA navigates to `/customer/trips/:tripId/order` with selected seats
    - _Requirements: 4.3, 4.4, 4.5_

  - [~] 20.3 Implement CreateOrderPage (seat selection + passenger form)
    - Fetch available payment methods from `methods.service.ts`
    - React Hook Form + Zod: one passenger entry (passName, passCCCD) per selected seat, plus methodId selector
    - On submit: call `orders.service.ts createOrder`, dispatch success toast and navigate to order detail; on seat conflict error show toast and return to trip detail
    - _Requirements: 5.1, 5.4, 5.5, 14.2_

  - [~] 20.4 Implement OrdersListPage (customer)
    - Fetch `myOrders` from `orders.service.ts`, dispatch to Redux `ordersSlice`
    - Display `Badge` for status, creation date, total price, link to detail page
    - _Requirements: 6.1, 6.2, 6.3_

  - [~] 20.5 Implement OrderDetailPage
    - Fetch order by ID (from `myOrders` cache or fresh query), display all tickets with passenger info, seat, status `Badge`, payment info
    - Per-ticket cancel button calling `cancelTicket`, per-ticket change form calling `changeTicket`; show toast on success/failure
    - _Requirements: 7.1, 7.4, 8.1, 8.4_

  - [~] 20.6 Implement FeedbackPage (customer)
    - Text area with Zod validation (non-empty), submit calls `createFeedback`
    - List past feedbacks for current customer sorted by date
    - _Requirements: 13.1, 13.2, 13.4_

  - [~] 20.7 Implement CustomerProfilePage
    - Display current profile; inline edit form for fullname and phone via `updateCustomer`
    - Separate password change section using `changePassword` mutation
    - _Requirements: 17.1, 17.2, 17.4, 17.5_


- [ ] 21. Frontend staff pages
  - [~] 21.1 Implement StaffOrdersPage (pending approvals)
    - Fetch `pendingOrders` via `orders.service.ts`
    - Display order cards with customer info, ticket list, payment
    - Confirm / Deny buttons calling `approveOrder`; update Redux state and show toast
    - _Requirements: 9.1, 9.2, 9.5_

  - [~] 21.2 Implement TicketsPage (staff)
    - Fetch all tickets via `tickets.service.ts`; filter controls for `orderId` and status
    - Tabular display: ticketId, passName, passCCCD, status Badge, order info, seat + class
    - _Requirements: 10.1, 10.2, 10.3_

  - [~] 21.3 Implement TripsListPage (staff view with create/delete)
    - Re-use `TripsListPage` pattern with additional Create Trip form and Delete Trip button
    - Create Trip: React Hook Form + Zod (track, arrivalDate); call `createTrip`; reload list
    - Delete Trip: confirm dialog → `deleteTrip`; on success remove from list
    - _Requirements: 16.1, 16.5_

  - [~] 21.4 Implement StationsPage
    - Fetch stations, render `StationGraph` SVG component
    - Create/Edit/Delete station forms; update mutation replaces `nextStationIds` list exactly
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [~] 21.5 Implement ShiftsPage
    - Fetch shifts for current staff member; create/delete shift controls
    - Display shift schedule table with startTime and endTime
    - _Requirements: 11.1, 11.2, 11.4, 11.5_

  - [~] 21.6 Implement SeatClassesPage
    - Fetch seat classes; create/update forms with price > 0 Zod validation
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [~] 22. Final checkpoint — verify full build (backend + frontend)
  - Run `npm run build` in `backend/` and confirm no TypeScript errors
  - Run `npm run build` in `frontend/` and confirm no TypeScript errors
  - Run `npm run test` in `backend/` and confirm all unit and property tests pass
  - Run `npx vitest --run` in `frontend/` and confirm all slice and schema tests pass
  - Ensure all tests pass, ask the user if questions arise.


---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they cover property-based tests using `fast-check` (backend) and Vitest (frontend)
- Each task references specific requirements for traceability
- Backend tests run against a real test database — stored procedures and triggers from `.kiro/steering/procedure.sql` must be deployed to the test schema before running suites involving `p_make_order`, `ticket_cancel`, and `ticket_change`
- Never pass `updatedAt` in any Prisma `update` data object — `trg_update_at` handles all timestamp refreshes
- Never call `prisma.seat.update` after stored procedure invocations — triggers own seat status transitions
- All frontend imports across folders use the folder's `index.ts` barrel file to minimize import lines
- Frontend Zod schemas perform client-side validation before any API call; backend `ValidationPipe` is the authoritative enforcement layer


## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "5.1", "13.1", "15.1"] },
    { "id": 2, "tasks": ["2.2", "4.1", "6.1", "7.1", "8.1", "10.1", "11.1", "12.1", "15.2", "15.4", "16.1"] },
    { "id": 3, "tasks": ["2.3", "2.4", "2.5", "2.6", "2.7", "3.1", "5.2", "6.2", "6.3", "6.4", "8.2", "9.1", "11.2", "11.3", "12.2", "12.3", "15.3", "17.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "8.3", "8.4", "8.7", "9.3", "9.5", "9.7", "10.1", "17.2"] },
    { "id": 5, "tasks": ["8.5", "8.6", "8.8", "9.2", "9.4", "9.6", "10.2", "10.3", "10.4", "18.1"] },
    { "id": 6, "tasks": ["19.1", "19.2", "19.3", "21.1", "21.2", "21.3", "21.4", "21.5", "21.6"] },
    { "id": 7, "tasks": ["20.1", "20.2", "20.4", "20.6", "20.7"] },
    { "id": 8, "tasks": ["20.3", "20.5"] }
  ]
}
```
