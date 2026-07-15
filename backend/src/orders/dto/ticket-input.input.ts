import { InputType, Field, Int } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class TicketInput {
  @Field(() => Int)
  seatId: number;

  @Field()
  @IsNotEmpty()
  passName: string;

  @Field()
  @IsNotEmpty()
  passCCCD: string;
}
