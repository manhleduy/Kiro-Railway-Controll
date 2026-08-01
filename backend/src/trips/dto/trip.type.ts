import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SeatType } from './seat.type';
import { RouteType } from './route.type';
import { StationType } from '../../stations/dto/station.type';

@ObjectType()
export class TripType {
  @Field(() => Int)
  tripId: number;

  @Field()
  track: string;

  @Field()
  arrivalDate: Date;

  @Field(() => String, { nullable: true })
  stationId: string | null;

  @Field(() => StationType, { nullable: true })
  station: StationType | null;

  @Field(() => RouteType, { nullable: true })
  route: RouteType | null;

  @Field(() => [SeatType])
  seats: SeatType[];
}
