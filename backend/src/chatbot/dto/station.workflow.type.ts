import { z } from 'zod';
import { workflowEvent } from '@llamaindex/workflow-core';

export interface Station {
  stationId: string | number;
  name: string;
  location: string;
}

export const StationResultSchema = z.object({
  stationId: z.union([z.string(), z.number()]),
  name: z.string(),
  location: z.string(),
  confirmed: z.boolean(),
});

export type StationResult = z.infer<typeof StationResultSchema>;

// Events
export const StartLookupEvent = workflowEvent<{ userQuery: string; stations: Station[] }>();
export const AwaitConfirmationEvent = workflowEvent<{ candidateStation: Station; question: string }>();
export const UserResponseEvent = workflowEvent<{ userConfirmed: boolean }>();
export const FinalResultEvent = workflowEvent<StationResult>();