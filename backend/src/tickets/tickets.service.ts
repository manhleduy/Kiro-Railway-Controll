import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketType } from './dto/ticket.type';
import { TicketStatusEnum } from '../orders/dto/ticket-status.enum';

const ticketInclude = {
  seat: {
    include: {
      seatClass: true,
    },
  },
} as const;

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    orderId?: number,
    status?: TicketStatusEnum,
  ): Promise<TicketType[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        ...(orderId !== undefined ? { orderId } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: ticketInclude,
    });
    return tickets as unknown as TicketType[];
  }

  async cancelTicket(seatId: number): Promise<TicketType> {
    try {
      await this.prisma.$executeRaw`CALL ticket_cancel(${seatId})`;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Ticket cancellation failed';
      throw new BadRequestException(msg);
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: { seatId },
      include: ticketInclude,
    });

    return ticket as unknown as TicketType;
  }

  async changeTicket(
    ticketId: number,
    newSeatId: number,
    passCCCD: string,
    passName: string,
  ): Promise<TicketType> {
    try {
      await this.prisma.$executeRaw`CALL ticket_change(${ticketId}, ${newSeatId}, ${passCCCD}, ${passName})`;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Ticket change failed';
      throw new BadRequestException(msg);
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketId },
      include: ticketInclude,
    });

    return ticket as unknown as TicketType;
  }
}
