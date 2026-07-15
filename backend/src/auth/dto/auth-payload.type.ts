import { ObjectType, Field, createUnionType } from '@nestjs/graphql';
import { AuthCustomerProfile } from './auth-payload-customer.type';
import { AuthStaffProfile } from './auth-payload-staff.type';
export const AuthUser = createUnionType({
  name: 'AuthUser',
  types: () => [AuthCustomerProfile, AuthStaffProfile] as const,
  resolveType(value) {
    if ('customerId' in value) return AuthCustomerProfile;
    return AuthStaffProfile;
  },
});

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => AuthUser)
  user: typeof AuthUser;
}
