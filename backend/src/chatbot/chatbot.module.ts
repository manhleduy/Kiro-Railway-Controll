import { Module } from '@nestjs/common';

import { ChatBotResolver } from './chatbot.resolver';
import { ChatBotService } from './chatbot.service';
@Module({
  providers: [ChatBotResolver, ChatBotService],
})
export class ChatBotModule {}
