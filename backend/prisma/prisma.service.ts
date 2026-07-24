import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient}  from '@prisma/client';

@Injectable()
export class PrismaService 
  extends PrismaClient 
  implements OnModuleInit, OnModuleDestroy {
  constructor(){
    const url = process.env["ENVIRONMENT"] ==='production'? 
    process.env["DATABASE_URL"]: 
    "postgresql://postgres:lem%4019072006@localhost:5432/railwaycontroll?schema=public"
    const adapter = new PrismaPg({
      connectionString:  url
    
    });
    super({adapter});
    
      
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}