import { gql } from './graphql.service';
import type { AuthPayload } from '@/types';

const USER_FRAGMENT = `
  token
  user {
    ... on CustomerProfile {
      customerId
      fullname
      email
      phone
      rank
      point
    }
    ... on StaffProfile {
      staffId
      fullname
      email
      phone
      role
    }
  }
`;

export async function registerCustomer(
  fullname: string,
  email: string,
  phone: string,
  password: string,
): Promise<AuthPayload> {
  return gql<{ registerCustomer: AuthPayload }>(
    `mutation RegisterCustomer($fullname: String!, $email: String!, $phone: String!, $password: String!) {
       registerCustomer(input: { fullname: $fullname, email: $email, phone: $phone, password: $password }) {
         ${USER_FRAGMENT}
       }
     }`,
    { fullname, email, phone, password },
  ).then((d) => d.registerCustomer);
}

export async function loginCustomer(
  email: string,
  password: string,
): Promise<AuthPayload> {
  return gql<{ loginCustomer: AuthPayload }>(
    `mutation LoginCustomer($email: String!, $password: String!) {
       loginCustomer(email: $email, password: $password) {
         ${USER_FRAGMENT}
       }
     }`,
    { email, password },
  ).then((d) => d.loginCustomer);
}

export async function loginStaff(
  email: string,
  password: string,
): Promise<AuthPayload> {
  return gql<{ loginStaff: AuthPayload }>(
    `mutation LoginStaff($email: String!, $password: String!) {
       loginStaff(email: $email, password: $password) {
         ${USER_FRAGMENT}
       }
     }`,
    { email, password },
  ).then((d) => d.loginStaff);
}
