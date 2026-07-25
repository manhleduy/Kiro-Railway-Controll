import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffService } from './staff.service';

describe('StaffService', () => {
  let service: StaffService;
  let prismaService: PrismaService;

  const mockStaffData = {
    staffId: '202416978',
    fullname: 'John Staff',
    email: 'staff@example.com',
    phone: '0123456789',
    role: 'supervisor',
  };

  const mockPrismaService = {
    staff: {
      findUnique: jest.fn().mockResolvedValue(mockStaffData),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a staff member by id', async () => {
      const staffId = 'staff123';

      const result = await service.findById(staffId);

      expect(prismaService.staff.findUnique).toHaveBeenCalledWith({
        where: { staffId },
        select: {
          staffId: true,
          fullname: true,
          email: true,
          phone: true,
          role: true,
        },
      });
      expect(result).toEqual(mockStaffData);
    });

    it('should select only specific fields', async () => {
      await service.findById('202416978');

      const callArgs = (prismaService.staff.findUnique as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.select).toHaveProperty('staffId');
      expect(callArgs.select).toHaveProperty('fullname');
      expect(callArgs.select).toHaveProperty('email');
      expect(callArgs.select).toHaveProperty('phone');
      expect(callArgs.select).toHaveProperty('role');
    });

    it('should throw NotFoundException when staff member not found', async () => {
      (prismaService.staff.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException with correct message', async () => {
      (prismaService.staff.findUnique as jest.Mock).mockResolvedValue(null);
      const staffId = 'invalid123';

      try {
        await service.findById(staffId);
        fail('Should have thrown NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(staffId);
      }
    });

    it('should return staff with correct properties', async () => {
      (prismaService.staff.findUnique as jest.Mock).mockResolvedValue(mockStaffData);
      const result = await service.findById('202416978');

      expect(result).toHaveProperty('staffId');
      expect(result).toHaveProperty('fullname');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('role');
    });
  });
});
