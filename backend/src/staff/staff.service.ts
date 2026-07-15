import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffProfile } from './dto/staff-profile.type';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(staffId: string): Promise<StaffProfile> {
    const staff = await this.prisma.staff.findUnique({
      where: { staffId },
      select: {
        staffId: true,
        fullname: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with id "${staffId}" not found`);
    }

    return staff;
  }
}
