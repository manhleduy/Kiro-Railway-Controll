import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FeedbackType {
  @Field(() => Int)
  feedbackId: number;

  @Field()
  customerId: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;
}
