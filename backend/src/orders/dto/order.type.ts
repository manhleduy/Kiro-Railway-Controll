import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AuthCustomerProfile } from '../../auth/dto/auth-payload-customer.type';
import { TicketType } from './ticket.type';
import { PaymentType } from './payment.type';
import { OrderStatusEnum } from './order-status.enum';

@ObjectType()
export class OrderType {
  @Field(() => Int)
  orderId: number;

  @Field(() => OrderStatusEnum)
  status: OrderStatusEnum;

  @Field()
  createdAt: Date;

  @Field(() => String, { nullable: true })
  staffId: string | null;;

  @Field(() => AuthCustomerProfile)
  customer: AuthCustomerProfile;

  @Field(() => [TicketType])
  tickets: TicketType[];

  @Field(() => PaymentType, { nullable: true })
  payment: PaymentType | null;
}
