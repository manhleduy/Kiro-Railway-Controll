import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class UpdateStationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  location?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  nextStationIds?: string[];
}
