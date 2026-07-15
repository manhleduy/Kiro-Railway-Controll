import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerProfile } from '../auth/dto/auth-payload-staff.type';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { ChangePasswordInput } from './dto/change-password.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => CustomerProfile)
export class CustomersResolver {
  constructor(private readonly customersService: CustomersService) {}

  @Query(() => CustomerProfile, { name: 'customer' })
  getCustomer(@Args('id') id: string): Promise<CustomerProfile> {
    return this.customersService.findById(id);
  }

  @Mutation(() => CustomerProfile)
  @UseGuards(JwtAuthGuard)
  updateCustomer(
    @Args('id') id: string,
    @Args('input') input: UpdateCustomerInput,
  ): Promise<CustomerProfile> {
    return this.customersService.updateCustomer(id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Args('id') id: string,
    @Args('input') input: ChangePasswordInput,
  ): Promise<boolean> {
    return this.customersService.changePassword(id, input);
  }
}
