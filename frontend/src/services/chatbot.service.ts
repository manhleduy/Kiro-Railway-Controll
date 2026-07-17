import { gql } from './graphql.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export async function sendMessage(text: string): Promise<ChatMessage> {
  const reply = await gql<{ chatBot: string }>(
    `mutation ChatBot($query: String!) {
       chatBot(query: $query)
     }`,
    { query: text },
  ).then((d) => d.chatBot);

  return {
    id: `bot-${Date.now()}`,
    role: 'bot',
    text: reply,
    timestamp: new Date(),
  };
}

export const GREETING: ChatMessage = {
  id: 'bot-greeting',
  role: 'bot',
  text: "Hi there! 👋 I'm your Vaprise Railway assistant. Ask me anything about how to use this platform.",
  timestamp: new Date(),
};
