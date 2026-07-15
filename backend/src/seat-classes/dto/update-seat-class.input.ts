import { InputType, Field, Float } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty, Min } from 'class-validator';

@InputType()
export class UpdateSeatClassInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0.01)
  price?: number;
}
