import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderType } from './dto/order.type';
import { CreateOrderInput } from './dto/create-order.input';
import { TicketInput } from './dto/ticket-input.input';

const orderInclude = {
  tickets: {
    include: {
      seat: {
        include: {
          seatClass: true,
        },
      },
    },
  },
  payment: {
    include: {
      method: true,
    },
  },
  customer: true,
} as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(input: CreateOrderInput): Promise<OrderType> {
    const { customerId, methodId, tickets } = input;
    const ticketsJson = tickets.map((t: TicketInput) => ({
      seatId: t.seatId,
      passName: t.passName,
      passCCCD: t.passCCCD,
    }));
    
    try {
      const ticketsJsonString =await JSON.stringify(ticketsJson);

      await this.prisma.$executeRaw`
        CALL p_make_order(
          ${customerId}::varchar, 
          ${methodId}::int, 
          ${ticketsJsonString}::jsonb
        );
      `;
    } catch (err: unknown) {
      console.log(err)
      const msg =
        err instanceof Error ? err.message : 'Order creation failed';
      throw new BadRequestException(msg);
    }

    const order = await this.prisma.order.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });

    return order as unknown as OrderType;
  }

  async myOrders(customerId: string): Promise<OrderType[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
    return orders as unknown as OrderType[];
  }

  async pendingOrders(): Promise<OrderType[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: 'Pending' },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
    return orders as unknown as OrderType[];
  }

  async approveOrder(
    orderId: number,
    status: string,
    staffId: string,
  ): Promise<OrderType> {
    const existing = await this.prisma.order.findUnique({
      where: { orderId },
    });

    if (!existing) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    if (existing.status !== 'Pending') {
      throw new BadRequestException(
        `Order ${orderId} is not pending — current status: ${existing.status}`,
      );
    }

    await this.prisma.order.update({
      where: { orderId },
      data: { status: status as 'Confirmed' | 'Denied', staffId },
    });

    const updated = await this.prisma.order.findUnique({
      where: { orderId },
      include: orderInclude,
    });

    return updated as unknown as OrderType;
  }
}
