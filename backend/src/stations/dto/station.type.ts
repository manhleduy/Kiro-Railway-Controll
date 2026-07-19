import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StationType {
  @Field()
  stationId: string;

  @Field()
  name: string;

  @Field()
  location: string;


}
