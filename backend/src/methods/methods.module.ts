import { Module } from '@nestjs/common';
import { MethodsResolver } from './methods.resolver';
import { MethodsService } from './methods.service';

@Module({
  providers: [MethodsResolver, MethodsService],
})
export class MethodsModule {}
