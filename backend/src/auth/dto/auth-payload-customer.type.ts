import { ObjectType, Field, createUnionType } from '@nestjs/graphql';

@ObjectType()
export class AuthCustomerProfile {
  @Field()
  customerId: string;

  @Field()
  fullname: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  rank: number;

  @Field()
  point: number;
}