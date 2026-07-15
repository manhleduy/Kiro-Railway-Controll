import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { OrderStatusEnum } from '../../orders/dto/order-status.enum';

@ObjectType()
export class LatestOrderSummary {
  @Field(() => Int)
  orderId: number;

  @Field()
  createdAt: Date;

  @Field(() => OrderStatusEnum)
  status: OrderStatusEnum;
}

@ObjectType()
export class MonthlyActivityType {
  @Field(() => Int)
  month: number;

  @Field(() => Int)
  orderCount: number;

  @Field(() => Int)
  ticketCount: number;
}

@ObjectType()
export class CustomerStatsType {
  @Field(() => Int)
  totalOrders: number;

  @Field(() => LatestOrderSummary, { nullable: true })
  latestOrder: LatestOrderSummary | null;

  @Field(() => Float)
  avgPayment: number;

  @Field(() => Int)
  point: number;

  @Field(() => Int)
  rank: number;

  @Field(() => [MonthlyActivityType])
  monthlyActivity: MonthlyActivityType[];
}
