import { registerEnumType } from '@nestjs/graphql';

export enum SeatStatusEnum {
  Available = 'Available',
  Booked = 'Booked',
  Unavailable = 'Unavailable',
}

registerEnumType(SeatStatusEnum, {
  name: 'SeatStatus',
});
