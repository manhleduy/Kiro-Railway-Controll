import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth-payload.type';
import { RegisterCustomerInput } from './dto/register-customer.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  registerCustomer(
    @Args('input') input: RegisterCustomerInput,
  ): Promise<AuthPayload> {
    return this.authService.registerCustomer(input);
    
  }

  @Mutation(() => AuthPayload)
  loginCustomer(
    @Args("customerId") customerId: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    return this.authService.loginCustomer(customerId,email, password);
  }

  @Mutation(() => AuthPayload)
  loginStaff(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    return this.authService.loginStaff(email, password);
  }
}
