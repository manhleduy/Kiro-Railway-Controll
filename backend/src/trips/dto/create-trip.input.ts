import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateTripInput {
  @Field()
  @IsNotEmpty()
  track: string;

  @Field()
  arrivalDate: Date;
}
