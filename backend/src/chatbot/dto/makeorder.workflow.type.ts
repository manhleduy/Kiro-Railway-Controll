import { workflowEvent } from "@llamaindex/workflow-core";
import { z } from "zod";

// Zod schema for LLM Structured Extraction
export const MakeOrderDetailsSchema = z.object({
  userId: z.string().optional(),
  location: z.string().optional(),
  ticketCount: z.number().optional(),
  itemOrEventName: z.string().optional(),
});

export type MakeOrderDetails = z.infer<typeof MakeOrderDetailsSchema>;

// Workflow Events
export const StartMakeOrderEvent = workflowEvent<{ query: string; userId: string }>();

// Event emitted when AI needs human confirmation
export const InputRequiredEvent = workflowEvent<{
  summary: string;
  extractedDetails: MakeOrderDetails;
}>();

// Event sent into the workflow when user responds
export const HumanResponseEvent = workflowEvent<{ approved: boolean }>();

export const MakeOrderCompletedEvent = workflowEvent<{
  success: boolean;
  orderId?: string;
  reason?: string;
}>();