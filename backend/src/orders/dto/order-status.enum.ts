import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatusEnum {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Denied = 'Denied',
}

registerEnumType(OrderStatusEnum, {
  name: 'OrderStatus',
});
