import { Mutation, Resolver } from '@nestjs/graphql';
import {ChatBotService} from './chatbot.service';
import {Args} from '@nestjs/graphql';

@Resolver(()=>String)
export class ChatBotResolver{
    constructor(private readonly chatBotService: ChatBotService){}

    @Mutation(()=> String)
    async chatBot(@Args('query') query: string): Promise<string>{
        return await this.chatBotService.chatBot(query);
    }

}