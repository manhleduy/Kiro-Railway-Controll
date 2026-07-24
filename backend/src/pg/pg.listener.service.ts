// src/realtime/pg-listener.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client } from 'pg';
import { SeatsGateway } from '../seats/seat.gateway';

@Injectable()
export class PgListenerService implements OnModuleInit, OnModuleDestroy {
  private pgClient: Client;
  

  constructor(private readonly seatingGateway: SeatsGateway) {
    this.pgClient = new Client()
  }

  async onModuleInit() {
    // 1. Initialize a standalone Postgres Client bypassing the Prisma pooler
    const url = process.env["ENVIRONMENT"] ==='production'? 
                process.env["DATABASE_URL"]: 
                'postgresql://postgres:lem%4019072006@localhost:5432/railwaycontroll?schema=public'

      
    console.log(url)
    this.pgClient = new Client({
      connectionString: url,
    });

    await this.connectAndListen();
  }

  private async connectAndListen() {
    try {
      await this.pgClient.connect();
      
      // 2. Instruct Postgres session to intercept the trigger channel updates
      await this.pgClient.query('LISTEN seat_status_update');
      console.log('✅ NestJS background service listening to Postgres [seat_updates]');

      // 3. Register the event handler mapping to our WebSocket gateway channel
      this.pgClient.on('notification', (msg) => {
        if (msg.channel === 'seat_status_update' && msg.payload) {
          const parsedData = JSON.parse(msg.payload);
          // Relay the event straight out to the active frontend clients
          this.seatingGateway.seatStatusUpdate(parsedData);
        }
      });
    } catch (error) {
      console.error('❌ Failed to establish PgListener connection, retrying in 5s...', error);
      setTimeout(() => this.connectAndListen(), 2000);
    }

    // Handle abrupt database dropouts gracefully
    this.pgClient.on('error', async (err) => {
      console.error('⚠️ Database listener link broken, re-establishing...', err);
      await this.connectAndListen();
    });
  }

  async onModuleDestroy() {
    // Disconnect the persistent node process socket loop safely during server shutdowns
    if (this.pgClient) {
      await this.pgClient.end();
    }
  }
}