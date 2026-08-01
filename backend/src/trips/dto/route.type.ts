import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RouteType {
  @Field(() => Int)
  routeId: number;

  @Field(() => Int)
  tripId: number;

  @Field(() => Int)
  travelTime: number;
}
