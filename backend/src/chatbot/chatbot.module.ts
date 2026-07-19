import { Module } from '@nestjs/common';

import { ChatBotResolver } from './chatbot.resolver';
import { ChatBotService } from './chatbot.service';
import { ChatBotQuery } from './chatbot.query';
@Module({
  providers: [ChatBotResolver, ChatBotService, ChatBotQuery],
})
export class ChatBotModule {}
