import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SeatClassType } from './dto/seat-class.type';
import { CreateSeatClassInput } from './dto/create-seat-class.input';
import { UpdateSeatClassInput } from './dto/update-seat-class.input';

@Injectable()
export class SeatClassesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<SeatClassType[]> {
    return this.prisma.seatClass.findMany();
  }

  create(input: CreateSeatClassInput): Promise<SeatClassType> {
    return this.prisma.seatClass.create({
      data: {
        name: input.name,
        price: input.price,
      },
    });
  }

  update(id: number, input: UpdateSeatClassInput): Promise<SeatClassType> {
    const data: { name?: string; price?: number } = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.price !== undefined) data.price = input.price;

    return this.prisma.seatClass.update({
      where: { seatClassId: id },
      data,
    });
  }
}
