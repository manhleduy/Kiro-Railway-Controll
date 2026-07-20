import { Module } from '@nestjs/common';

import { ChatBotResolver } from './chatbot.resolver';
import { ChatBotService } from './chatbot.service';
import { ChatBotQuery } from './chatbot.query';
import { StationWorkflowService } from './station.workflow.service';
@Module({
  providers: [ChatBotResolver, ChatBotService, ChatBotQuery, StationWorkflowService],
})
export class ChatBotModule {}
