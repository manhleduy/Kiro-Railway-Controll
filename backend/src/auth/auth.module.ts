import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MailService } from './mail.service';

@Module({
  providers: [AuthResolver, AuthService, JwtStrategy, MailService],
  exports: [AuthService],
})
export class AuthModule {}
