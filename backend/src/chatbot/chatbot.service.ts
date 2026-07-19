import {Ollama, OllamaEmbedding} from "@llamaindex/ollama";
import { Injectable } from "@nestjs/common";
import { EngineResponse, Settings } from "llamaindex";
import {MarkdownReader} from "@llamaindex/readers/markdown";
import {
    VectorStoreIndex,
    Document, 
    SentenceSplitter, 
    MarkdownNodeParser,
    PromptTemplate,
    TreeSummarizePrompt,
    FaithfulnessEvaluator,
    RelevancyEvaluator
} from "llamaindex";
import { Bm25Retriever } from "@llamaindex/bm25-retriever";
import {Logger} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Graph } from "./chatbot.graph";

@Injectable()
export class ChatBotService{
  constructor(private readonly prisma: PrismaService){}

    onModuleInit() {
    try {
      // Configure global LlamaIndex settings
      Settings.llm = new Ollama({
        model: 'llama3.2'
      });

      Settings.embedModel = new OllamaEmbedding({
        model: 'mxbai-embed-large'
      });

      console.log('✅ LlamaIndex settings configured successfully.');
    } catch (error) {
      console.error('❌ Failed to configure LlamaIndex settings:', error);
    }
  }
    private readonly FILE_PATH= './src/chatbot/DOCUMENT.md';
    private readonly CURR_STATION= 'VN1000';
    async chatBot(query: string){
        const trimmed = query.trim();

    
        //create nodes
        const reader = new MarkdownReader();
        const documents = await reader.loadData(this.FILE_PATH);
        const markdownParser = new MarkdownNodeParser()
        const nodes = markdownParser.getNodesFromDocuments(documents);

        console.log("Create embeddings...")
        const index = await VectorStoreIndex.fromDocuments(nodes);
        
        const queryEngine = index.asQueryEngine();
        if (trimmed.toLowerCase().startsWith('/station')) {
            const station =await this.prisma.station.findMany()
            

            const queryForTarget = `
            your are an AI agent which can help our customer,
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
            
            //initialize the graph to find the shortest path
            const graph = new Graph();
            const edge = await this.prisma.stationConnection.findMany();
            const response = (await queryEngine.query({query: queryForTarget}));
            const target = JSON.parse(response.toString());
            

            station.map((e)=>{
              graph.addVertex(e.stationId);
            })

            edge.map((e)=>{
              graph.addEdge(e.startStationId, e.endStationId)
            })
            const result = graph.shortestPath(this.CURR_STATION, target.stationId)
            
            const queryForRoute = `
              your are an AI agent which can help our customer,
              you can help user is answer these question
              " I'am in the station with id ${this.CURR_STATION} 
              and i want to go to the station with the name ${target.name}"

              provided that the result on finding the route is here(path is the sequence list of station)
              {
                "reachable": ${result.reachable},
                "path" : ${result.path.join("->")}
              }
              based on this station list:
              ${station.map((element)=>`
                {
                  stationId: ${element.stationId},
                  name: ${element.name},
                  location: ${element.location}
                }
              `)}

              answer the user with these for
            `
            
            const response2 = (await queryEngine.query({query: queryForRoute}));
            

            return response2.toString();
            
          
        }
        const response = await queryEngine.query({query: query});
        //const response = await retriever.retrieve({query: query})
        
        this.evaluation(query,response);
        return response.toString();
    }
  
    private async evaluation(query: string, response: EngineResponse) {
      

        // 3. Instantiate LlamaIndex Evaluators
        const faithfulness = new FaithfulnessEvaluator();
        const relevancy = new RelevancyEvaluator();


        // 5. Run Faithfulness Evaluation (Did it hallucinate?)
        const faithResult = await faithfulness.evaluateResponse({
            query: query,
            response:response,
        });

        // 6. Run Relevancy Evaluation (Did it actually answer the prompt?)
        const relResult = await relevancy.evaluateResponse({
            query: query,
            response: response,
        });

        // 7. Output the Benchmark Scores
        console.log("📊 --- RAG SYSTEM EVALUATION RESULTS ---");
        console.log(`Faithfulness (No Hallucination): ${faithResult.passing ? "✅ PASS" : "❌ FAIL"}`);
        console.log(`Feedback: ${faithResult.feedback}`);
        
        console.log(`\nRelevancy (Answered Question):  ${relResult.passing ? "✅ PASS" : "❌ FAIL"}`);
        console.log(`Feedback: ${relResult.feedback}`);
    }
    
    
}

