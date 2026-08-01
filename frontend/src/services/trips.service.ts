import { gql } from './graphql.service';
import type { Trip } from '@/types';

const TRIP_FIELDS = `
  tripId
  track
  arrivalDate
  stationId
  station {
    stationId
    name
    location
  }
  route {
    routeId
    tripId
    travelTime
  }
  seats {
    seatId
    status
    seatClass {
      seatClassId
      name
      price
    }
  }
`;

export async function getTrips(stationName?: string, track?: string): Promise<Trip[]> {
  return gql<{ trips: Trip[] }>(
    `query Trips($stationName: String, $track: String) {
       trips(stationName: $stationName, track: $track) {
         ${TRIP_FIELDS}
       }
     }`,
    { stationName: stationName ?? null, track: track ?? null },
  ).then((d) => d.trips);
}

export async function getTrip(tripId: number): Promise<Trip> {
  return gql<{ trip: Trip }>(
    `query Trip($id: Int!) {
       trip(id: $id) {
         ${TRIP_FIELDS}
       }
     }`,
    { id: tripId },
  ).then((d) => d.trip);
}

export async function createTrip(
  track: string,
  arrivalDate: string,
  stationId?: string,
  travelTime?: number,
): Promise<Trip> {
  return gql<{ createTrip: Trip }>(
    `mutation CreateTrip($track: String!, $arrivalDate: String!, $stationId: String, $travelTime: Int) {
       createTrip(input: {
         track: $track,
         arrivalDate: $arrivalDate,
         stationId: $stationId,
         travelTime: $travelTime
       }) {
         ${TRIP_FIELDS}
       }
     }`,
    { track, arrivalDate, stationId: stationId ?? null, travelTime: travelTime ?? null },
  ).then((d) => d.createTrip);
}

export async function deleteTrip(tripId: number): Promise<boolean> {
  return gql<{ deleteTrip: boolean }>(
    `mutation DeleteTrip($id: Int!) {
       deleteTrip(id: $id)
     }`,
    { id: tripId },
  ).then((d) => d.deleteTrip);
}
