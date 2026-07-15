import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Extract the request from the GraphQL context instead of HTTP context
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  // JWT is stateless — skip Passport's session logIn() call
  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}
