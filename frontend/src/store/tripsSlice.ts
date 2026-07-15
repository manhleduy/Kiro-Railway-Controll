import type { Trip } from '@/types';

export interface TripsState {
  trips: Trip[];
  selectedTrip: Trip | null;
  loading: boolean;
  error: string | null;
}

const SET_TRIPS = 'trips/setTrips';
const SET_SELECTED_TRIP = 'trips/setSelectedTrip';
const SET_TRIPS_LOADING = 'trips/setLoading';
const SET_TRIPS_ERROR = 'trips/setError';

export const setTrips = (trips: Trip[]) => ({
  type: SET_TRIPS as typeof SET_TRIPS,
  payload: trips,
});

export const setSelectedTrip = (trip: Trip | null) => ({
  type: SET_SELECTED_TRIP as typeof SET_SELECTED_TRIP,
  payload: trip,
});

export const setTripsLoading = (loading: boolean) => ({
  type: SET_TRIPS_LOADING as typeof SET_TRIPS_LOADING,
  payload: loading,
});

export const setTripsError = (error: string | null) => ({
  type: SET_TRIPS_ERROR as typeof SET_TRIPS_ERROR,
  payload: error,
});

type TripsAction =
  | ReturnType<typeof setTrips>
  | ReturnType<typeof setSelectedTrip>
  | ReturnType<typeof setTripsLoading>
  | ReturnType<typeof setTripsError>;

const initialState: TripsState = {
  trips: [],
  selectedTrip: null,
  loading: false,
  error: null,
};

export function tripsReducer(
  state: TripsState = initialState,
  action: TripsAction,
): TripsState {
  switch (action.type) {
    case SET_TRIPS:
      return { ...state, trips: action.payload };
    case SET_SELECTED_TRIP:
      return { ...state, selectedTrip: action.payload };
    case SET_TRIPS_LOADING:
      return { ...state, loading: action.payload };
    case SET_TRIPS_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
