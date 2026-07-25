import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SeatsService } from './seats.service';

describe('SeatsService', () => {
  let service: SeatsService;
  let prismaService: PrismaService;

  const mockSeatData = {
    seatId: 1,
    tripId: 1,
    seatClassId: 1,
    status: 'Available',
    seatClass: {
      seatClassId: 1,
      name: 'Economy',
      price: 50000,
    },
  };

  const mockPrismaService = {
    seat: {
      create: jest.fn().mockResolvedValue(mockSeatData),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SeatsService>(SeatsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new seat successfully', async () => {
      const createInput = { tripId: 1, seatClassId: 1 };

      const result = await service.create(createInput);

      expect(prismaService.seat.create).toHaveBeenCalledWith({
        data: {
          tripId: 1,
          seatClassId: 1,
          status: 'Available',
        },
        include: {
          seatClass: true,
        },
      });
      expect(result).toEqual(mockSeatData);
    });

    it('should set status to Available by default', async () => {
      const createInput = { tripId: 1, seatClassId: 1 };

      await service.create(createInput);

      const callArgs = (prismaService.seat.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.status).toBe('Available');
    });

    it('should include seatClass in the response', async () => {
      const createInput = { tripId: 1, seatClassId: 1 };

      const result = await service.create(createInput);

      expect(result).toHaveProperty('seatClass');
      expect(result.seatClass).toHaveProperty('seatClassId');
      expect(result.seatClass).toHaveProperty('name');
      expect(result.seatClass).toHaveProperty('price');
    });

    it('should throw BadRequestException for invalid tripId', async () => {
      const error = new Error('Foreign key constraint failed');
      (error as any).code = 'P2003';
      (prismaService.seat.create as jest.Mock).mockRejectedValue(error);

      await expect(
        service.create({ tripId: 999, seatClassId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid seatClassId', async () => {
      const error = new Error('Foreign key constraint failed');
      (error as any).code = 'P2003';
      (prismaService.seat.create as jest.Mock).mockRejectedValue(error);

      await expect(
        service.create({ tripId: 1, seatClassId: 999 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw original error for non-foreign key errors', async () => {
      const error = new Error('Database connection error');
      (prismaService.seat.create as jest.Mock).mockRejectedValue(error);

      await expect(service.create({ tripId: 1, seatClassId: 1 })).rejects.toThrow(
        Error,
      );
    });
  });
});
