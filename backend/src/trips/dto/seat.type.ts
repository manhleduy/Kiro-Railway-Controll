import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SeatClassType } from '../../seat-classes/dto/seat-class.type';
import { SeatStatusEnum } from './seat-status.enum';

@ObjectType()
export class SeatType {
  @Field(() => Int)
  seatId: number;

  @Field(() => SeatStatusEnum)
  status: SeatStatusEnum;

  @Field(() => SeatClassType)
  seatClass: SeatClassType;
}
