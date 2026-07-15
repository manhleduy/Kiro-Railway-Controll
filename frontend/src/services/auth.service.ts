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
  staffId: string,
  email: string,
  password: string,
): Promise<AuthPayload> {
  return gql<{ loginStaff: AuthPayload }>(
    `mutation LoginStaff($staffId: String!, $email: String!, $password: String!) {
       loginStaff(staffId: $staffId,email: $email, password: $password) {
         ${USER_FRAGMENT}
       }
     }`,
    {staffId, email, password },
  ).then((d) => d.loginStaff);
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  return gql<{ requestPasswordReset: boolean }>(
    `mutation RequestPasswordReset($email: String!) {
       requestPasswordReset(email: $email)
     }`,
    { email },
  ).then((d) => d.requestPasswordReset);
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string,
): Promise<boolean> {
  return gql<{ resetPassword: boolean }>(
    `mutation ResetPassword($email: String!, $otp: String!, $newPassword: String!) {
       resetPassword(email: $email, otp: $otp, newPassword: $newPassword)
     }`,
    { email, otp, newPassword },
  ).then((d) => d.resetPassword);
}
