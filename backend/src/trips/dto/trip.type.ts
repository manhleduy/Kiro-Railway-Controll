import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SeatType } from './seat.type';

@ObjectType()
export class TripType {
  @Field(() => Int)
  tripId: number;

  @Field()
  track: string;

  @Field()
  arrivalDate: Date;

  @Field(() => [SeatType])
  seats: SeatType[];
}
