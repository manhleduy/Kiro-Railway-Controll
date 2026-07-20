import { Injectable, Logger } from '@nestjs/common';
import { Ollama } from '@llamaindex/ollama';
import { Station,
    StationResult
 } from './dto/station.workflow.type';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class StationWorkflowService{
  private readonly logger = new Logger(StationWorkflowService.name);
  private llm: Ollama;

  // Temporary state store to keep track of active user confirmation sessions
  private activeSessions = new Map<string, { candidateStation: Station; stations: Station[] }>();

  constructor(private readonly prisma:PrismaService) {
    // 1. Instantiate local Ollama model
    this.llm = new Ollama({
      model: 'llama3.2',
      config: { host: 'http://localhost:11434' },
      options: {
        temperature: 0.1, // Keep temperature near 0 for strict database lookup precision
      },
    });
  }

  /**
   * TURN 1: User says "I want to go to Vancouver"
   * Local Ollama model extracts the location & matches it to the station DB.
   */
  async processInitialQuery(userId: string, userQuery: string) {
    const dbStations = await this.prisma.station.findMany();
    this.logger.log(`[Turn 1 - Ollama] Processing query: "${userQuery}"`);

    // Structured Prompt for Llama 3.2
    const prompt = `
        You are a precise transit assistant matching user requests to official station entries.

        User Query: "${userQuery}"

        Available Stations Database List:
        ${JSON.stringify(dbStations, null, 2)}

        INSTRUCTIONS:
        1. Identify the station location or name the user wants to go to.
        2. Select the single best matching station from the provided list.
        3. Return ONLY a valid raw JSON object matching this exact format without markdown or extra commentary:
        {
        "stationId": "<stationId from list>",
        "name": "<name from list>",
        "location": "<location from list>"
        }
        `;

    // Execute completion through local Ollama instance
    const response = await this.llm.complete({ prompt });
    
    // Extract JSON block even if model wraps it in markdown code fences
    const jsonMatch = response.text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to parse station candidate from Ollama output: ${response.text}`);
    }

    const candidateStation: Station = JSON.parse(jsonMatch[0]);

    // Save session context for Turn 2 confirmation
    this.activeSessions.set(userId, { candidateStation, stations: dbStations });

    return {
      status: 'AWAITING_CONFIRMATION',
      userId,
      confirmationMessage: `Did you mean ${candidateStation.name} located in ${candidateStation.location}?`,
      candidateStation,
    };
  }

  /**
   * TURN 2: User responds ("Yes" or "No")
   */
  async processUserConfirmation(userId: string, userReply: string): Promise<StationResult | { status: string; message: string }> {
    const session = this.activeSessions.get(userId);
    if (!session) {
      throw new Error('Session expired or not found.');
    }

    this.logger.log(`[Turn 2 - Ollama] Received user reply: "${userReply}"`);

    // Evaluate user intent (Affirmative vs Negative)
    const isAffirmative = /yes|yeah|sure|correct|exactly|yep|right|ok|okay/.test(userReply);
    console.log(isAffirmative)

    if (isAffirmative) {
      this.activeSessions.delete(userId);

      // Return the final confirmed JSON matching your original format
      return {
        stationId: session.candidateStation.stationId,
        name: session.candidateStation.name,
        location: session.candidateStation.location,
        confirmed: true,
      };
    } else {
      this.activeSessions.delete(userId);
      return {
        status: 'CANCELLED',
        message: 'Station selection rejected. Please specify your destination again.',
      };
    }
  }
}