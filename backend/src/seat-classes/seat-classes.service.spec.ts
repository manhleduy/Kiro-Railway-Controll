import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SeatClassesService } from './seat-classes.service';

describe('SeatClassesService', () => {
  let service: SeatClassesService;
  let prismaService: PrismaService;

  const mockSeatClassData = {
    seatClassId: 1,
    name: 'Economy',
    price: 50000,
  };

  const mockSeatClassesData = [
    { seatClassId: 1, name: 'Economy', price: 50000 },
    { seatClassId: 2, name: 'Business', price: 100000 },
    { seatClassId: 3, name: 'First Class', price: 150000 },
  ];

  const mockPrismaService = {
    seatClass: {
      findMany: jest.fn().mockResolvedValue(mockSeatClassesData),
      create: jest.fn().mockResolvedValue(mockSeatClassData),
      update: jest.fn().mockResolvedValue(mockSeatClassData),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatClassesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SeatClassesService>(SeatClassesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all seat classes', async () => {
      const result = await service.findAll();

      expect(prismaService.seatClass.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockSeatClassesData);
      expect(result.length).toBe(3);
    });

    it('should return empty array if no seat classes exist', async () => {
      (prismaService.seatClass.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new seat class', async () => {
      const createInput = { name: 'Economy', price: 50000 };

      const result = await service.create(createInput);

      expect(prismaService.seatClass.create).toHaveBeenCalledWith({
        data: createInput,
      });
      expect(result).toEqual(mockSeatClassData);
    });

    it('should return created seat class with correct properties', async () => {
      const createInput = { name: 'Business', price: 100000 };

      const result = await service.create(createInput);

      expect(result).toHaveProperty('seatClassId');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('price');
    });
  });

  describe('update', () => {
    it('should update a seat class successfully', async () => {
      const id = 1;
      const updateInput = { name: 'Economy Plus', price: 75000 };

      const result = await service.update(id, updateInput);

      expect(prismaService.seatClass.update).toHaveBeenCalledWith({
        where: { seatClassId: id },
        data: updateInput,
      });
      expect(result).toEqual(mockSeatClassData);
    });

    it('should update only name when price is not provided', async () => {
      const id = 1;
      const updateInput = { name: 'Economy Plus' };

      await service.update(id, updateInput);

      expect(prismaService.seatClass.update).toHaveBeenCalledWith({
        where: { seatClassId: id },
        data: { name: 'Economy Plus' },
      });
    });

    it('should update only price when name is not provided', async () => {
      const id = 1;
      const updateInput = { price: 75000 };

      await service.update(id, updateInput);

      expect(prismaService.seatClass.update).toHaveBeenCalledWith({
        where: { seatClassId: id },
        data: { price: 75000 },
      });
    });

    it('should not include undefined values in update data', async () => {
      const id = 1;
      const updateInput = { name: 'Economy' };

      await service.update(id, updateInput);

      const callArgs = (prismaService.seatClass.update as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.data).not.toHaveProperty('price');
    });
  });
});


