import { registerEnumType } from '@nestjs/graphql';

export enum TicketStatusEnum {
  Open = 'Open',
  Canceled = 'Canceled',
  Resolved = 'Resolved',
}

registerEnumType(TicketStatusEnum, {
  name: 'TicketStatus',
});
