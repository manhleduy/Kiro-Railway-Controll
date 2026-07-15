import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateStationInput {
  @Field()
  @IsNotEmpty()
  stationId: string;

  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  location: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  nextStationIds?: string[];
}
