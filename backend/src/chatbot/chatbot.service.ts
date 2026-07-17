import {Ollama, OllamaEmbedding} from "@llamaindex/ollama";
import { Injectable } from "@nestjs/common";
import { Settings } from "llamaindex";
import {MarkdownReader} from "@llamaindex/readers/markdown";
import {
    VectorStoreIndex,
    Metadata,
    Document, 
    SentenceSplitter, 
    MarkdownNodeParser,
    PromptTemplate,
    TreeSummarizePrompt} from "llamaindex";
import { Bm25Retriever } from "@llamaindex/bm25-retriever";
import {Logger} from "@nestjs/common";
@Injectable()
export class ChatBotService{
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
    async chatBot(query: string){
        const reader = new MarkdownReader();
        const documents = await reader.loadData(this.FILE_PATH);

        console.log("Create embeddings...")
        const index = await VectorStoreIndex.fromDocuments(documents);

        const queryEngine = index.asQueryEngine();
        const response = await queryEngine.query({query: query});
        return response.toString();
    }
    
}

