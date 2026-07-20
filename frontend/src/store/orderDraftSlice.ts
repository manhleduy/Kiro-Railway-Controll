export interface OrderDraftTicket {
  id: string;
  tripId: number | null;
  seatId: number | null;
  passName: string;
  passCCCD: string;
}

export interface OrderDraftState {
  tickets: OrderDraftTicket[];
  methodId: string;
}

const ADD_ORDER_TICKET = 'orderDraft/addTicket';
const UPDATE_ORDER_TICKET = 'orderDraft/updateTicket';
const REMOVE_ORDER_TICKET = 'orderDraft/removeTicket';
const SET_ORDER_METHOD_ID = 'orderDraft/setMethodId';
const REPLACE_ORDER_DRAFT = 'orderDraft/replaceDraft';
const RESET_ORDER_DRAFT = 'orderDraft/resetDraft';

function createTicket(overrides: Partial<OrderDraftTicket> = {}): OrderDraftTicket {
  return {
    id: overrides.id ?? createTicketId(),
    tripId: overrides.tripId ?? null,
    seatId: overrides.seatId ?? null,
    passName: overrides.passName ?? '',
    passCCCD: overrides.passCCCD ?? '',
  };
}

function createInitialState(): OrderDraftState {
  return {
    tickets: [createTicket()],
    methodId: '',
  };
}

function createTicketId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const addOrderTicket = (ticket?: Partial<OrderDraftTicket>) => ({
  type: ADD_ORDER_TICKET as typeof ADD_ORDER_TICKET,
  payload: ticket,
});

export const updateOrderTicket = (
  ticketId: string,
  updates: Partial<Omit<OrderDraftTicket, 'id'>>,
) => ({
  type: UPDATE_ORDER_TICKET as typeof UPDATE_ORDER_TICKET,
  payload: { ticketId, updates },
});

export const removeOrderTicket = (ticketId: string) => ({
  type: REMOVE_ORDER_TICKET as typeof REMOVE_ORDER_TICKET,
  payload: ticketId,
});

export const setOrderMethodId = (methodId: string) => ({
  type: SET_ORDER_METHOD_ID as typeof SET_ORDER_METHOD_ID,
  payload: methodId,
});

export const replaceOrderDraft = (draft: Partial<OrderDraftState>) => ({
  type: REPLACE_ORDER_DRAFT as typeof REPLACE_ORDER_DRAFT,
  payload: draft,
});

export const resetOrderDraft = () => ({
  type: RESET_ORDER_DRAFT as typeof RESET_ORDER_DRAFT,
});

type OrderDraftAction =
  | ReturnType<typeof addOrderTicket>
  | ReturnType<typeof updateOrderTicket>
  | ReturnType<typeof removeOrderTicket>
  | ReturnType<typeof setOrderMethodId>
  | ReturnType<typeof replaceOrderDraft>
  | ReturnType<typeof resetOrderDraft>;

const initialState: OrderDraftState = createInitialState();

export function orderDraftReducer(
  state: OrderDraftState = initialState,
  action: OrderDraftAction,
): OrderDraftState {
  switch (action.type) {
    case ADD_ORDER_TICKET:
      return {
        ...state,
        tickets: [...state.tickets, createTicket(action.payload)],
      };
    case UPDATE_ORDER_TICKET:
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === action.payload.ticketId
            ? { ...ticket, ...action.payload.updates }
            : ticket,
        ),
      };
    case REMOVE_ORDER_TICKET:
      return {
        ...state,
        tickets: state.tickets.filter((ticket) => ticket.id !== action.payload),
      };
    case SET_ORDER_METHOD_ID:
      return {
        ...state,
        methodId: action.payload,
      };
    case REPLACE_ORDER_DRAFT:
      return {
        tickets:
          action.payload.tickets?.map((ticket) => createTicket(ticket)) ??
          state.tickets,
        methodId: action.payload.methodId ?? state.methodId,
      };
    case RESET_ORDER_DRAFT:
      return createInitialState();
    default:
      return state;
  }
}

export function createEmptyOrderDraft(): OrderDraftState {
  return createInitialState();
}

