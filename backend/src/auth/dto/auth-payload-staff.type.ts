import { ObjectType, Field, createUnionType } from '@nestjs/graphql';


@ObjectType()
export class AuthStaffProfile {
  @Field()
  staffId: string;

  @Field()
  fullname: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  role: string;
}

