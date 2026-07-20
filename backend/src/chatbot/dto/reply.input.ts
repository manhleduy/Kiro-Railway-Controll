import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty } from 'class-validator';

@InputType()
export class ReplyInput {
  @Field({ nullable: true })
  userId: string;

  @Field({ nullable: true })
  userReply: string;
}
