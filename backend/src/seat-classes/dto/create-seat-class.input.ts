import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, Min } from 'class-validator';

@InputType()
export class CreateSeatClassInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field(() => Float)
  @Min(0.01)
  price: number;
}
