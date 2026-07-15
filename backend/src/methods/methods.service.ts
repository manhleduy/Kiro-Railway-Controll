import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MethodType } from './dto/method.type';

@Injectable()
export class MethodsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<MethodType[]> {
    return this.prisma.method.findMany();
  }
}
