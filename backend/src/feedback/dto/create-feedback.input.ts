import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateFeedbackInput {
  @Field()
  @IsNotEmpty()
  customerId: string;

  @Field()
  @IsNotEmpty()
  content: string;
}
