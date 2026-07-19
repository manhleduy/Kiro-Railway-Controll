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
import { ChatBotQuery } from "./chatbot.query";

@Injectable()
export class ChatBotService{
  constructor(private readonly prisma: PrismaService,
    private readonly subQuery: ChatBotQuery
  ){}

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
            const queryForTarget = await  this.subQuery.findStationQuery(query);          
            const response2 = (await queryEngine.query({query: queryForTarget}));
            

            return response2.toString();
            
          
        }else if(trimmed.toLowerCase().startsWith('/makeorder')){
          const subQuery = await this.subQuery.makeOrderQuery(query);
          const response2 = (await queryEngine.query({query: subQuery}));
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

