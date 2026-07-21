import { Mutation, Resolver } from '@nestjs/graphql';
import {ChatBotService} from './chatbot.service';
import {Args} from '@nestjs/graphql';
import { StationWorkflowService } from './station.workflow.service';
import { SearchInput } from './dto/search.input';
import { ReplyInput } from './dto/reply.input';
import { MakeOrderWorkFlowService } from './makeorder.workflow.service';

@Resolver(()=>String)
export class ChatBotResolver{
    constructor(
        private readonly chatBotService: ChatBotService,
        private readonly stationWorkFlowService: StationWorkflowService,
        private readonly makeorderWorkFlowService: MakeOrderWorkFlowService
    ){}

    @Mutation(()=> String)
    async chatBot(@Args('query') query: string): Promise<string>{
        return await this.chatBotService.chatBot(query);
    }
    @Mutation(()=>String)
    async stationSearch(@Args('query') query: SearchInput): Promise<string>{
    
        return JSON.stringify(await this.stationWorkFlowService.processInitialQuery(query.userId, query.userQuery));
    }

    @Mutation(()=>String)
    async stationConfirm(@Args('query') query: ReplyInput): Promise<string>{
        return JSON.stringify(await this.stationWorkFlowService.processUserConfirmation(query.userId, query.userReply))
    }

    @Mutation(()=>String)
    async parseAndPrepareMakeOrder(@Args('query') query: SearchInput): Promise<string>{
        

        return JSON.stringify(
        await this
        .makeorderWorkFlowService
        .startBookingProcess(query.userId, query.userQuery)
        )
    }
    @Mutation(()=>String)
    async confirmMakeOrder(@Args('query') query: ReplyInput): Promise<string>{
        return JSON.stringify(
            this
            .makeorderWorkFlowService
            .confirmBooking(query.userId, query.userReply)
        )
    }

}