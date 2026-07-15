import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, ArrayMinSize, IsInt } from 'class-validator';
import { TicketInput } from './ticket-input.input';

@InputType()
export class CreateOrderInput {
  @Field()
  @IsNotEmpty()
  customerId: string;

  @Field(() => Int)
  @IsInt()
  methodId: number;


  @Field(() => [TicketInput])
  @ArrayMinSize(1)
  tickets: TicketInput[];
}
