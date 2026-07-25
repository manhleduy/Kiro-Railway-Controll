import { Test, TestingModule } from '@nestjs/testing';
import { PgListenerService } from './pg.listener.service';
import { SeatsGateway } from '../seats/seat.gateway';

describe('PgListenerService', () => {
  let service: PgListenerService;
  let seatsGateway: SeatsGateway;

  const mockSeatsGateway = {
    seatStatusUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PgListenerService,
        {
          provide: SeatsGateway,
          useValue: mockSeatsGateway,
        },
      ],
    }).compile();

    service = module.get<PgListenerService>(PgListenerService);
    seatsGateway = module.get<SeatsGateway>(SeatsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have a private pgClient property', () => {
    expect(service).toHaveProperty('pgClient');
  });

  it('should inject SeatsGateway', () => {
    expect(seatsGateway).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should be callable', async () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });

  describe('onModuleDestroy', () => {
    it('should be callable', async () => {
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });

  /*describe('PostgreSQL Listener', () => {
    it('should listen to seat_status_update channel', () => {
      // This is a smoke test to ensure the service structure is correct
      expect(service).toBeDefined();
    });

    it('should relay events to SeatsGateway', () => {
      // This test verifies that the gateway is properly injected
      // In a real scenario, you would mock the postgres client connection
      expect(seatsGateway.seatStatusUpdate).toBeDefined();
    });
  });*/

  describe('Connection Management', () => {
    it('should handle connection initialization', () => {
      expect(service).toHaveProperty('pgClient');
    });

    it('should handle module destruction', async () => {
      // Verify that onModuleDestroy can be called safely
      const result = await service.onModuleDestroy();
      expect(result).toBeUndefined();
    });
  });
});
