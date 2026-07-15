import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateCustomerInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  fullname?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  phone?: string;
}
