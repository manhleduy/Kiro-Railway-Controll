import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SeatType } from '../../trips/dto/seat.type';
import { TicketStatusEnum } from './ticket-status.enum';

@ObjectType()
export class TicketType {
  @Field(() => Int)
  ticketId: number;

  @Field()
  passCCCD: string;

  @Field()
  passName: string;

  @Field(() => TicketStatusEnum)
  status: TicketStatusEnum;

  @Field(() => Int, { nullable: true })
  seatId: number | null;

  @Field(() => SeatType, { nullable: true })
  seat: SeatType | null;

  @Field(() => Int)
  orderId: number;
}
