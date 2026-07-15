import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterCustomerInput } from './dto/register-customer.input';

import { AuthPayload } from './dto/auth-payload.type';
import { AuthCustomerProfile } from './dto/auth-payload-customer.type';
import { AuthStaffProfile } from './dto/auth-payload-staff.type';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registerCustomer(input: RegisterCustomerInput): Promise<AuthPayload> {
    const {customerId, fullname, email, phone, password } = input;
    
    const hashedPassword = await bcrypt.hash(password, 10)

    let customer: AuthCustomerProfile;
    try {
      
      const created = await this.prisma.customer.create({
        data: {
          customerId,
          fullname,
          email,
          phone,
          password: hashedPassword,
          rank: 0,
          point: 0,
        },
      });
      

      customer = {
        customerId: created.customerId,
        fullname: created.fullname,
        email: created.email,
        phone: created.phone,
        rank: created.rank,
        point: created.point,
      };
    } catch (err: unknown) {
      
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'A customer with this email already exists',
        );
      }
      throw err;
    }

    const token = this.jwt.sign({
      sub: customer.customerId,
      role: 'customer',
    });

    return { token, user: customer };
  }

  async loginCustomer(customerId: string,email: string, password: string): Promise<AuthPayload> {
    const customer = await this.prisma.customer.findUnique({
      where: { email, customerId },
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, customer.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: customer.customerId,
      role: 'customer',
    });

    const profile: AuthCustomerProfile = {
      customerId: customer.customerId,
      fullname: customer.fullname,
      email: customer.email,
      phone: customer.phone,
      rank: customer.rank,
      point: customer.point,
    };

    return { token, user: profile };
  }

  async loginStaff(email: string, password: string): Promise<AuthPayload> {
    const staff = await this.prisma.staff.findUnique({
      where: { email },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, staff.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: staff.staffId,
      role: 'staff',
    });

    const profile: AuthStaffProfile = {
      staffId: staff.staffId,
      fullname: staff.fullname,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
    };

    return { token, user: profile };
  }

  
}
