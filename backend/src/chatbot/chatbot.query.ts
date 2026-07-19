import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ChatBotQuery{
    constructor(private readonly prisma: PrismaService){}

    async findStationQuery(query: string){
        const station =await this.prisma.station.findMany()
            
            
        return `
            you are an AI agent which can help our customer,
            you can help based on the user query which is 
            ${query} your have to determine the: 
            location: where customer going to come
            
            below is the station list:
            ${station.map((element)=>`
                {
                  stationId: ${element.stationId},
                  name: ${element.name},
                  location: ${element.location}
                }
              `)}

            only from this station list, anser the question
            "what station i am going to provide me the name and the stationId" 
            know that the location value of each station is the name of the city or province or village or the state  which that station is located
            your answer is a json object with  the format like this without no additional words:
            {
              "name": {name},
              "stationId": {stationId},
              "location": {location}
            }
            
            `
    }
    
    async makeOrderQuery(query: string){
        const methods = await this.prisma.method.findMany()

        return `
            you are an AI agent which can help our customer,
            you can help based on the user query which is 
            ${query} your have to determine the: 
            + customerId: 
            + method(find on the list
            ${
                methods.map((e)=>{
                    `{
                    methods: ${e.name}
                    description: ${e.description}
                    }`
                })
            }):

            
        `
    }
}