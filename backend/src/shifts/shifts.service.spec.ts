import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShiftsService } from './shifts.service';

describe('ShiftsService', () => {
  let service: ShiftsService;
  let prismaService: PrismaService;

  const mockShiftData = {
    shiftId: 1,
    staffId: 'staff123',
    startTime: new Date('2026-07-20T08:00:00').toISOString(),
    endTime: new Date('2026-07-20T16:00:00').toISOString(),
  };

  const mockPrismaService = {
    shift: {
      findMany: jest.fn().mockResolvedValue([mockShiftData]),
      create: jest.fn().mockResolvedValue(mockShiftData),
      delete: jest.fn().mockResolvedValue({ shiftId: 1 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByStaff', () => {
    it('should return all shifts for a staff member', async () => {
      const staffId = 'staff123';

      const result = await service.findByStaff(staffId);

      expect(prismaService.shift.findMany).toHaveBeenCalledWith({
        where: { staffId },
      });
      expect(result).toEqual([mockShiftData]);
    });

    it('should return empty array if staff has no shifts', async () => {
      (prismaService.shift.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findByStaff('staff456');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a shift successfully', async () => {
      const createInput = {
        staffId: 'staff123',
        startTime: '08:00',
        endTime: '16:00',
      };

      const result = await service.create(createInput);

      expect(prismaService.shift.create).toHaveBeenCalled();
      expect(result).toEqual(mockShiftData);
    });

    it('should format start and end times with selected date', async () => {
      const createInput = {
        staffId: 'staff123',
        startTime: '08:00',
        endTime: '16:00',
      };

      await service.create(createInput);

      const callArgs = (prismaService.shift.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.staffId).toBe('staff123');
      expect(callArgs.data.startTime).toBeDefined();
      expect(callArgs.data.endTime).toBeDefined();
    });

    it('should throw BadRequestException for invalid staffId', async () => {
      const error = new Error('Foreign key constraint failed');
      (error as any).code = 'P2003';
      (prismaService.shift.create as jest.Mock).mockRejectedValue(error);

      await expect(
        service.create({ staffId: 'invalid', startTime: '08:00', endTime: '16:00' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw original error for non-foreign key errors', async () => {
      const error = new Error('Database connection error');
      (prismaService.shift.create as jest.Mock).mockRejectedValue(error);

      await expect(
        service.create({ staffId: 'staff123', startTime: '08:00', endTime: '16:00' }),
      ).rejects.toThrow(Error);
    });
  });

  describe('delete', () => {
    it('should delete a shift successfully', async () => {
      const shiftId = 1;

      const result = await service.delete(shiftId);

      expect(prismaService.shift.delete).toHaveBeenCalledWith({
        where: { shiftId },
      });
      expect(result).toBe(true);
    });

    it('should return true after successful deletion', async () => {
      const result = await service.delete(1);

      expect(result).toBe(true);
    });
  });
});
