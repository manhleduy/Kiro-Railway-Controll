import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const user: JwtPayload | undefined = ctx.getContext().req?.user;

    if (!user || user.role !== 'staff') {
      throw new ForbiddenException('Access restricted to staff members');
    }

    return true;
  }
}
