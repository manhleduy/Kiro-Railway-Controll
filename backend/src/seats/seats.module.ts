import { Module } from '@nestjs/common';
import { SeatsResolver } from './seats.resolver';
import { SeatsService } from './seats.service';

@Module({
  providers: [SeatsResolver, SeatsService],
})
export class SeatsModule {}
