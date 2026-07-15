import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateShiftInput {
  @Field()
  @IsNotEmpty()
  staffId: string;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;
}
