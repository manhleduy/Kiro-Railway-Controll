import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateSeatInput {
  @Field(() => Int)
  tripId: number;

  @Field(() => Int)
  seatClassId: number;
}
