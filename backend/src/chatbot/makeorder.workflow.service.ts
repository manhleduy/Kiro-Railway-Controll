import { Injectable, NotFoundException } from '@nestjs/common';
import { createOrderBookingWorkflow } from './makeorder.workflow';
import {
  StartMakeOrderEvent,
  InputRequiredEvent,
  HumanResponseEvent,
  MakeOrderCompletedEvent,
} from './dto/makeorder.workflow.type';

@Injectable()
export class MakeOrderWorkFlowService {
  // Store active workflow contexts mapped to user IDs
  private activeSessions = new Map<string, any>();

  /**
   * STEP 1: Parse user prompt, extract details, and pause for approval
   */
  async startBookingProcess(userId: string, query: string) {
    const workflow = createOrderBookingWorkflow();
    const context = workflow.createContext();

    // Store active workflow context to resume later
    this.activeSessions.set(userId, context);

    // Send initial trigger event
    context.sendEvent(StartMakeOrderEvent.with({ userId, query }));

    // Listen to the async event stream
    for await (const event of context.stream) {
      // 1. If workflow requires human confirmation
      if (InputRequiredEvent.include(event)) {
        return {
          status: 'AWAITING_CONFIRMATION',
          message: event.data.summary,
          details: event.data.extractedDetails,
        };
      }

      // 2. If workflow completed early (e.g. missing info)
      if (MakeOrderCompletedEvent.include(event)) {
        this.activeSessions.delete(userId);
        return {
          status: 'COMPLETED',
          result: event.data,
        };
      }
    }

    throw new Error('Workflow ended unexpectedly without emitting a result event.');
  }

  /**
   * STEP 2: Resume workflow with human approval answer
   */
  async confirmBooking(userId: string, userReply: string) {
    const context = this.activeSessions.get(userId);
    if (!context) {
      throw new NotFoundException('No pending order workflow found for this user.');
    }

    const approved = /yes|yeah|sure|correct|exactly|yep|right|ok|okay/.test(userReply);
    // Send user response event into the running workflow stream
    context.sendEvent(HumanResponseEvent.with({ approved }));

    // Read remaining events until final output
    for await (const event of context.stream) {
      if (MakeOrderCompletedEvent.include(event)) {
        this.activeSessions.delete(userId);
        return {
          status: 'COMPLETED',
          result: event.data,
        };
      }
    }

    throw new Error('Workflow ended unexpectedly during confirmation.');
  }
}