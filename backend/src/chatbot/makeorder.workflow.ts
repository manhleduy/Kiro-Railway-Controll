import { createWorkflow } from "@llamaindex/workflow-core";
import { createStatefulMiddleware } from "@llamaindex/workflow-core/middleware/state";
import { Ollama } from "@llamaindex/ollama";
import { 
  StartMakeOrderEvent, 
  InputRequiredEvent, 
  HumanResponseEvent, 
  MakeOrderCompletedEvent, 
  MakeOrderDetails, 
  MakeOrderDetailsSchema 
} from "./dto/makeorder.workflow.type";

// Define the mutable internal state of the workflow
interface OrderWorkflowState {
  userId: string;
  details: MakeOrderDetails;
}

const { withState } = createStatefulMiddleware<OrderWorkflowState>(() => ({
  userId: "",
  details: {},
}));

export function createOrderBookingWorkflow() {
  const workflow = withState(createWorkflow());

  // STEP 1: Extract Structured Data using LLM
  workflow.handle([StartMakeOrderEvent], async (context, event) => {
    const { sendEvent, state } = context;
    state.userId = event.data.userId;

    const llm = new Ollama({ model: "llama3.2" });

    // Use LLM Structured Output to reliably extract fields

    const response = await llm.complete({
      prompt: `Extract order booking details from this text: "${event.data.query}". 
               Extract location, 
               ticketCount(total number of ticket user want), 
               and itemOrEventName if present
               your answer is a json object with  the format like this without no additional words:
                {

                  "location": {location}
                  "ticketCount": {ticketCount},
                  "itemOrEventName": {itemOrEventName},
                }
            `,
    });
    console.log(response)
    
    // Parse extracted JSON into state
    try {
      const extracted = MakeOrderDetailsSchema.parse(JSON.parse(response.text));
      state.details = { ...extracted, userId: state.userId };
    } catch {
      // Fallback fallback handling if parsing fails
    }

    // Check if critical fields are missing
    console.log(state.details)
    if (!state.details.location || !state.details.ticketCount) {
      sendEvent(
        MakeOrderCompletedEvent.with({
          success: false,
          reason: "Missing location or number of tickets in the prompt.",
        })
      );
      return;
    }

    // Prompt user for explicit approval
    const summary = `Confirm booking of ${state.details.ticketCount} ticket(s) for ${state.details.itemOrEventName ?? "Event"} at ${state.details.location}?`;

    sendEvent(
      InputRequiredEvent.with({
        summary,
        extractedDetails: state.details,
      })
    );
  });

  // STEP 2: Process Human Approval Response
  workflow.handle([HumanResponseEvent], async (context, event) => {
    const { sendEvent, state } = context;

    if (!event.data.approved) {
      sendEvent(
        MakeOrderCompletedEvent.with({
          success: false,
          reason: "User cancelled the order.",
        })
      );
      return;
    }

    // Execute database transactional write or external booking API call
    const simulatedOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    sendEvent(
      MakeOrderCompletedEvent.with({
        success: true,
        orderId: simulatedOrderId,
      })
    );
  });

  return workflow;
}