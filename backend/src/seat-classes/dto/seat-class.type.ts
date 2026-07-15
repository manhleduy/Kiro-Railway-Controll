import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SeatClassType {
  @Field(() => Int)
  seatClassId: number;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;
}
