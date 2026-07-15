import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StaffProfile {
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
