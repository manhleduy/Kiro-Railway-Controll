import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ShiftType {
  @Field(() => Int)
  shiftId: number;

  @Field()
  staffId: string;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;
}
