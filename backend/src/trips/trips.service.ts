import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TripType } from './dto/trip.type';
import { CreateTripInput } from './dto/create-trip.input';

const tripInclude = {
  seats: {
    include: { seatClass: true },
  },
  station: true,
  route: true,
} as const;

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(stationName?: string, track?: string): Promise<TripType[]> {
    return this.prisma.trip.findMany({
      where: {
        ...(track ? { track: { contains: track, mode: 'insensitive' } } : {}),
        ...(stationName
          ? { station: { name: { contains: stationName, mode: 'insensitive' } } }
          : {}),
      },
      orderBy: { arrivalDate: 'asc' },
      include: tripInclude,
    }) as Promise<TripType[]>;
  }

  findOne(id: number): Promise<TripType | null> {
    return this.prisma.trip.findUnique({
      where: { tripId: id },
      include: tripInclude,
    }) as Promise<TripType | null>;
  }

  async create(input: CreateTripInput): Promise<TripType> {
    const trip = await this.prisma.trip.create({
      data: {
        track: input.track,
        arrivalDate: input.arrivalDate,
        ...(input.stationId ? { stationId: input.stationId } : {}),
      },
      include: tripInclude,
    });

    // Create the Route record when travelTime is provided
    if (input.travelTime !== undefined && input.travelTime !== null) {
      await this.prisma.route.create({
        data: { tripId: trip.tripId, travelTime: input.travelTime },
      });
    }

    // Re-fetch to include the freshly created route
    return this.prisma.trip.findUnique({
      where: { tripId: trip.tripId },
      include: tripInclude,
    }) as Promise<TripType>;
  }

  async delete(id: number): Promise<boolean> {
    await this.prisma.trip.delete({ where: { tripId: id } });
    return true;
  }
}
