import { gql } from './graphql.service';
import type { Ticket, TicketStatus } from '@/types';

const TICKET_FIELDS = `
  ticketId
  passName
  passCCCD
  status
  seatId
  orderId
  seat {
    seatId
    status
    seatClass {
      seatClassId
      name
      price
    }
  }
`;

export async function getTickets(
  orderId?: number,
  status?: TicketStatus,
): Promise<Ticket[]> {
  return gql<{ tickets: Ticket[] }>(
    `query Tickets($orderId: Int, $status: TicketStatus) {
       tickets(orderId: $orderId, status: $status) {
         ${TICKET_FIELDS}
       }
     }`,
    { orderId, status },
  ).then((d) => d.tickets);
}

export async function cancelTicket(seatId: number): Promise<Ticket> {
  return gql<{ cancelTicket: Ticket }>(
    `mutation CancelTicket($seatId: Int!) {
       cancelTicket(seatId: $seatId) {
         ${TICKET_FIELDS}
       }
     }`,
    { seatId },
  ).then((d) => d.cancelTicket);
}

export async function changeTicket(
  ticketId: number,
  newSeatId: number,
  passCCCD: string,
  passName: string,
): Promise<Ticket> {
  return gql<{ changeTicket: Ticket }>(
    `mutation ChangeTicket($ticketId: Int!, $newSeatId: Int!, $passCCCD: String!, $passName: String!) {
       changeTicket(ticketId: $ticketId, newSeatId: $newSeatId, passCCCD: $passCCCD, passName: $passName) {
         ${TICKET_FIELDS}
       }
     }`,
    { ticketId, newSeatId, passCCCD, passName },
  ).then((d) => d.changeTicket);
}
