import type { Order } from '@/types';

export interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

const SET_ORDERS = 'orders/setOrders';
const SET_ORDERS_LOADING = 'orders/setLoading';
const SET_ORDERS_ERROR = 'orders/setError';

export const setOrders = (orders: Order[]) => ({
  type: SET_ORDERS as typeof SET_ORDERS,
  payload: orders,
});

export const setOrdersLoading = (loading: boolean) => ({
  type: SET_ORDERS_LOADING as typeof SET_ORDERS_LOADING,
  payload: loading,
});

export const setOrdersError = (error: string | null) => ({
  type: SET_ORDERS_ERROR as typeof SET_ORDERS_ERROR,
  payload: error,
});

type OrdersAction =
  | ReturnType<typeof setOrders>
  | ReturnType<typeof setOrdersLoading>
  | ReturnType<typeof setOrdersError>;

const initialState: OrdersState = {
  orders: [],
  loading: false,
  error: null,
};

export function ordersReducer(
  state: OrdersState = initialState,
  action: OrdersAction,
): OrdersState {
  switch (action.type) {
    case SET_ORDERS:
      return { ...state, orders: action.payload };
    case SET_ORDERS_LOADING:
      return { ...state, loading: action.payload };
    case SET_ORDERS_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
