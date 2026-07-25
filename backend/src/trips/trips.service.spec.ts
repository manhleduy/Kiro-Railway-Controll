import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { TripsService } from './trips.service';

describe('TripsService', () => {
  let service: TripsService;
  let prismaService: PrismaService;

  const mockTripData = {
    tripId: 1,
    track: 'Route A - Route B',
    arrivalDate: new Date('2026-08-01'),
    seats: [
      {
        seatId: 1,
        tripId: 1,
        status: 'Available',
        seatClass: {
          seatClassId: 1,
          name: 'Economy',
          price: 50000,
        },
      },
    ],
  };

  const mockPrismaService = {
    trip: {
      findMany: jest.fn().mockResolvedValue([mockTripData]),
      findUnique: jest.fn().mockResolvedValue(mockTripData),
      create: jest.fn().mockResolvedValue(mockTripData),
      delete: jest.fn().mockResolvedValue({ tripId: 1 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all trips', async () => {
      const result = await service.findAll();

      expect(prismaService.trip.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: expect.any(Object),
      });
      expect(result).toEqual([mockTripData]);
    });

    it('should filter by track when provided', async () => {
      const track = 'Route A';

      await service.findAll(track);

      expect(prismaService.trip.findMany).toHaveBeenCalledWith({
        where: {
          track: { contains: track, mode: 'insensitive' },
        },
        include: expect.any(Object),
      });
    });

    it('should use case-insensitive search for track', async () => {
      await service.findAll('route');

      const callArgs = (prismaService.trip.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.track.mode).toBe('insensitive');
    });

    it('should return empty array if no trips found', async () => {
      (prismaService.trip.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single trip by id', async () => {
      const tripId = 1;

      const result = await service.findOne(tripId);

      expect(prismaService.trip.findUnique).toHaveBeenCalledWith({
        where: { tripId },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTripData);
    });

    it('should return null if trip not found', async () => {
      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('should include seats with seat class information', async () => {
      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(mockTripData);

      const result = await service.findOne(1);
      expect(result).toHaveProperty('seats');
    });
  });

  describe('create', () => {
    it('should create a new trip successfully', async () => {
      const createInput = {
        track: 'Route A - Route B',
        arrivalDate: new Date('2026-08-01'),
      };

      const result = await service.create(createInput);

      expect(prismaService.trip.create).toHaveBeenCalledWith({
        data: createInput,
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTripData);
    });

    it('should return created trip with seats information', async () => {
      const createInput = {
        track: 'Route A - Route B',
        arrivalDate: new Date('2026-08-01'),
      };

      const result = await service.create(createInput);

      expect(result).toHaveProperty('tripId');
      expect(result).toHaveProperty('track');
      expect(result).toHaveProperty('arrivalDate');
      expect(result).toHaveProperty('seats');
    });
  });

  describe('delete', () => {
    it('should delete a trip successfully', async () => {
      const tripId = 1;

      const result = await service.delete(tripId);

      expect(prismaService.trip.delete).toHaveBeenCalledWith({
        where: { tripId },
      });
      expect(result).toBe(true);
    });

    it('should return true after successful deletion', async () => {
      const result = await service.delete(1);

      expect(result).toBe(true);
    });
  });
});
