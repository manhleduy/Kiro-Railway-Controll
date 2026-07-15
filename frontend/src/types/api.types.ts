export type SeatStatus = 'Available' | 'Booked' | 'Unavailable';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Denied';
export type TicketStatus = 'Open' | 'Canceled' | 'Resolved';

export interface CustomerProfile {
  customerId: string;
  fullname: string;
  email: string;
  phone: string;
  rank: number;
  point: number;
}

export interface StaffProfile {
  staffId: string;
  fullname: string;
  email: string;
  phone: string;
  role: string;
}

export interface AuthPayload {
  token: string;
  user: CustomerProfile | StaffProfile;
}

export interface SeatClass {
  seatClassId: number;
  name: string;
  price: number;
}

export interface Seat {
  seatId: number;
  status: SeatStatus;
  seatClass: SeatClass;
}

export interface Trip {
  tripId: number;
  track: string;
  arrivalDate: string;
  seats: Seat[];
}

export interface Method {
  methodId: number;
  name: string;
  description: string;
}

export interface Payment {
  paymentId: number;
  price: number;
  method: Method;
}

export interface Ticket {
  ticketId: number;
  passCCCD: string;
  passName: string;
  status: TicketStatus;
  seatId: number | null;
  seat: Seat | null;
  orderId: number;
}

export interface Order {
  orderId: number;
  status: OrderStatus;
  createdAt: string;
  staffId: string | null;
  customer: CustomerProfile;
  tickets: Ticket[];
  payment: Payment | null;
}

export interface Station {
  stationId: string;
  name: string;
  location: string;
  nextStations: Station[];
}

export interface Feedback {
  feedbackId: number;
  customerId: string;
  content: string;
  createdAt: string;
}

export interface Shift {
  shiftId: number;
  staffId: string;
  startTime: string;
  endTime: string;
}

export interface TicketInput {
  seatId: number;
  passName: string;
  passCCCD: string;
}
