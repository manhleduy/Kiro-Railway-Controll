import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { MethodType } from '../../methods/dto/method.type';

@ObjectType()
export class PaymentType {
  @Field(() => Int)
  paymentId: number;

  @Field(() => Float)
  price: number;

  @Field(() => MethodType)
  method: MethodType;
}
