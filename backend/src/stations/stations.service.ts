import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StationType } from './dto/station.type';
import { CreateStationInput } from './dto/create-station.input';
import { UpdateStationInput } from './dto/update-station.input';

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<StationType[]> {
    return this.prisma.station.findMany({
      include: { nextStations: true },
    }) as Promise<StationType[]>;
  }

  async create(input: CreateStationInput): Promise<StationType> {
    try {
      const station = await this.prisma.station.create({
        data: {
          stationId: input.stationId,
          name: input.name,
          location: input.location,
          nextStations: input.nextStationIds?.length
            ? {
                connect: input.nextStationIds.map((id) => ({
                  stationId: id,
                })),
              }
            : undefined,
        },
        include: { nextStations: true },
      });
      return station as StationType;
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          `Station with id "${input.stationId}" already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateStationInput): Promise<StationType> {
    const data: {
      name?: string;
      location?: string;
      nextStations?: { set: []; connect: { stationId: string }[] };
    } = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.location !== undefined) data.location = input.location;
    if (input.nextStationIds !== undefined) {
      data.nextStations = {
        set: [],
        connect: input.nextStationIds.map((nid) => ({ stationId: nid })),
      };
    }

    const station = await this.prisma.station.update({
      where: { stationId: id },
      data,
      include: { nextStations: true },
    });
    return station as StationType;
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.station.delete({
      where: { stationId: id },
    });
    return true;
  }
}
