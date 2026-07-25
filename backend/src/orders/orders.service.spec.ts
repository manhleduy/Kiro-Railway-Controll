import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { CreateOrderInput } from './dto/create-order.input';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockOrderData = {
    orderId: 1,
    customerId: 'cust123',
    status: 'Confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
    staffId: 'staff123',
    tickets: [
      {
        ticketId: 1,
        orderId: 1,
        seatId: 1,
        passName: 'John Doe',
        passCCCD: '123456789',
      },
    ],
    payment: {
      paymentId: 1,
      orderId: 1,
      methodId: 1,
      amount: 100000,
      method: {
        methodId: 1,
        methodName: 'Credit Card',
      },
    },
    customer: {
      customerId: 'cust123',
      email: 'test@gmail.com',
      fullname: 'Test User',
      phone: '0123456789',
    },
  };

  const createOrderInput: CreateOrderInput = {
    customerId: 'cust123',
    methodId: 1,
    tickets: [
      {
        seatId: 1,
        passName: 'John Doe',
        passCCCD: '123456789',
      },
    ],
  };

  const mockPrismaService = {
    $executeRaw: jest.fn(),
    order: {
      create: jest.fn().mockResolvedValue(mockOrderData),
      findFirst: jest.fn().mockResolvedValue(mockOrderData),
      findMany: jest.fn().mockResolvedValue([mockOrderData]),
      findUnique: jest.fn().mockResolvedValue(mockOrderData),
      update: jest.fn().mockResolvedValue(mockOrderData),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create a new order successfully', async () => {
      (prismaService.$executeRaw as jest.Mock).mockResolvedValue(undefined);

      const result = await service.createOrder(createOrderInput);

      expect(prismaService.$executeRaw).toHaveBeenCalled();
      expect(prismaService.order.findFirst).toHaveBeenCalledWith({
        where: { customerId: 'cust123' },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockOrderData);
    });

    it('should throw BadRequestException when order creation fails', async () => {
      const error = new Error('Database error');
      (prismaService.$executeRaw as jest.Mock).mockRejectedValue(error);

      await expect(service.createOrder(createOrderInput)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('myOrders', () => {
    it('should return all orders for a customer', async () => {
      const customerId = 'cust123';

      const result = await service.myOrders(customerId);

      expect(prismaService.order.findMany).toHaveBeenCalledWith({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result).toEqual([mockOrderData]);
    });

    it('should return empty array if customer has no orders', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue([]);
      const customerId = 'cust456';

      const result = await service.myOrders(customerId);

      expect(result).toEqual([]);
    });
  });

  describe('pendingOrders', () => {
  it('should return all pending orders', async () => {
    // 1. DEFINE the mock data
    const mockOrders = [
      {
        orderId: 1,
        customerId: "cust123",
        staffId: "staff123",
        status: "Pending", // Note: Changed to Pending to match test intent
        createdAt: new Date('2026-07-25T09:08:07.025Z'),
        updatedAt: new Date('2026-07-25T09:08:07.025Z'),
        customer: {
          customerId: "cust123",
          email: "test@gmail.com",
          fullname: "Test User",
          phone: "0123456789",
        },
        payment: {
          paymentId: 1,
          orderId: 1,
          amount: 100000,
          methodId: 1,
          method: {
            methodId: 1,
            methodName: "Credit Card",
          },
        },
        tickets: [
          {
            ticketId: 1,
            orderId: 1,
            passCCCD: "123456789",
            passName: "John Doe",
            seatId: 1,
          },
        ],
      },
    ];

    // 2. CONFIGURE the mock FIRST
    (prismaService.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

    // 3. CALL the service method SECOND
    const result = await service.pendingOrders();

    // 4. ASSERTIONS LAST
    expect(prismaService.order.findMany).toHaveBeenCalledWith({
      where: { status: 'Pending' },
      orderBy: { createdAt: 'desc' },
      include: expect.any(Object),
    });

    expect(result).toEqual(mockOrders);
  });

    it('should return empty array if no pending orders exist', async () => {
      (prismaService.order.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.pendingOrders();

      expect(result).toEqual([]);
    });
  });

  describe('approveOrder', () => {
    it('should approve an order successfully', async () => {
      const orderId = 1;
      const status = 'Confirmed';
      const staffId = 'staff123';

      const pendingOrder = { ...mockOrderData, status: 'Pending' };
      (prismaService.order.findUnique as jest.Mock)
        .mockResolvedValueOnce(pendingOrder)
        .mockResolvedValueOnce(mockOrderData);

      const result = await service.approveOrder(orderId, status, staffId);

      expect(prismaService.order.findUnique).toHaveBeenCalledWith({
        where: { orderId },
      });
      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { orderId },
        data: { status, staffId },
      });
      expect(result).toEqual(mockOrderData);
    });

    it('should throw BadRequestException if order not found', async () => {
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.approveOrder(999, 'Confirmed', 'staff123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if order is not pending', async () => {
      const confirmedOrder = { ...mockOrderData, status: 'Confirmed' };
      (prismaService.order.findUnique as jest.Mock).mockResolvedValue(
        confirmedOrder,
      );

      await expect(
        service.approveOrder(1, 'Confirmed', 'staff123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
