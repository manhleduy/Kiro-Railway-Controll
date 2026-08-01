import { gql } from './graphql.service';

// ─── Message model ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  /** When present the bubble renders a confirmation card instead of plain text */
  workflow?: WorkflowPayload;
}

// ─── Workflow response shapes ─────────────────────────────────────────────────

export type WorkflowKind = 'station' | 'makeorder';

/**
 * AWAITING_CONFIRMATION — bot found a candidate, waiting for yes/no
 * COMPLETED             — workflow finished (confirmed or cancelled)
 */
export type WorkflowStatus = 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';

export interface StationCandidate {
  stationId: string;
  name: string;
  location: string;
}

export interface MakeOrderCandidate {
  location?: string;
  ticketCount?: number;
  itemOrEventName?: string;
}

export interface WorkflowPayload {
  kind: WorkflowKind;
  status: WorkflowStatus;
  /** Human-readable message from the bot */
  message: string;
  /** Raw details for the confirmation card */
  station?: StationCandidate;
  orderDetails?: MakeOrderCandidate;
  /** Set when workflow finishes successfully */
  confirmedStation?: StationCandidate;
  orderId?: string;
  success?: boolean;
}

// ─── Plain chatBot mutation ───────────────────────────────────────────────────

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

// ─── Station workflow ─────────────────────────────────────────────────────────

export async function stationSearch(
  userId: string,
  userQuery: string,
): Promise<ChatMessage> {
  const raw = await gql<{ stationSearch: string }>(
    `mutation StationSearch($query: SearchInput!) {
       stationSearch(query: $query)
     }`,
    { query: { userId, userQuery } },
  ).then((d) => d.stationSearch);

  const parsed = JSON.parse(raw) as {
    status: string;
    confirmationMessage?: string;
    candidateStation?: StationCandidate;
    message?: string;
  };

  const payload: WorkflowPayload = {
    kind: 'station',
    status: parsed.status === 'AWAITING_CONFIRMATION' ? 'AWAITING_CONFIRMATION' : 'COMPLETED',
    message: parsed.confirmationMessage ?? parsed.message ?? '',
    station: parsed.candidateStation,
  };

  return {
    id: `bot-${Date.now()}`,
    role: 'bot',
    text: payload.message,
    timestamp: new Date(),
    workflow: payload,
  };
}

export async function stationConfirm(
  userId: string,
  userReply: string,
): Promise<ChatMessage> {
  const raw = await gql<{ stationConfirm: string }>(
    `mutation StationConfirm($query: ReplyInput!) {
       stationConfirm(query: $query)
     }`,
    { query: { userId, userReply } },
  ).then((d) => d.stationConfirm);

  const parsed = JSON.parse(raw) as {
    status?: string;
    stationId?: string;
    name?: string;
    location?: string;
    confirmed?: boolean;
    message?: string;
  };

  const confirmed = parsed.confirmed === true;
  const payload: WorkflowPayload = {
    kind: 'station',
    status: confirmed ? 'COMPLETED' : 'CANCELLED',
    message: confirmed
      ? `Great! Navigating you to ${parsed.name} (${parsed.location}).`
      : (parsed.message ?? 'Station selection cancelled. Try again anytime.'),
    confirmedStation: confirmed
      ? { stationId: parsed.stationId!, name: parsed.name!, location: parsed.location! }
      : undefined,
    success: confirmed,
  };

  return {
    id: `bot-${Date.now()}`,
    role: 'bot',
    text: payload.message,
    timestamp: new Date(),
    workflow: payload,
  };
}

// ─── Make-order workflow ──────────────────────────────────────────────────────

export async function makeOrderSearch(
  userId: string,
  userQuery: string,
): Promise<ChatMessage> {
  const raw = await gql<{ parseAndPrepareMakeOrder: string }>(
    `mutation ParseAndPrepareMakeOrder($query: SearchInput!) {
       parseAndPrepareMakeOrder(query: $query)
     }`,
    { query: { userId, userQuery } },
  ).then((d) => d.parseAndPrepareMakeOrder);

  const parsed = JSON.parse(raw) as {
    status: string;
    message?: string;
    details?: MakeOrderCandidate;
    result?: { success: boolean; reason?: string };
  };

  if (parsed.status === 'AWAITING_CONFIRMATION') {
    const payload: WorkflowPayload = {
      kind: 'makeorder',
      status: 'AWAITING_CONFIRMATION',
      message: parsed.message ?? 'Please confirm your order details below.',
      orderDetails: parsed.details,
    };
    return {
      id: `bot-${Date.now()}`,
      role: 'bot',
      text: payload.message,
      timestamp: new Date(),
      workflow: payload,
    };
  }

  // Completed early (missing info, etc.)
  const payload: WorkflowPayload = {
    kind: 'makeorder',
    status: 'COMPLETED',
    message: parsed.result?.reason ?? 'Could not parse order details. Please try again.',
    success: parsed.result?.success ?? false,
  };
  return {
    id: `bot-${Date.now()}`,
    role: 'bot',
    text: payload.message,
    timestamp: new Date(),
    workflow: payload,
  };
}

export async function makeOrderConfirm(
  userId: string,
  userReply: string,
): Promise<ChatMessage> {
  const raw = await gql<{ confirmMakeOrder: string }>(
    `mutation ConfirmMakeOrder($query: ReplyInput!) {
       confirmMakeOrder(query: $query)
     }`,
    { query: { userId, userReply } },
  ).then((d) => d.confirmMakeOrder);

  const parsed = JSON.parse(raw) as {
    status: string;
    result?: { success: boolean; orderId?: string; reason?: string };
  };

  const success = parsed.result?.success === true;
  const payload: WorkflowPayload = {
    kind: 'makeorder',
    status: 'COMPLETED',
    success,
    orderId: parsed.result?.orderId,
    message: success
      ? `Order confirmed! Your booking reference is ${parsed.result?.orderId ?? 'N/A'}.`
      : (parsed.result?.reason ?? 'Order cancelled.'),
  };

  return {
    id: `bot-${Date.now()}`,
    role: 'bot',
    text: payload.message,
    timestamp: new Date(),
    workflow: payload,
  };
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

export const GREETING: ChatMessage = {
  id: 'bot-greeting',
  role: 'bot',
  text: "Hi there! 👋 I'm your Vaprise Railway assistant.\n\nI can help you with:\n- **General questions** — just type anything\n- **Find a station** — type `/station <destination>` (e.g. `/station Hanoi`)\n- **Book a trip** — type `/makeorder <details>` (e.g. `/makeorder 2 tickets to Hanoi`)",
  timestamp: new Date(),
};
