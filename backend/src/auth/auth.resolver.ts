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
    @Args('customerId') customerId: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    return this.authService.loginCustomer(customerId, email, password);
  }

  @Mutation(() => AuthPayload)
  loginStaff(
    @Args('staffId') staffId: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    return this.authService.loginStaff(staffId, email, password);
  }

  /** Sends a 6-digit OTP to the given email address */
  @Mutation(() => Boolean)
  requestPasswordReset(@Args('email') email: string): Promise<boolean> {
    return this.authService.requestPasswordReset(email);
  }

  /** Verifies the OTP and sets the new password */
  @Mutation(() => Boolean)
  resetPassword(
    @Args('email') email: string,
    @Args('otp') otp: string,
    @Args('newPassword') newPassword: string,
  ): Promise<boolean> {
    return this.authService.resetPassword(email, otp, newPassword);
  }
}
