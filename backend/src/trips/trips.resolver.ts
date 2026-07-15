import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripType } from './dto/trip.type';
import { CreateTripInput } from './dto/create-trip.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => TripType)
export class TripsResolver {
  constructor(private readonly tripsService: TripsService) {}

  @Query(() => [TripType], { name: 'trips' })
  findAll(
    @Args('track', { type: () => String, nullable: true }) track?: string,
  ): Promise<TripType[]> {
    return this.tripsService.findAll(track);
  }

  @Query(() => TripType, { name: 'trip', nullable: true })
  findOne(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<TripType | null> {
    return this.tripsService.findOne(id);
  }

  @Mutation(() => TripType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createTrip(@Args('input') input: CreateTripInput): Promise<TripType> {
    return this.tripsService.create(input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteTrip(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.tripsService.delete(id);
  }
}
