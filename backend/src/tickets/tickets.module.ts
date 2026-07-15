import { Module } from '@nestjs/common';
import { TicketsResolver } from './tickets.resolver';
import { TicketsService } from './tickets.service';

@Module({
  providers: [TicketsResolver, TicketsService],
})
export class TicketsModule {}
