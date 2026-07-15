import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SeatClassesService } from './seat-classes.service';
import { SeatClassType } from './dto/seat-class.type';
import { CreateSeatClassInput } from './dto/create-seat-class.input';
import { UpdateSeatClassInput } from './dto/update-seat-class.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => SeatClassType)
export class SeatClassesResolver {
  constructor(private readonly seatClassesService: SeatClassesService) {}

  @Query(() => [SeatClassType], { name: 'seatClasses' })
  findAll(): Promise<SeatClassType[]> {
    return this.seatClassesService.findAll();
  }

  @Mutation(() => SeatClassType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createSeatClass(
    @Args('input') input: CreateSeatClassInput,
  ): Promise<SeatClassType> {
    return this.seatClassesService.create(input);
  }

  @Mutation(() => SeatClassType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateSeatClass(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateSeatClassInput,
  ): Promise<SeatClassType> {
    return this.seatClassesService.update(id, input);
  }
}
