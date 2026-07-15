import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty, ArrayMinSize } from 'class-validator';
import { TicketInput } from './ticket-input.input';

@InputType()
export class CreateOrderInput {
  @Field()
  @IsNotEmpty()
  customerId: string;

  @Field(() => Int)
  methodId: number;

  @Field(() => [TicketInput])
  @ArrayMinSize(1)
  tickets: TicketInput[];
}
