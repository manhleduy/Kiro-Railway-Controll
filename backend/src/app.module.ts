import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { StaffModule } from './staff/staff.module';
import { TripsModule } from './trips/trips.module';
import { SeatsModule } from './seats/seats.module';
import { SeatClassesModule } from './seat-classes/seat-classes.module';
import { OrdersModule } from './orders/orders.module';
import { TicketsModule } from './tickets/tickets.module';
import { StationsModule } from './stations/stations.module';
import { ShiftsModule } from './shifts/shifts.module';
import { FeedbackModule } from './feedback/feedback.module';
import { MethodsModule } from './methods/methods.module';
import { ChatBotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    JwtModule.register({
      global: true,
      secret: process.env['JWT_SECRET'] ?? 'change_me_in_production',
      signOptions: {
        expiresIn: 7 * 24 * 3600, // seconds; override with JWT_EXPIRES_IN at runtime
      },
    }),
    AuthModule,
    CustomersModule,
    StaffModule,
    TripsModule,
    SeatsModule,
    SeatClassesModule,
    OrdersModule,
    TicketsModule,
    StationsModule,
    ShiftsModule,
    FeedbackModule,
    MethodsModule,
    ChatBotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
