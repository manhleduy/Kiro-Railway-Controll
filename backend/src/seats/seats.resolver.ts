import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { SeatType } from '../trips/dto/seat.type';
import { CreateSeatInput } from './dto/create-seat.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => SeatType)
export class SeatsResolver {
  constructor(private readonly seatsService: SeatsService) {}

  @Mutation(() => SeatType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createSeat(@Args('input') input: CreateSeatInput): Promise<SeatType> {
    return this.seatsService.create(input);
  }
}
