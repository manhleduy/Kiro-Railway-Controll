import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class RegisterStaffInput {
  @Field()
  @IsNotEmpty()
  staffId: string

  @Field()
  @IsNotEmpty()
  fullname: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  phone: string;

  @Field()
  @MinLength(8)
  password: string;
}
