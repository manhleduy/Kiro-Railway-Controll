import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let prismaService: PrismaService;

  const mockFeedbackData = {
    feedbackId: 1,
    customerId: 'cust123',
    content: 'Great service!',
    createdAt: new Date(),
  };

  const mockPrismaService = {
    feedback: {
      create: jest.fn().mockResolvedValue(mockFeedbackData),
      findMany: jest.fn().mockResolvedValue([mockFeedbackData]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create feedback successfully', async () => {
      const customerId = 'cust123';
      const content = 'Great service!';

      const result = await service.create(customerId, content);

      expect(prismaService.feedback.create).toHaveBeenCalledWith({
        data: {
          customerId,
          content: content.trim(),
        },
      });
      expect(result).toEqual(mockFeedbackData);
    });

    it('should trim whitespace from content', async () => {
      const customerId = 'cust123';
      const content = '  Great service!  ';

      await service.create(customerId, content);

      expect(prismaService.feedback.create).toHaveBeenCalledWith({
        data: {
          customerId,
          content: 'Great service!',
        },
      });
    });

    it('should throw BadRequestException for empty content', async () => {
      await expect(service.create('cust123', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for whitespace-only content', async () => {
      await expect(service.create('cust123', '   ')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByCustomer', () => {
    it('should return all feedbacks for a customer', async () => {
      const customerId = 'cust123';

      const result = await service.findByCustomer(customerId);

      expect(prismaService.feedback.findMany).toHaveBeenCalledWith({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockFeedbackData]);
    });

    it('should return empty array if customer has no feedbacks', async () => {
      (prismaService.feedback.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findByCustomer('cust456');

      expect(result).toEqual([]);
    });
  });
});
