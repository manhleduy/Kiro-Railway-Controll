import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MethodType {
  @Field(() => Int)
  methodId: number;

  @Field()
  name: string;

  @Field()
  description: string;
}
