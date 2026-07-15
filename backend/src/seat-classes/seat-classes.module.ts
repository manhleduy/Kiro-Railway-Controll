import { Module } from '@nestjs/common';
import { SeatClassesResolver } from './seat-classes.resolver';
import { SeatClassesService } from './seat-classes.service';

@Module({
  providers: [SeatClassesResolver, SeatClassesService],
  exports: [SeatClassesService],
})
export class SeatClassesModule {}
