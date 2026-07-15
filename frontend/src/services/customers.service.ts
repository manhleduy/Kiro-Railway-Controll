import { gql } from './graphql.service';
import type { CustomerProfile } from '@/types';

export interface CustomerStats {
  totalOrders: number;
  latestOrder: { orderId: number; createdAt: string; status: string } | null;
  avgPayment: number;
  point: number;
  rank: number;
  monthlyActivity: { month: number; orderCount: number; ticketCount: number }[];
}

export async function getCustomer(customerId: string): Promise<CustomerProfile> {
  return gql<{ customer: CustomerProfile }>(
    `query Customer($customerId: String!) {
       customer(id: $customerId) {
         customerId
         fullname
         email
         phone
         rank
         point
       }
     }`,
    { customerId },
  ).then((d) => d.customer);
}

export async function getCustomerStats(
  customerId: string,
  year: number,
): Promise<CustomerStats> {
  return gql<{ customerStats: CustomerStats }>(
    `query CustomerStats($id: String!, $year: Int!) {
       customerStats(id: $id, year: $year) {
         totalOrders
         latestOrder { orderId createdAt status }
         avgPayment
         point
         rank
         monthlyActivity { month orderCount ticketCount }
       }
     }`,
    { id: customerId, year },
  ).then((d) => d.customerStats);
}

export async function updateCustomer(
  customerId: string,
  fullname?: string,
  phone?: string,
): Promise<CustomerProfile> {
  return gql<{ updateCustomer: CustomerProfile }>(
    `mutation UpdateCustomer($id: String!, $fullname: String, $phone: String) {
       updateCustomer(id: $id, input: { fullname: $fullname, phone: $phone }) {
         customerId
         fullname
         email
         phone
         rank
         point
       }
     }`,
    { id: customerId, fullname, phone },
  ).then((d) => d.updateCustomer);
}

export async function changePassword(
  customerId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  return gql<{ changePassword: boolean }>(
    `mutation ChangePassword($id: String!, $currentPassword: String!, $newPassword: String!) {
       changePassword(id: $id, input: { currentPassword: $currentPassword, newPassword: $newPassword })
     }`,
    { id: customerId, currentPassword, newPassword },
  ).then((d) => d.changePassword);
}
