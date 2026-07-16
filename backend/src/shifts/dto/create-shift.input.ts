import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateShiftInput {
  @Field()
  @IsNotEmpty()
  staffId: string;

  @Field()
  @IsString()
  startTime: string;

  @Field()
  @IsString()
  endTime: string;
}
