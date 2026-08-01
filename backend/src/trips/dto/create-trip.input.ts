import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';

@InputType()
export class CreateTripInput {
  @Field()
  @IsNotEmpty()
  track: string;

  @Field()
  arrivalDate: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  stationId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  travelTime?: number;
}
