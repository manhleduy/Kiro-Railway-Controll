import { Module } from '@nestjs/common';
import { SeatsResolver } from './seats.resolver';
import { SeatsService } from './seats.service';
import { PgListenerService } from '../pg/pg.listener.service';
import { SeatsGateway } from './seat.gateway';

@Module({
  providers: [SeatsResolver, SeatsService, SeatsGateway],
})
export class SeatsModule {}
