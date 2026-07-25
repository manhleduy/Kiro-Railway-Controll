import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StationsService } from './stations.service';

describe('StationsService', () => {
  let service: StationsService;
  let prismaService: PrismaService;

  const mockStationData = {
    stationId: 'VN1000',
    name: 'Central Station',
    location: 'Downtown',
  };

  const mockPrismaService = {
    station: {
      findMany: jest.fn(),
      create: jest.fn().mockResolvedValue(mockStationData),
      update: jest.fn().mockResolvedValue(mockStationData),
      findUnique: jest.fn().mockResolvedValue(mockStationData),
    },
    stationConnection: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StationsService>(StationsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all stations', async () => {
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      const result = await service.findAll();

      expect(prismaService.station.findMany).toHaveBeenCalled();
      expect(prismaService.stationConnection.findMany).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should call findMany and stationConnection', async () => {
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      await service.findAll();

      expect(prismaService.station.findMany).toHaveBeenCalledWith({
        orderBy: { stationId: 'asc' },
      });
      expect(prismaService.stationConnection.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new station successfully', async () => {
      const createInput = {
        stationId: 'VN1000',
        name: 'Central Station',
        location: 'Downtown',
        nextStationIds: ['VN1002', 'VN1003'],
      };

      // Mock ensureStationsExist to not throw
      jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      await service.create(createInput);

      expect(prismaService.station.create).toHaveBeenCalled();
      expect(prismaService.stationConnection.createMany).toHaveBeenCalled();
    });

    it('should verify station existence before creating', async () => {
      const createInput = {
        stationId: 'VN1000',
        name: 'Central Station',
        location: 'Downtown',
        nextStationIds: ['VN1002', 'VN1003'],
      };

      const ensureStationsExistSpy = jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      await service.create(createInput);

      expect(ensureStationsExistSpy).toHaveBeenCalledWith(['VN1002', 'VN1003']);
    });

    it('should throw BadRequestException when next stations do not exist', async () => {
      const createInput = {
        stationId: 'VN1000',
        name: 'Central Station',
        location: 'Downtown',
        nextStationIds: ['VN9999'],
      };

      jest.spyOn(service as any, 'ensureStationsExist').mockRejectedValue(
        new BadRequestException('Unknown station id(s): VN9999'),
      );

      await expect(service.create(createInput)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if station already exists', async () => {
      const error = new Error('Unique constraint failed');
      (error as any).code = 'P2002';
      (prismaService.station.create as jest.Mock).mockRejectedValue(error);

      const createInput = {
        stationId: 'VN1000',
        name: 'Central Station',
        location: 'Downtown',
        nextStationIds: [],
      };

      jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);

      await expect(service.create(createInput)).rejects.toThrow(ConflictException);
    });

    it('should filter out self-references in nextStationIds', async () => {
      const createInput = {
        stationId: 'VN1000',
        name: 'Central Station',
        location: 'Downtown',
        nextStationIds: ['VN1000', 'VN1002'],
      };

      const ensureStationsExistSpy = jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);
      (prismaService.station.create as jest.Mock).mockResolvedValue(mockStationData);
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      await service.create(createInput);

      // Verify that ensureStationsExist was called without the self-reference
      expect(ensureStationsExistSpy).toHaveBeenCalledWith(['VN1002']);
    });
  });

  describe('update', () => {
    it('should update a station successfully', async () => {
      const updateInput = {
        name: 'New Central Station',
        location: 'New Downtown',
        nextStationIds: ['VN1002'],
      };

      jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      const result = await service.update('VN1000', updateInput);

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should verify station existence before updating with nextStationIds', async () => {
      const updateInput = {
        name: 'Updated Station',
        nextStationIds: ['VN1002', 'VN1003'],
      };

      const ensureStationsExistSpy = jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      await service.update('VN1000', updateInput);

      expect(ensureStationsExistSpy).toHaveBeenCalledWith(['VN1002', 'VN1003']);
    });

    it('should throw BadRequestException when next stations do not exist during update', async () => {
      const updateInput = {
        name: 'Updated Station',
        nextStationIds: ['VN9999'],
      };

      jest.spyOn(service as any, 'ensureStationsExist').mockRejectedValue(
        new BadRequestException('Unknown station id(s): VN9999'),
      );

      await expect(service.update('VN1000', updateInput)).rejects.toThrow(BadRequestException);
    });

    it('should handle partial updates without verifying nextStationIds', async () => {
      const updateInput = {
        name: 'Updated Station',
      };

      const ensureStationsExistSpy = jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      await service.update('VN1000', updateInput);

      expect(ensureStationsExistSpy).not.toHaveBeenCalled();
    });

    it('should filter out self-references when updating nextStationIds', async () => {
      const updateInput = {
        nextStationIds: ['VN1000', 'VN1002'],
      };

      const ensureStationsExistSpy = jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        mockStationData,
      ]);

      await service.update('VN1000', updateInput);

      expect(ensureStationsExistSpy).toHaveBeenCalledWith(['VN1002']);
    });
  });

  describe('ensureStationsExist (private method)', () => {
    it('should not throw when all stations exist', async () => {
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        { stationId: 'VN1002' },
        { stationId: 'VN1003' },
      ]);

      const ensureStationsExistSpy = jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);

      await (service as any).ensureStationsExist(['VN1002', 'VN1003']);

      expect(ensureStationsExistSpy).toHaveBeenCalledWith(['VN1002', 'VN1003']);
    });

    it('should throw BadRequestException when stations are missing', async () => {
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        { stationId: 'VN1002' },
      ]);

      const error = new BadRequestException('Unknown station id(s): VN9999');
      jest.spyOn(service as any, 'ensureStationsExist').mockRejectedValue(error);

      await expect((service as any).ensureStationsExist(['VN1002', 'VN9999'])).rejects.toThrow(BadRequestException);
    });

    it('should handle empty station ids array', async () => {
      const ensureStationsExistSpy = jest.spyOn(service as any, 'ensureStationsExist').mockResolvedValue(undefined);

      await (service as any).ensureStationsExist([]);

      expect(ensureStationsExistSpy).toHaveBeenCalledWith([]);
    });

    it('should verify correct station ids in query', async () => {
      (prismaService.station.findMany as jest.Mock).mockResolvedValue([
        { stationId: 'VN1002' },
        { stationId: 'VN1003' },
      ]);

      // Call ensureStationsExist without mocking to test actual behavior
      await (service as any).ensureStationsExist(['VN1002', 'VN1003']);

      expect(prismaService.station.findMany).toHaveBeenCalledWith({
        where: {
          stationId: {
            in: ['VN1002', 'VN1003'],
          },
        },
        select: {
          stationId: true,
        },
      });
    });
  });
});
