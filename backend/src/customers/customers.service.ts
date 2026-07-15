import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerProfile } from '../auth/dto/auth-payload-staff.type';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { ChangePasswordInput } from './dto/change-password.input';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CustomerProfile> {
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
  ): Promise<CustomerProfile> {
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
}
