import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StationsService } from './stations.service';
import { StationType } from './dto/station.type';
import { CreateStationInput } from './dto/create-station.input';
import { UpdateStationInput } from './dto/update-station.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => StationType)
export class StationsResolver {
  constructor(private readonly stationsService: StationsService) {}

  @Query(() => [StationType], { name: 'stations' })
  findAll(): Promise<StationType[]> {
    return this.stationsService.findAll();
  }

  @Mutation(() => StationType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createStation(
    @Args('input') input: CreateStationInput,
  ): Promise<StationType> {
    return this.stationsService.create(input);
  }

  @Mutation(() => StationType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStation(
    @Args('id') id: string,
    @Args('input') input: UpdateStationInput,
  ): Promise<StationType> {
    return this.stationsService.update(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteStation(@Args('id') id: string): Promise<boolean> {
    return this.stationsService.delete(id);
  }
}
