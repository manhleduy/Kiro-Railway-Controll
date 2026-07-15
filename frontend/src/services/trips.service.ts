import { gql } from './graphql.service';
import type { Trip } from '@/types';

const TRIP_FIELDS = `
  tripId
  track
  arrivalDate
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

export async function getTrips(track?: string): Promise<Trip[]> {
  return gql<{ trips: Trip[] }>(
    `query Trips($track: String) {
       trips(track: $track) {
         ${TRIP_FIELDS}
       }
     }`,
    track ? { track } : {},
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
): Promise<Trip> {
  return gql<{ createTrip: Trip }>(
    `mutation CreateTrip($track: String!, $arrivalDate: String!) {
       createTrip(input: { track: $track, arrivalDate: $arrivalDate }) {
         ${TRIP_FIELDS}
       }
     }`,
    { track, arrivalDate },
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
