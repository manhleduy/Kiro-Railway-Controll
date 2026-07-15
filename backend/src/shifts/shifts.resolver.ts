import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftType } from './dto/shift.type';
import { CreateShiftInput } from './dto/create-shift.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => ShiftType)
export class ShiftsResolver {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Query(() => [ShiftType], { name: 'shifts' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  findByStaff(@Args('staffId') staffId: string): Promise<ShiftType[]> {
    return this.shiftsService.findByStaff(staffId);
  }

  @Mutation(() => ShiftType)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createShift(@Args('input') input: CreateShiftInput): Promise<ShiftType> {
    return this.shiftsService.create(input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteShift(
    @Args('shiftId', { type: () => Int }) shiftId: number,
  ): Promise<boolean> {
    return this.shiftsService.delete(shiftId);
  }
}
