import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomersService } from './customers.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('CustomersService', () => {
  let service: CustomersService;
  let prismaService: PrismaService;

  const mockCustomerData = {
    customerId: 'cust123',
    fullname: 'John Doe',
    email: 'john@example.com',
    phone: '0123456789',
    rank: 1,
    point: 100,
    password: 'hashedPassword123',
  };

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order:{
        findMany: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a customer by id', async () => {
      const customerId = 'cust123';
      (prismaService.customer.findUnique as jest.Mock).mockResolvedValue(
        mockCustomerData,
      );

      const result = await service.findById(customerId);

      expect(prismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { customerId },
        select: {
          customerId: true,
          fullname: true,
          email: true,
          phone: true,
          rank: true,
          point: true,
        },
      });
      expect(result).toEqual(mockCustomerData);
    });

    it('should throw NotFoundException when customer not found', async () => {
      (prismaService.customer.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCustomer', () => {
    it('should update customer successfully', async () => {
      const customerId = 'cust123';
      const updateInput = { fullname: 'Jane Doe', phone: '9876543210' };
      const updatedData = { ...mockCustomerData, ...updateInput };

      (prismaService.customer.update as jest.Mock).mockResolvedValue(
        updatedData,
      );

      const result = await service.updateCustomer(customerId, updateInput);

      expect(prismaService.customer.update).toHaveBeenCalledWith({
        where: { customerId },
        data: updateInput,
        select: {
          customerId: true,
          fullname: true,
          email: true,
          phone: true,
          rank: true,
          point: true,
        },
      });
      expect(result).toEqual(updatedData);
    });

    it('should update only fullname when phone is not provided', async () => {
      const customerId = 'cust123';
      const updateInput = { fullname: 'Jane Doe' };

      (prismaService.customer.update as jest.Mock).mockResolvedValue({
        ...mockCustomerData,
        fullname: 'Jane Doe',
      });

      await service.updateCustomer(customerId, updateInput);

      expect(prismaService.customer.update).toHaveBeenCalledWith({
        where: { customerId },
        data: { fullname: 'Jane Doe' },
        select: expect.any(Object),
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const customerId = 'cust123';
      const changeInput = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      (prismaService.customer.findUnique as jest.Mock).mockResolvedValue(
        mockCustomerData,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      (prismaService.customer.update as jest.Mock).mockResolvedValue(
        mockCustomerData,
      );

      const result = await service.changePassword(customerId, changeInput);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        changeInput.currentPassword,
        mockCustomerData.password,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(changeInput.newPassword, 10);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when customer not found', async () => {
      (prismaService.customer.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', {
          currentPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when current password is incorrect', async () => {
      (prismaService.customer.findUnique as jest.Mock).mockResolvedValue(
        mockCustomerData,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('cust123', {
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getStats', () => {
    it('should return customer stats', async () => {
      const customerId = '202416978';
      const year = 2024;

      (prismaService.customer.findUnique as jest.Mock).mockResolvedValueOnce({
        point: 100,
        rank: 1,
      });
      (prismaService.order.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
            orderId: 1,
            createdAt: new  Date('2026-07-20 18:31:23.858'),
            status: "Pending",
            payment: {
                price: "100,000"
            }
        },
        {
            orderId: 2,
            createdAt: new Date('2026-07-20 18:31:23.858'),
            status: "Pending",
            payment: {
                price: "120,000"
            }
        }

    ])
    .mockResolvedValueOnce([
        {
        createdAt: new Date('2026-07-20 18:31:23.858'),
        tickets:[
            {ticketId: 1},
            {ticketId: 2}
        ]
    }
    ])

      const result = await service.getStats(customerId, year);

      expect(prismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { customerId },
        select: { point: true, rank: true },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when customer not found', async () => {
      (prismaService.customer.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getStats('nonexistent', 2024)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
