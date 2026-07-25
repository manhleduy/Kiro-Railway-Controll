import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let prismaService: PrismaService;

  const mockTicketData = {
    ticketId: 1,
    orderId: 1,
    seatId: 1,
    status: 'Valid',
    passName: 'John Doe',
    passCCCD: '123456789',
    seat: {
      seatId: 1,
      tripId: 1,
      status: 'Booked',
      seatClass: {
        seatClassId: 1,
        name: 'Economy',
        price: 50000,
      },
    },
  };

  const mockPrismaService = {
    ticket: {
      findMany: jest.fn().mockResolvedValue([mockTicketData]),
      findFirst: jest.fn().mockResolvedValue(mockTicketData),
      findUnique: jest.fn().mockResolvedValue(mockTicketData),
    },
    $executeRaw: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tickets', async () => {
      const result = await service.findAll();

      expect(prismaService.ticket.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
      });
      expect(result).toEqual([mockTicketData]);
    });

    it('should filter by orderId when provided', async () => {
      const orderId = 1;

      await service.findAll(orderId);

      expect(prismaService.ticket.findMany).toHaveBeenCalledWith({
        where: { orderId },
        include: expect.any(Object),
      });
    });

    it('should filter by status when provided', async () => {
      const status = 'Valid';

      await service.findAll(undefined, status);

      expect(prismaService.ticket.findMany).toHaveBeenCalledWith({
        where: { status },
        include: expect.any(Object),
      });
    });

    it('should filter by both orderId and status when provided', async () => {
      const orderId = 1;
      const status = 'Valid';

      await service.findAll(orderId, status);

      expect(prismaService.ticket.findMany).toHaveBeenCalledWith({
        where: { orderId, status },
        include: expect.any(Object),
      });
    });

    it('should return empty array if no tickets found', async () => {
      (prismaService.ticket.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('cancelTicket', () => {
    it('should cancel a ticket successfully', async () => {
      const seatId = 1;

      const result = await service.cancelTicket(seatId);

      expect(prismaService.$executeRaw).toHaveBeenCalled();
      expect(prismaService.ticket.findFirst).toHaveBeenCalledWith({
        where: { seatId },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTicketData);
    });

    it('should throw BadRequestException when cancellation fails', async () => {
      const error = new Error('Ticket cancellation failed');
      (prismaService.$executeRaw as jest.Mock).mockRejectedValue(error);

      await expect(service.cancelTicket(999)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle unknown errors in cancellation', async () => {
      const error = 'Unknown error';
      (prismaService.$executeRaw as jest.Mock).mockRejectedValue(error);

      await expect(service.cancelTicket(1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changeTicket', () => {
    it('should change a ticket successfully', async () => {
      const ticketId = 1;
      const newSeatId = 2;
      const passCCCD = '123456789';
      const passName = 'John Doe';

      (prismaService.$executeRaw as jest.Mock).mockResolvedValue(undefined);
      (prismaService.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketData);

      const result = await service.changeTicket(
        ticketId,
        newSeatId,
        passCCCD,
        passName,
      );

      expect(prismaService.$executeRaw).toHaveBeenCalled();
      expect(prismaService.ticket.findUnique).toHaveBeenCalledWith({
        where: { ticketId },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTicketData);
    });

    it('should throw BadRequestException when change fails', async () => {
      const error = new Error('Ticket change failed');
      (prismaService.$executeRaw as jest.Mock).mockRejectedValue(error);

      await expect(
        service.changeTicket(1, 2, '123456789', 'John Doe'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle unknown errors in change operation', async () => {
      const error = 'Unknown error';
      (prismaService.$executeRaw as jest.Mock).mockRejectedValue(error);

      await expect(
        service.changeTicket(1, 2, '123456789', 'John Doe'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call the ticket_change stored procedure with correct parameters', async () => {
      const ticketId = 1;
      const newSeatId = 2;
      const passCCCD = '123456789';
      const passName = 'John Doe';

      (prismaService.$executeRaw as jest.Mock).mockResolvedValue(undefined);
      (prismaService.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketData);

      await service.changeTicket(ticketId, newSeatId, passCCCD, passName);

      expect(prismaService.$executeRaw).toHaveBeenCalled();
    });
  });
});
