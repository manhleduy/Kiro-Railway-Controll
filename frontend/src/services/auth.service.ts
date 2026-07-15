import { gql } from './graphql.service';
import type { AuthPayload } from '@/types';

const USER_FRAGMENT = `
  token
  user {
    ... on AuthCustomerProfile {
      customerId
      fullname
      email
      phone
      rank
      point
    }
    ... on AuthStaffProfile {
      staffId
      fullname
      email
      phone
      role
    }
  }
`;

export async function registerCustomer(
  customerId: string,
  fullname: string,
  email: string,
  phone: string,
  password: string,
): Promise<AuthPayload> {
  
  const value= gql<{ registerCustomer: AuthPayload }>(
    `mutation RegisterCustomer($customerId: String!,$fullname: String!, $email: String!, $phone: String!, $password: String!) {
       registerCustomer(input: {customerId: $customerId, fullname: $fullname, email: $email, phone: $phone, password: $password }) {
         ${USER_FRAGMENT}
       }
     }`,
    {customerId, fullname, email, phone, password },
  ).then((d) => d.registerCustomer)
  console.log(value)
  return value;
}

export async function loginCustomer(
  customerId: string,
  email: string,
  password: string,
): Promise<AuthPayload> {
  return gql<{ loginCustomer: AuthPayload }>(
    `mutation LoginCustomer($customerId: String!, $email: String!, $password: String!) {
       loginCustomer(customerId: $customerId, email: $email, password: $password) {
         ${USER_FRAGMENT}
       }
     }`,
    {customerId, email, password },
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
