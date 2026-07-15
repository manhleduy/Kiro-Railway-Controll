import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderType } from './dto/order.type';
import { CreateOrderInput } from './dto/create-order.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => OrderType)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => [OrderType], { name: 'myOrders' })
  @UseGuards(JwtAuthGuard)
  myOrders(@Args('customerId') customerId: string): Promise<OrderType[]> {
    return this.ordersService.myOrders(customerId);
  }

  @Query(() => [OrderType], { name: 'pendingOrders' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  pendingOrders(): Promise<OrderType[]> {

    return this.ordersService.pendingOrders();
  }

  @Mutation(() => OrderType)
  @UseGuards(JwtAuthGuard)
  createOrder(@Args('input') input: CreateOrderInput): Promise<OrderType> {
    
    return this.ordersService.createOrder(input);
  }

  @Mutation(() => OrderType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  approveOrder(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('status') status: string,
    @Args('staffId') staffId: string,
  ): Promise<OrderType> {
    return this.ordersService.approveOrder(orderId, status, staffId);
  }
}
