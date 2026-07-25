import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { MethodsService } from './methods.service';

describe('MethodsService', () => {
  let service: MethodsService;
  let prismaService: PrismaService;

  const mockMethodsData = [
    {
      methodId: 1,
      methodName: 'Credit Card',
    },
    {
      methodId: 2,
      methodName: 'Bank Transfer',
    },
    {
      methodId: 3,
      methodName: 'E-Wallet',
    },
  ];

  const mockPrismaService = {
    method: {
      findMany: jest.fn().mockResolvedValue(mockMethodsData),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MethodsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MethodsService>(MethodsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all payment methods', async () => {
      const result = await service.findAll();

      expect(prismaService.method.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockMethodsData);
      expect(result.length).toBe(3);
    });

    it('should return empty array if no methods exist', async () => {
      (prismaService.method.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should have correct method structure', async () => {
      const result = await service.findAll();

      result.forEach((method) => {
        expect(method).toHaveProperty('methodId');
        expect(method).toHaveProperty('methodName');
      });
    });
  });
});
