import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketType } from './dto/ticket.type';
import { TicketStatusEnum } from '../orders/dto/ticket-status.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => TicketType)
export class TicketsResolver {
  constructor(private readonly ticketsService: TicketsService) {}

  @Query(() => [TicketType], { name: 'tickets' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(
    @Args('orderId', { type: () => Int, nullable: true }) orderId?: number,
    @Args('status', { type: () => TicketStatusEnum, nullable: true })
    status?: TicketStatusEnum,
  ): Promise<TicketType[]> {
    return this.ticketsService.findAll(orderId, status);
  }

  @Mutation(() => TicketType)
  @UseGuards(JwtAuthGuard)
  cancelTicket(
    @Args('seatId', { type: () => Int }) seatId: number,
  ): Promise<TicketType> {
    return this.ticketsService.cancelTicket(seatId);
  }

  @Mutation(() => TicketType)
  @UseGuards(JwtAuthGuard)
  changeTicket(
    @Args('ticketId', { type: () => Int }) ticketId: number,
    @Args('newSeatId', { type: () => Int }) newSeatId: number,
    @Args('passCCCD') passCCCD: string,
    @Args('passName') passName: string,
  ): Promise<TicketType> {
    return this.ticketsService.changeTicket(
      ticketId,
      newSeatId,
      passCCCD,
      passName,
    );
  }
}
