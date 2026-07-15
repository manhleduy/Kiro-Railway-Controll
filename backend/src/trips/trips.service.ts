import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TripType } from './dto/trip.type';
import { CreateTripInput } from './dto/create-trip.input';

const tripInclude = {
  seats: {
    include: {
      seatClass: true,
    },
  },
} as const;

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(track?: string): Promise<TripType[]> {
    return this.prisma.trip.findMany({
      where: track
        ? { track: { contains: track, mode: 'insensitive' } }
        : undefined,
      include: tripInclude,
    }) as Promise<TripType[]>;
  }

  async findOne(id: number): Promise<TripType | null> {
    return this.prisma.trip.findUnique({
      where: { tripId: id },
      include: tripInclude,
    }) as Promise<TripType | null>;
  }

  create(input: CreateTripInput): Promise<TripType> {
    return this.prisma.trip.create({
      data: {
        track: input.track,
        arrivalDate: input.arrivalDate,
      },
      include: tripInclude,
    }) as Promise<TripType>;
  }

  async delete(id: number): Promise<boolean> {
    await this.prisma.trip.delete({
      where: { tripId: id },
    });
    return true;
  }
}
