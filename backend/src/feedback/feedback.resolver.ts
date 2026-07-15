import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackType } from './dto/feedback.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => FeedbackType)
export class FeedbackResolver {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Mutation(() => FeedbackType)
  @UseGuards(JwtAuthGuard)
  createFeedback(
    @Args('customerId') customerId: string,
    @Args('content') content: string,
  ): Promise<FeedbackType> {
    return this.feedbackService.create(customerId, content);
  }

  @Query(() => [FeedbackType], { name: 'feedbacks' })
  @UseGuards(JwtAuthGuard)
  findByCustomer(
    @Args('customerId') customerId: string,
  ): Promise<FeedbackType[]> {
    return this.feedbackService.findByCustomer(customerId);
  }
}
