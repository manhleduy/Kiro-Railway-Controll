import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SeatType } from '../trips/dto/seat.type';
import { CreateSeatInput } from './dto/create-seat.input';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSeatInput): Promise<SeatType> {
    try {
      const seat = await this.prisma.seat.create({
        data: {
          tripId: input.tripId,
          seatClassId: input.seatClassId,
          status: 'Available',
        },
        include: {
          seatClass: true,
        },
      });
      return seat as unknown as SeatType;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code: string }).code === 'P2003'
      ) {
        throw new BadRequestException(
          'Invalid tripId or seatClassId — referenced record does not exist',
        );
      }
      throw err;
    }
  }
}
