import { gql } from './graphql.service';
import type { Order, TicketInput } from '@/types';

const ORDER_FIELDS = `
  orderId
  status
  createdAt
  staffId
  customer {
    customerId
    fullname
    email
    phone
    rank
    point
  }
  tickets {
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
  }
  payment {
    paymentId
    price
    method {
      methodId
      name
      description
    }
  }
`;

export async function myOrders(customerId: string): Promise<Order[]> {
  return gql<{ myOrders: Order[] }>(
    `query MyOrders($customerId: String!) {
       myOrders(customerId: $customerId) {
         ${ORDER_FIELDS}
       }
     }`,
    { customerId },
  ).then((d) => d.myOrders);
}

export async function pendingOrders(): Promise<Order[]> {
  return gql<{ pendingOrders: Order[] }>(
    `query PendingOrders {
       pendingOrders {
         ${ORDER_FIELDS}
       }
     }`,
  ).then((d) => d.pendingOrders);
}

export async function createOrder(
  customerId: string,
  methodId: number,
  tickets: TicketInput[],
): Promise<Order> {
  return gql<{ createOrder: Order }>(
    `mutation CreateOrder($customerId: String!, $methodId: Int!, $tickets: [TicketInput!]!) {
       createOrder(input: { customerId: $customerId, methodId: $methodId, tickets: $tickets }) {
         ${ORDER_FIELDS}
       }
     }`,
    { customerId, methodId, tickets },
  ).then((d) => d.createOrder);
}

export async function approveOrder(
  orderId: number,
  status: string,
  staffId: string,
): Promise<Order> {
  return gql<{ approveOrder: Order }>(
    `mutation ApproveOrder($orderId: Int!, $status: String!, $staffId: String!) {
       approveOrder(orderId: $orderId, status: $status, staffId: $staffId) {
         ${ORDER_FIELDS}
       }
     }`,
    { orderId, status, staffId },
  ).then((d) => d.approveOrder);
}
