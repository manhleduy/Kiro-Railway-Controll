import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackType } from './dto/feedback.type';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, content: string): Promise<FeedbackType> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Feedback content cannot be empty or whitespace');
    }

    return this.prisma.feedback.create({
      data: {
        customerId,
        content: content.trim(),
      },
    }) as Promise<FeedbackType>;
  }

  findByCustomer(customerId: string): Promise<FeedbackType[]> {
    return this.prisma.feedback.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<FeedbackType[]>;
  }
}
