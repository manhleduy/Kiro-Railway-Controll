import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty } from 'class-validator';

@InputType()
export class SearchInput {
  @Field({ nullable: true })
  userId: string;

  @Field({ nullable: true })
  userQuery: string;
}
