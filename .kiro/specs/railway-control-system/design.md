# Design Document: Railway Control System

## Overview

The Railway Control System is a full-stack monorepo that exposes a NestJS 11 GraphQL API (code-first)
backed by PostgreSQL via Prisma 7, and a React 19 + Vite SPA as the frontend. Two user classes interact
with the system: Customers who browse trips and manage bookings, and Staff who approve orders, manage
operational data, and oversee tickets. Transactional integrity is delegated to three PostgreSQL stored
procedures (`p_make_order`, `ticket_cancel`, `ticket_change`) and four trigger families
(`trg_update_at`, `trg_create_ticket`, `trg_update_ticket`, `trg_delete_ticket`); no application-layer
logic duplicates these behaviors.

---

## Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         React 19 SPA (Vite)                      │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ Auth pages│  │ Customer  │  │  Staff pages  │  │ Shared   │  │
│  │ /login    │  │ /trips    │  │ /staff/orders │  │components│  │
│  │ /register │  │ /orders   │  │ /staff/tickets│  │          │  │
│  └───────────┘  │ /feedback │  │ /staff/trips  │  └──────────┘  │
│                 └───────────┘  └───────────────┘                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Redux Store  │  React Router DOM 7  │  Axios (GraphQL)   │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP POST /graphql
┌───────────────────────────▼──────────────────────────────────────┐
│                   NestJS 11 GraphQL API                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                      AppModule                           │    │
│  │  AuthModule  │ CustomersModule │ StaffModule │ TripsModule│   │
│  │  OrdersModule│ TicketsModule   │ SeatsModule │ SeatClass  │   │
│  │  StationsModule│ ShiftsModule  │ FeedbackModule│ PayModule │   │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │            PrismaModule (@Global singleton)              │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────┬──────────────────────────────────────┘
                            │ Prisma 7 + @prisma/adapter-pg
┌───────────────────────────▼──────────────────────────────────────┐
│                       PostgreSQL                                 │
│   Triggers: trg_update_at, trg_create_ticket,                    │
│             trg_update_ticket, trg_delete_ticket                 │
│   Procedures: p_make_order, ticket_cancel, ticket_change         │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow: Order Creation

```
Customer SPA
  │  createOrder mutation (customerId, methodId, tickets[])
  ▼
OrdersResolver.createOrder()
  │  validates input
  ▼
OrdersService.createOrder()
  │  $executeRaw → CALL p_make_order(customerId, methodId, ticketsJson)
  ▼
PostgreSQL
  │  p_make_order: checks availability, inserts Order + Payment
  │  trg_create_ticket fires on each Ticket INSERT → sets Seat.status = Booked
  ▼
OrdersService returns newly-created Order (via prisma.order.findUnique)
  ▼
Customer SPA receives Order with nested Tickets and Payment
```

### Data Flow: Authentication

```
User SPA → login mutation (email, password)
         ▼
AuthResolver → AuthService.login()
         ▼
AuthService: prisma.customer/staff.findUnique(email)
           → bcrypt.compare(password, hash)
           → sign JWT { sub: id, role: 'customer'|'staff' }
         ▼
Returns { token, profile }
         ▼
SPA: dispatch(setAuth({ token, user })) → Redux store
     localStorage.setItem('auth', JSON.stringify(...))
```

### JWT Strategy

- JWT payload: `{ sub: string, role: 'customer' | 'staff', iat, exp }`
- Signed with `JWT_SECRET` environment variable; expiry configurable via `JWT_EXPIRES_IN`
- NestJS `JwtAuthGuard` (`@UseGuards(JwtAuthGuard)`) protects staff-only resolvers
- A custom `CurrentUser` decorator extracts the JWT payload from the GraphQL context
- Staff-only mutations additionally use a `RolesGuard` checking `role === 'staff'`

**Key imports for auth infrastructure:**

```typescript
// jwt.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

// jwt-auth.guard.ts
import { AuthGuard } from '@nestjs/passport';

// auth.module.ts
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
```

**DTO validation uses `class-validator` + `class-transformer` with NestJS `ValidationPipe`:**

```typescript
// main.ts — enable globally
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

// example DTO
import { IsEmail, MinLength, IsNotEmpty } from 'class-validator';
@InputType()
class RegisterCustomerInput {
  @Field() @IsNotEmpty() fullname: string;
  @Field() @IsEmail() email: string;
  @Field() @IsNotEmpty() phone: string;
  @Field() @MinLength(8) password: string;
}
```

---

## Required Package Installations

The following packages must be installed before any implementation work begins. The frontend already has all required packages installed.

### Backend — run in the `backend/` directory

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt class-validator class-transformer @prisma/adapter-pg
npm install --save-dev @types/passport-jwt @types/bcryptjs
```

| Package | Purpose |
|---|---|
| `@nestjs/jwt` | JWT signing and verification via `JwtModule` and `JwtService` |
| `@nestjs/passport` | NestJS passport integration; `AuthGuard` base class |
| `passport` | Passport.js core authentication middleware |
| `passport-jwt` | JWT passport strategy (`Strategy`, `ExtractJwt`) |
| `@types/passport-jwt` | TypeScript types for passport-jwt |
| `class-validator` | DTO field decorators: `@IsEmail`, `@MinLength`, `@Min`, `@IsNotEmpty`, etc. |
| `class-transformer` | Required peer of class-validator; enables `plainToClass` for `ValidationPipe` |
| `@prisma/adapter-pg` | PostgreSQL adapter for Prisma 7; used in `PrismaService` constructor |
| `@types/bcryptjs` | TypeScript types for the already-installed `bcryptjs` package |

### Frontend — no additional installs needed

All required frontend packages (`@reduxjs/toolkit`, `react-redux`, `axios`, `react-router-dom`, `react-hook-form`, `zod`, `react-hot-toast`, `lucide-react`, `recharts`) are already installed.

---

## Components and Interfaces

### Backend Module Breakdown

Each feature lives at `backend/src/<feature>/` containing:
- `<feature>.module.ts` — NestJS module declaration
- `<feature>.resolver.ts` — GraphQL resolver (`@Resolver`, `@Query`, `@Mutation`)
- `<feature>.service.ts` — business logic, Prisma calls
- `dto/` folder — `@InputType()` and `@ObjectType()` classes

**Modules:**

| Module | Resolver | Key Queries | Key Mutations |
|---|---|---|---|
| `AuthModule` | `AuthResolver` | — | `registerCustomer`, `loginCustomer`, `loginStaff` |
| `CustomersModule` | `CustomersResolver` | `customer(id)` | `updateCustomer`, `changePassword` |
| `StaffModule` | `StaffResolver` | `staff(id)` | — |
| `TripsModule` | `TripsResolver` | `trips(track?)`, `trip(id)` | `createTrip`, `deleteTrip` |
| `SeatsModule` | `SeatsResolver` | — | `createSeat` |
| `SeatClassesModule` | `SeatClassesResolver` | `seatClasses` | `createSeatClass`, `updateSeatClass` |
| `OrdersModule` | `OrdersResolver` | `myOrders(customerId)`, `pendingOrders` | `createOrder`, `approveOrder` |
| `TicketsModule` | `TicketsResolver` | `tickets(orderId?, status?)` | `cancelTicket`, `changeTicket` |
| `PaymentsModule` | `PaymentsResolver` | — | — |
| `MethodsModule` | `MethodsResolver` | `methods` | — |
| `StationsModule` | `StationsResolver` | `stations` | `createStation`, `updateStation`, `deleteStation` |
| `ShiftsModule` | `ShiftsResolver` | `shifts(staffId)` | `createShift`, `deleteShift` |
| `FeedbackModule` | `FeedbackResolver` | `feedbacks(customerId)` | `createFeedback` |

### Key Resolver/Service Signatures

```typescript
// auth
registerCustomer(input: RegisterCustomerInput): Promise<AuthPayload>
loginCustomer(email: string, password: string): Promise<AuthPayload>
loginStaff(email: string, password: string): Promise<AuthPayload>

// orders
createOrder(input: CreateOrderInput): Promise<Order>
approveOrder(orderId: number, status: OrderStatus, staffId: string): Promise<Order>
myOrders(customerId: string): Promise<Order[]>
pendingOrders(): Promise<Order[]>  // staff only

// tickets
cancelTicket(seatId: number): Promise<Ticket>
changeTicket(ticketId: number, newSeatId: number, passCCCD: string, passName: string): Promise<Ticket>
tickets(orderId?: number, status?: TicketStatus): Promise<Ticket[]>

// stations
createStation(input: CreateStationInput): Promise<Station>
updateStation(stationId: string, input: UpdateStationInput): Promise<Station>
deleteStation(stationId: string): Promise<boolean>
```

### Frontend Component Structure

```
frontend/src/
├── assets/
├── components/                  # Shared/reusable UI components
│   ├── layout/
│   │   ├── CustomerLayout.tsx   # Nav + outlet for customer routes
│   │   ├── StaffLayout.tsx      # Nav + outlet for staff routes
│   │   └── index.ts
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx            # Status badge (Pending/Confirmed/Denied)
│   │   ├── SeatGrid.tsx         # Seat selection grid grouped by SeatClass
│   │   ├── StationGraph.tsx     # Interactive station network (D3/SVG)
│   │   └── index.ts
│   └── index.ts
├── features/
│   ├── auth/
│   │   ├── LoginCustomerPage.tsx
│   │   ├── LoginStaffPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── index.ts
│   ├── trips/
│   │   ├── TripsListPage.tsx
│   │   ├── TripDetailPage.tsx
│   │   └── index.ts
│   ├── orders/
│   │   ├── OrdersListPage.tsx   # Customer: my orders
│   │   ├── OrderDetailPage.tsx
│   │   ├── CreateOrderPage.tsx  # Seat selection + passenger form
│   │   ├── StaffOrdersPage.tsx  # Staff: pending orders
│   │   └── index.ts
│   ├── tickets/
│   │   ├── TicketsPage.tsx      # Staff: all tickets with filters
│   │   └── index.ts
│   ├── stations/
│   │   ├── StationsPage.tsx
│   │   └── index.ts
│   ├── shifts/
│   │   ├── ShiftsPage.tsx
│   │   └── index.ts
│   ├── seatClasses/
│   │   ├── SeatClassesPage.tsx
│   │   └── index.ts
│   └── feedback/
│       ├── FeedbackPage.tsx
│       └── index.ts
├── guards/
│   ├── CustomerGuard.tsx        # Redirects to /login if no customer token
│   ├── StaffGuard.tsx           # Redirects to /staff/login if no staff token
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useGraphQL.ts            # Typed Axios wrapper for GraphQL
│   └── index.ts
├── services/
│   ├── graphql.service.ts       # Base Axios instance pointing to /graphql
│   ├── auth.service.ts
│   ├── trips.service.ts
│   ├── orders.service.ts
│   ├── tickets.service.ts
│   ├── stations.service.ts
│   ├── shifts.service.ts
│   ├── seatClasses.service.ts
│   ├── feedback.service.ts
│   ├── methods.service.ts
│   └── index.ts
├── store/
│   ├── index.ts                 # Redux store setup
│   ├── authSlice.ts
│   ├── tripsSlice.ts
│   ├── ordersSlice.ts
│   └── index.ts
├── types/
│   ├── api.types.ts             # Mirrored GraphQL response types
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

### React Router DOM 7 Route Map

```
/                         → redirect to /login
/login                    → LoginCustomerPage
/register                 → RegisterPage
/staff/login              → LoginStaffPage

[CustomerGuard]
/customer/
  trips                   → TripsListPage
  trips/:tripId           → TripDetailPage
  trips/:tripId/order     → CreateOrderPage
  orders                  → OrdersListPage
  orders/:orderId         → OrderDetailPage
  feedback                → FeedbackPage
  profile                 → CustomerProfilePage

[StaffGuard]
/staff/
  orders                  → StaffOrdersPage (pending approvals)
  tickets                 → TicketsPage
  trips                   → TripsListPage (staff view with create/delete)
  stations                → StationsPage
  shifts                  → ShiftsPage
  seat-classes            → SeatClassesPage
```

### Redux Store Design

```typescript
// store/authSlice.ts
interface AuthState {
  token: string | null;
  role: 'customer' | 'staff' | null;
  user: CustomerProfile | StaffProfile | null;
}
// Actions: setAuth, clearAuth

// store/tripsSlice.ts
interface TripsState {
  trips: Trip[];
  selectedTrip: Trip | null;
  loading: boolean;
  error: string | null;
}

// store/ordersSlice.ts
interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}
```

On app load (`main.tsx`), the store is hydrated from `localStorage`:
```typescript
const persisted = localStorage.getItem('auth');
if (persisted) store.dispatch(setAuth(JSON.parse(persisted)));
```

### Axios GraphQL Service Layer

All API calls go through a single Axios instance:

```typescript
// services/graphql.service.ts
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000' });

client.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { data } = await client.post<{ data: T; errors?: unknown[] }>('/graphql', { query, variables });
  if (data.errors?.length) throw new Error(JSON.stringify(data.errors));
  return data.data;
}
```

Each feature service wraps `gql()` with typed queries and mutations.

---

## Data Models

### GraphQL Object Types (Backend)

```typescript
// Auth
@ObjectType() class AuthPayload {
  @Field() token: string;
  @Field(() => CustomerProfile | StaffProfile) user: CustomerProfile | StaffProfile;
}

// Customer (never exposes password)
@ObjectType() class CustomerProfile {
  @Field() customerId: string;
  @Field() fullname: string;
  @Field() email: string;
  @Field() phone: string;
  @Field() rank: number;
  @Field() point: number;
}

// Staff
@ObjectType() class StaffProfile {
  @Field() staffId: string;
  @Field() fullname: string;
  @Field() email: string;
  @Field() phone: string;
  @Field() role: string;
}

// Trip + Seat + SeatClass
@ObjectType() class SeatClassType {
  @Field() seatClassId: number;
  @Field() name: string;
  @Field() price: number;
}
@ObjectType() class SeatType {
  @Field() seatId: number;
  @Field(() => SeatStatusEnum) status: SeatStatus;
  @Field(() => SeatClassType) seatClass: SeatClassType;
}
@ObjectType() class TripType {
  @Field() tripId: number;
  @Field() track: string;
  @Field() arrivalDate: Date;
  @Field(() => [SeatType]) seats: SeatType[];
}

// Order + Ticket + Payment
@ObjectType() class TicketType {
  @Field() ticketId: number;
  @Field() passName: string;
  @Field() passCCCD: string;
  @Field(() => TicketStatusEnum) status: TicketStatus;
  @Field(() => SeatType, { nullable: true }) seat: SeatType | null;
}
@ObjectType() class PaymentType {
  @Field() paymentId: number;
  @Field() price: number;
  @Field(() => MethodType) method: MethodType;
}
@ObjectType() class OrderType {
  @Field() orderId: number;
  @Field(() => OrderStatusEnum) status: OrderStatus;
  @Field() createdAt: Date;
  @Field(() => CustomerProfile) customer: CustomerProfile;
  @Field(() => [TicketType]) tickets: TicketType[];
  @Field(() => PaymentType, { nullable: true }) payment: PaymentType | null;
}

// Station
@ObjectType() class StationType {
  @Field() stationId: string;
  @Field() name: string;
  @Field() location: string;
  @Field(() => [StationType]) nextStations: StationType[];
}

// Feedback, Method, Shift
@ObjectType() class FeedbackType { feedbackId: number; customerId: string; content: string; createdAt: Date; }
@ObjectType() class MethodType { methodId: number; name: string; description: string; }
@ObjectType() class ShiftType { shiftId: number; staffId: string; startTime: Date; endTime: Date; }
```

### Key Input Types (DTOs)

```typescript
@InputType() class RegisterCustomerInput { fullname: string; email: string; phone: string; password: string; }
@InputType() class TicketInput { seatId: number; passName: string; passCCCD: string; }
@InputType() class CreateOrderInput { customerId: string; methodId: number; tickets: TicketInput[]; }
@InputType() class ApproveOrderInput { orderId: number; status: OrderStatus; }  // Confirmed | Denied
@InputType() class CreateStationInput { stationId: string; name: string; location: string; nextStationIds?: string[]; }
@InputType() class UpdateStationInput { name?: string; location?: string; nextStationIds?: string[]; }
@InputType() class CreateSeatInput { tripId: number; seatClassId: number; }
```

### Database Trigger and Procedure Boundaries

The table below documents which state transitions are owned by the database layer and must never be duplicated in the application layer:

| Event | Owned By | Application Rule |
|---|---|---|
| `Seat.status → Booked` on Ticket INSERT | `trg_create_ticket` | Never call `prisma.seat.update` after `p_make_order` |
| `Seat.status` swap on Ticket UPDATE (seat change) | `trg_update_ticket` | Never call `prisma.seat.update` after `ticket_change` |
| `Seat.status → Available` on Ticket DELETE | `trg_delete_ticket` | Never call `prisma.seat.update` after ticket deletion |
| `updatedAt` refresh on any row UPDATE | `trg_update_at` | Never include `updatedAt` in Prisma update `data` objects |
| Order + Ticket + Payment creation (atomic) | `p_make_order` | Use `$executeRaw` only; do not replicate with Prisma creates |
| Ticket cancellation state | `ticket_cancel` | Use `$executeRaw` only |
| Ticket passenger/seat change | `ticket_change` | Use `$executeRaw` only |

### Stored Procedure Call Patterns

```typescript
// p_make_order
await prisma.$executeRaw`
  DO $$
  DECLARE
    v_json_data JSONB := ${JSON.stringify(tickets)}::jsonb;
  BEGIN
    CALL p_make_order(${customerId}, ${methodId}, v_json_data);
  END $$;
`;

// ticket_cancel (parameter is seatId)
await prisma.$executeRaw`CALL ticket_cancel(${seatId})`;

// ticket_change
await prisma.$executeRaw`CALL ticket_change(${ticketId}, ${newSeatId}, ${passCCCD}, ${passName})`;
```

After each stored procedure call, the service fetches the updated record using a normal Prisma `findUnique` to return the current state to the resolver.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Customer registration sets secure defaults

*For any* valid registration input (unique email, phone, fullname, password of length ≥ 8), the resulting Customer record SHALL have `rank = 0`, `point = 0`, a bcrypt-hashed password (stored value starts with `$2`), and the registration response SHALL NOT contain the plaintext password field.

**Validates: Requirements 1.1, 1.3, 1.4**

---

### Property 2: Password length boundary

*For any* password string of length strictly less than 8 characters, the registration mutation SHALL reject the request with a validation error and no Customer record SHALL be created. *For any* password of length ≥ 8, when all other fields are valid, the registration SHALL succeed.

**Validates: Requirements 1.3**

---

### Property 3: Customer login round-trip

*For any* registered Customer, submitting the correct email and password to `loginCustomer` SHALL return an AuthToken and a profile object containing `customerId`, `fullname`, `email`, `phone`, `rank`, and `point`, and SHALL NOT include a `password` field in the response.

**Validates: Requirements 2.1**

---

### Property 4: Staff login round-trip

*For any* registered Staff member, submitting the correct email and password to `loginStaff` SHALL return an AuthToken and a profile object containing `staffId`, `fullname`, `email`, `phone`, and `role`, and SHALL NOT include a `password` field in the response.

**Validates: Requirements 3.1, 3.4**

---

### Property 5: Trip query returns complete nested structure

*For any* set of Trip records in the database, the `trips` query SHALL return each Trip with its `tripId`, `track`, `arrivalDate`, and a `seats` array where every Seat includes `seatId`, `status`, and a `seatClass` object with `name` and `price`.

**Validates: Requirements 4.1**

---

### Property 6: Track filter correctness

*For any* filter string applied to the `trips` query, every returned Trip's `track` field SHALL contain the filter string (case-insensitive substring match), and no Trip whose `track` does not contain the filter string SHALL appear in the results.

**Validates: Requirements 4.2**

---

### Property 7: Order creation invokes stored procedure atomically

*For any* valid order input (existing `customerId`, existing `methodId`, non-empty array of tickets referencing `Available` seats), calling `createOrder` SHALL invoke `p_make_order` via `$executeRaw` and SHALL return an Order with `status = Pending` containing Tickets for each submitted seat. If any seat in the input is not `Available`, the entire operation SHALL fail and no Order, Ticket, or Payment record SHALL be created.

**Validates: Requirements 5.1, 5.2**

---

### Property 8: Customer orders ownership filter

*For any* `customerId`, the `myOrders` query SHALL return only Orders whose `customerId` matches the parameter — no Orders belonging to other customers SHALL appear. The list SHALL be sorted in descending `createdAt` order.

**Validates: Requirements 6.1, 6.2**

---

### Property 9: Ticket cancellation delegates to stored procedure

*For any* Ticket whose status is `Open` and which has a valid `seatId`, calling `cancelTicket(seatId)` SHALL invoke `ticket_cancel(seatId)` via `$executeRaw`. The service SHALL NOT issue any `prisma.seat.update` or `prisma.ticket.update` call following the procedure invocation.

**Validates: Requirements 7.1, 7.2**

---

### Property 10: Ticket change delegates to stored procedure

*For any* valid ticket change input (`ticketId`, `newSeatId`, `passCCCD`, `passName`), calling `changeTicket` SHALL invoke `ticket_change` via `$executeRaw` with the correct parameter order. The service SHALL NOT issue any `prisma.seat.update` call for the old or new seat.

**Validates: Requirements 8.1, 8.2**

---

### Property 11: Pending orders access control

*For any* call to `pendingOrders`, unauthenticated requests SHALL be rejected with an authorization error. Authenticated Staff requests SHALL receive only Orders with `status = Pending`.

**Validates: Requirements 9.1**

---

### Property 12: Order approval stamps staffId

*For any* `Pending` Order and any authenticated Staff member, calling `approveOrder(orderId, status, staffId)` with `status` of `Confirmed` or `Denied` SHALL update the Order's `status` to the submitted value and SHALL set the Order's `staffId` to the acting staff member's `staffId`. The Prisma update call SHALL NOT include an `updatedAt` field in the data object.

**Validates: Requirements 9.2, 9.4**

---

### Property 13: Ticket list filters are exclusive

*For any* `orderId` filter applied to the `tickets` query, every returned Ticket SHALL have `orderId` matching the filter parameter. *For any* `status` filter, every returned Ticket SHALL have `status` matching the filter. When both filters are applied, both constraints SHALL hold simultaneously.

**Validates: Requirements 10.2, 10.3**

---

### Property 14: Shift ownership filter

*For any* `staffId` passed to the `shifts` query, every returned Shift SHALL have `staffId` matching the parameter. After calling `createShift(staffId, startTime, endTime)`, the resulting Shift SHALL appear in the `shifts(staffId)` query result.

**Validates: Requirements 11.1, 11.2**

---

### Property 15: Shift deletion removes from list

*For any* existing `shiftId`, after calling `deleteShift(shiftId)`, the shift SHALL no longer appear in the `shifts(staffId)` query for the owning staff member.

**Validates: Requirements 11.4**

---

### Property 16: Station query includes nextStations

*For any* set of Station records with directed `nextStations` links, the `stations` query SHALL return each Station with its complete `nextStations` list (stationId, name, location for each linked station).

**Validates: Requirements 12.1**

---

### Property 17: Station nextStations replacement

*For any* station update request supplying a `nextStationIds` list, after the update the station's `nextStations` relation SHALL contain exactly the stations in the submitted list — no more, no fewer.

**Validates: Requirements 12.4**

---

### Property 18: Station deletion removes all directed links

*For any* station deletion, after `deleteStation(stationId)` the station SHALL no longer exist in the `stations` query, and no other Station's `nextStations` list SHALL reference the deleted station.

**Validates: Requirements 12.5**

---

### Property 19: Feedback empty content rejected

*For any* string composed entirely of whitespace characters (including the empty string `""`), calling `createFeedback` with that content SHALL return a validation error and no Feedback record SHALL be created.

**Validates: Requirements 13.2**

---

### Property 20: Feedback ownership and ordering

*For any* `customerId`, the `feedbacks(customerId)` query SHALL return only Feedback records belonging to that customer, sorted in descending `createdAt` order.

**Validates: Requirements 13.3**

---

### Property 21: SeatClass price boundary

*For any* price value ≤ 0 (including zero and negative values), calling `createSeatClass` SHALL return a validation error. *For any* price value strictly greater than 0, the creation SHALL succeed and return a SeatClass with the submitted `name` and `price`.

**Validates: Requirements 15.2, 15.3**

---

### Property 22: Trip cascade deletion

*For any* Trip with associated Seat records, after calling `deleteTrip(tripId)`, no Seat records with `tripId` matching the deleted trip SHALL remain in the database.

**Validates: Requirements 16.5**

---

### Property 23: Customer profile never exposes password

*For any* `customerId`, the `customer(id)` query response object SHALL contain `fullname`, `email`, `phone`, `rank`, and `point`, and SHALL NOT contain a `password` field under any circumstances.

**Validates: Requirements 17.1**

---

### Property 24: Profile update does not change password

*For any* profile update request that includes a `password` field in the input, the Customer's stored bcrypt hash SHALL remain identical to what it was before the update.

**Validates: Requirements 17.3**

---

### Property 25: Auth state hydration round-trip

*For any* authentication token and user data persisted to `localStorage` after login, reloading the application SHALL hydrate the Redux `authSlice` with the same token and user data, making protected routes accessible without re-login.

**Validates: Requirements 18.6**

---

## Error Handling

### Backend Error Strategy

| Scenario | NestJS Mechanism | GraphQL Response |
|---|---|---|
| Duplicate email on registration | Prisma `P2002` unique constraint → `ConflictException` | `errors[].message` with descriptive text |
| Validation failure (password length, price ≤ 0, empty content) | Class-validator + `ValidationPipe` | `BAD_USER_INPUT` with field-level messages |
| Wrong credentials | `UnauthorizedException` in AuthService | Generic `"Invalid credentials"` message |
| JWT missing / expired | `JwtAuthGuard` → `UnauthorizedException` | `UNAUTHENTICATED` |
| Accessing staff-only resolver as customer | `RolesGuard` → `ForbiddenException` | `FORBIDDEN` |
| Seat unavailable (from `p_make_order`) | PostgreSQL `RAISE EXCEPTION` propagates as Prisma raw error → caught, rethrown as `BadRequestException` | `BAD_USER_INPUT` |
| Non-pending order approval | Service guard check → `BadRequestException` | `BAD_USER_INPUT` |
| Foreign key violation (trip/seatClass not found) | Prisma `P2003` → `BadRequestException` | `BAD_USER_INPUT` |
| Station stationId conflict | Prisma `P2002` → `ConflictException` | `CONFLICT` |
| Unknown internal error | Global `ExceptionFilter` → `InternalServerErrorException` | `INTERNAL_SERVER_ERROR` |

### Frontend Error Handling

- All Axios errors are caught in service functions and re-thrown as structured `{ message: string }` objects.
- React components dispatch error state to Redux slices or use local `useState` for form errors.
- `react-hot-toast` displays user-facing notifications for all success and error events.
- Form validation runs client-side via Zod schemas before any API call is made, providing immediate feedback.
- Route guards (`CustomerGuard`, `StaffGuard`) redirect unauthenticated users without exposing protected page content.

### Stored Procedure Error Propagation

When `p_make_order`, `ticket_cancel`, or `ticket_change` raise a PostgreSQL exception, Prisma surfaces it as a `PrismaClientKnownRequestError` or raw error. Services wrap `$executeRaw` calls in a `try/catch` block, extract the PostgreSQL error message from `error.message`, and re-throw it as an appropriate NestJS HTTP exception so the GraphQL layer formats it correctly.

```typescript
try {
  await this.prisma.$executeRaw`CALL ticket_cancel(${seatId})`;
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : 'Ticket cancellation failed';
  throw new BadRequestException(msg);
}
```

---

## Testing Strategy

### Overview

The testing approach combines example-based unit tests for specific behaviors and edge cases with property-based tests for universal invariants. The property-based testing library for TypeScript is **fast-check** (`npm install --save-dev fast-check`). Each property test runs a minimum of 100 iterations.

### Backend Unit Tests (Jest)

Each service and resolver gets a dedicated `.spec.ts` file under its module folder. Tests use real Prisma against a test database (isolated schema) — no mocks for database calls per project guidelines.

**Example-based tests cover:**
- Duplicate email registration returns conflict error
- Login with unknown email returns generic error (same message as wrong password)
- Login with wrong password returns generic error
- Ticket cancellation on already-cancelled ticket returns error
- Order approval on non-pending order returns error
- Station creation with existing stationId returns conflict error
- Profile update with password field does not change stored hash
- Seat creation with nonexistent tripId/seatClassId returns FK error

**Property-based tests (fast-check) cover the 25 correctness properties above.** Each test is tagged with a comment referencing its property:

```typescript
// Feature: railway-control-system, Property 1: Customer registration sets secure defaults
it('registers any valid customer with correct defaults', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        fullname: fc.string({ minLength: 1 }),
        email: fc.emailAddress(),
        phone: fc.string({ minLength: 9, maxLength: 11 }),
        password: fc.string({ minLength: 8, maxLength: 64 }),
      }),
      async (input) => {
        const result = await authService.registerCustomer(input);
        expect(result.rank).toBe(0);
        expect(result.point).toBe(0);
        expect(result).not.toHaveProperty('password');
        // Verify stored hash
        const stored = await prisma.customer.findUnique({ where: { email: input.email } });
        expect(stored?.password).toMatch(/^\$2/);
      }
    ),
    { numRuns: 100 }
  );
});
```

Each property test follows this same structure: generate random valid inputs using `fc.record` / `fc.string` / `fc.integer` / `fc.array`, execute the service method, and assert the invariant.

### Test Configuration

```typescript
// jest.config.js additions for backend
testEnvironment: 'node',
setupFilesAfterFramework: ['./test/setup.ts'], // truncate test tables between runs
```

Tests that invoke stored procedures (`p_make_order`, `ticket_cancel`, `ticket_change`) require the procedures and triggers to be deployed in the test database. The test setup script runs the SQL from `.kiro/steering/procedure.sql` against the test schema before the suite.

### Frontend Tests

Frontend uses **Vitest** (bundled with Vite). Tests focus on:
- Redux slice reducers: `setAuth`, `clearAuth`, hydration from localStorage
- Zod schemas: validation of registration, order, and feedback forms
- Utility functions: track filter string matching, price validation

UI integration tests (optional, using React Testing Library):
- `CustomerGuard` redirects unauthenticated users
- `StaffGuard` redirects unauthenticated users
- Order list renders status badges correctly

### Coverage Targets

| Layer | Target |
|---|---|
| Auth service (register, login) | 100% line coverage |
| Orders service (createOrder, approveOrder) | 100% line coverage |
| Tickets service (cancelTicket, changeTicket) | 100% line coverage |
| Other services | ≥ 80% line coverage |
| Frontend Redux slices | 100% line coverage |
| Frontend Zod schemas | 100% line coverage |

### Running Tests

```bash
# Backend unit + property tests
cd backend && npm run test

# Backend e2e
cd backend && npm run test:e2e

# Frontend (single run, no watch)
cd frontend && npx vitest --run
```
