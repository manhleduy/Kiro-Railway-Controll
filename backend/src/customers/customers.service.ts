import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthCustomerProfile } from '../auth/dto/auth-payload-customer.type';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { ChangePasswordInput } from './dto/change-password.input';
import {
  CustomerStatsType,
  LatestOrderSummary,
  MonthlyActivityType,
} from './dto/customer-stats.type';
import { OrderStatusEnum } from '../orders/dto/order-status.enum';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AuthCustomerProfile> {
    const customer = await this.prisma.customer.findUnique({
      where: { customerId: id },
      select: {
        customerId: true,
        fullname: true,
        email: true,
        phone: true,
        rank: true,
        point: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id "${id}" not found`);
    }

    return customer;
  }

  async updateCustomer(
    id: string,
    input: UpdateCustomerInput,
  ): Promise<AuthCustomerProfile> {
    const data: { fullname?: string; phone?: string } = {};
    if (input.fullname !== undefined) data.fullname = input.fullname;
    if (input.phone !== undefined) data.phone = input.phone;

    const updated = await this.prisma.customer.update({
      where: { customerId: id },
      data,
      select: {
        customerId: true,
        fullname: true,
        email: true,
        phone: true,
        rank: true,
        point: true,
      },
    });

    return updated;
  }

  async changePassword(id: string, input: ChangePasswordInput): Promise<boolean> {
    const customer = await this.prisma.customer.findUnique({
      where: { customerId: id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id "${id}" not found`);
    }

    const valid = await bcrypt.compare(input.currentPassword, customer.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(input.newPassword, 10);

    await this.prisma.customer.update({
      where: { customerId: id },
      data: { password: hashed },
    });

    return true;
  }

  async getStats(id: string, year: number): Promise<CustomerStatsType> {
    const customer = await this.prisma.customer.findUnique({
      where: { customerId: id },
      select: { point: true, rank: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with id "${id}" not found`);
    }

    // Total orders and latest order
    const orders = await this.prisma.order.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        orderId: true,
        createdAt: true,
        status: true,
        payment: { select: { price: true } },
      },
    });

    const totalOrders = orders.length;

    let latestOrder: LatestOrderSummary | null = null;
    if (orders.length > 0) {
      const o = orders[0];
      latestOrder = { orderId: o.orderId, createdAt: o.createdAt, status: o.status as unknown as OrderStatusEnum };
    }

    // Average payment price across all orders that have a payment
    const prices = orders
      .filter((o) => o.payment !== null)
      .map((o) => o.payment!.price);
    const avgPayment =
      prices.length > 0
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length
        : 0;

    // Monthly activity for the requested year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const yearOrders = await this.prisma.order.findMany({
      where: {
        customerId: id,
        createdAt: { gte: yearStart, lt: yearEnd },
      },
      select: {
        createdAt: true,
        tickets: { select: { ticketId: true } },
      },
    });

    // Build month map 1–12
    const monthMap = new Map<number, MonthlyActivityType>();
    for (let m = 1; m <= 12; m++) {
      monthMap.set(m, { month: m, orderCount: 0, ticketCount: 0 });
    }

    for (const order of yearOrders) {
      const month = order.createdAt.getMonth() + 1;
      const entry = monthMap.get(month)!;
      entry.orderCount += 1;
      entry.ticketCount += order.tickets.length;
    }

    const monthlyActivity = Array.from(monthMap.values());

    return {
      totalOrders,
      latestOrder,
      avgPayment,
      point: customer.point,
      rank: customer.rank,
      monthlyActivity,
    };
  }
}
