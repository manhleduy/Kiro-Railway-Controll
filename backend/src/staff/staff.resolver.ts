import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffProfile } from './dto/staff-profile.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Resolver(() => StaffProfile)
export class StaffResolver {
  constructor(private readonly staffService: StaffService) {}

  @Query(() => StaffProfile, { name: 'staff' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStaff(@Args('id') id: string): Promise<StaffProfile> {
    return this.staffService.findById(id);
  }
}
