import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StationType } from './dto/station.type';
import { CreateStationInput } from './dto/create-station.input';
import { UpdateStationInput } from './dto/update-station.input';

type StationRecord = {
  stationId: string;
  name: string;
  location: string;
};

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<StationType[]> {
    const [stations, connections] = await Promise.all([
      this.prisma.station.findMany({
        orderBy: {
          stationId: 'asc',
        },
      }),
      this.prisma.stationConnection.findMany(),
    ]);

    return this.buildStationGraph(stations, connections);
  }

  async create(input: CreateStationInput): Promise<StationType> {
    const nextStationIds = this.normalizeStationIds(input.nextStationIds).filter(
      (stationId) => stationId !== input.stationId,
    );

    await this.ensureStationsExist(nextStationIds);

    try {
      await this.prisma.station.create({
        data: {
          stationId: input.stationId,
          name: input.name,
          location: input.location,
        },
      });
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

    if (nextStationIds.length > 0) {
      await this.prisma.stationConnection.createMany({
        data: nextStationIds.map((endStationId) => ({
          startStationId: input.stationId,
          endStationId,
        })),
      });
    }

    return this.findStationById(input.stationId);
  }

  async update(id: string, input: UpdateStationInput): Promise<StationType> {
    const nextStationIds =
      input.nextStationIds === undefined
        ? undefined
        : this.normalizeStationIds(input.nextStationIds).filter(
            (stationId) => stationId !== id,
          );

    if (nextStationIds !== undefined) {
      await this.ensureStationsExist(nextStationIds);
    }

    const data: {
      name?: string;
      location?: string;
    } = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.location !== undefined) data.location = input.location;

    await this.prisma.$transaction(async (tx) => {
      await tx.station.update({
        where: { stationId: id },
        data,
      });

      if (nextStationIds !== undefined) {
        await tx.stationConnection.deleteMany({
          where: { startStationId: id },
        });

        if (nextStationIds.length > 0) {
          await tx.stationConnection.createMany({
            data: nextStationIds.map((endStationId) => ({
              startStationId: id,
              endStationId,
            })),
          });
        }
      }
    });

    return this.findStationById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.$transaction([
      this.prisma.stationConnection.deleteMany({
        where: {
          OR: [{ startStationId: id }, { endStationId: id }],
        },
      }),
      this.prisma.station.delete({
        where: { stationId: id },
      }),
    ]);

    return true;
  }

  private async findStationById(stationId: string): Promise<StationType> {
    const stations = await this.findAll();
    const station = stations.find((item) => item.stationId === stationId);

    if (!station) {
      throw new BadRequestException(`Station with id "${stationId}" not found`);
    }

    return station;
  }

  private async ensureStationsExist(stationIds: string[]): Promise<void> {
    if (stationIds.length === 0) return;

    const existingStations = await this.prisma.station.findMany({
      where: {
        stationId: {
          in: stationIds,
        },
      },
      select: {
        stationId: true,
      },
    });

    const existingIds = new Set(existingStations.map((station) => station.stationId));
    const missingIds = stationIds.filter((stationId) => !existingIds.has(stationId));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Unknown station id(s): ${missingIds.join(', ')}`,
      );
    }
  }

  private normalizeStationIds(stationIds?: string[]): string[] {
    if (!stationIds) return [];

    return [...new Set(stationIds.map((stationId) => stationId.trim()).filter(Boolean))];
  }

  private buildStationGraph(
    stations: StationRecord[],
    connections: { startStationId: string; endStationId: string }[],
  ): StationType[] {
    const stationMap = new Map(stations.map((station) => [station.stationId, station]));
    const adjacency = new Map<string, string[]>();

    for (const connection of connections) {
      if (!stationMap.has(connection.startStationId) || !stationMap.has(connection.endStationId)) {
        continue;
      }

      const nextStations = adjacency.get(connection.startStationId) ?? [];
      if (!nextStations.includes(connection.endStationId)) {
        nextStations.push(connection.endStationId);
      }
      adjacency.set(connection.startStationId, nextStations);
    }

    return stations.map((station) => ({
      stationId: station.stationId,
      name: station.name,
      location: station.location,
      nextStations: (adjacency.get(station.stationId) ?? [])
        .map((stationId) => stationMap.get(stationId))
        .filter((item): item is StationRecord => Boolean(item))
        .map((nextStation) => ({
          stationId: nextStation.stationId,
          name: nextStation.name,
          location: nextStation.location,
          nextStations: [],
        })),
    }));
  }
}
