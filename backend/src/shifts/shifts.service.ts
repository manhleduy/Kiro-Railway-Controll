import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShiftType } from './dto/shift.type';
import { CreateShiftInput } from './dto/create-shift.input';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  findByStaff(staffId: string): Promise<ShiftType[]> {
    return this.prisma.shift.findMany({
      where: { staffId },
    }) as Promise<ShiftType[]>;
  }

  async create(input: CreateShiftInput): Promise<ShiftType> {
    try {
      const shift = await this.prisma.shift.create({
        data: {
          staffId: input.staffId,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });
      return shift as ShiftType;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code: string }).code === 'P2003'
      ) {
        throw new BadRequestException(
          `Staff with id "${input.staffId}" does not exist`,
        );
      }
      throw err;
    }
  }

  async delete(shiftId: number): Promise<boolean> {
    await this.prisma.shift.delete({
      where: { shiftId },
    });
    return true;
  }
}
