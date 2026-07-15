import { gql } from './graphql.service';
import type { Station } from '@/types';

const STATION_FIELDS = `
  stationId
  name
  location
  nextStations {
    stationId
    name
    location
  }
`;

export async function getStations(): Promise<Station[]> {
  return gql<{ stations: Station[] }>(
    `query Stations {
       stations {
         ${STATION_FIELDS}
       }
     }`,
  ).then((d) => d.stations);
}

export async function createStation(
  stationId: string,
  name: string,
  location: string,
  nextStationIds?: string[],
): Promise<Station> {
  return gql<{ createStation: Station }>(
    `mutation CreateStation($stationId: String!, $name: String!, $location: String!, $nextStationIds: [String!]) {
       createStation(input: { stationId: $stationId, name: $name, location: $location, nextStationIds: $nextStationIds }) {
         ${STATION_FIELDS}
       }
     }`,
    { stationId, name, location, nextStationIds },
  ).then((d) => d.createStation);
}

export async function updateStation(
  stationId: string,
  name?: string,
  location?: string,
  nextStationIds?: string[],
): Promise<Station> {
  return gql<{ updateStation: Station }>(
    `mutation UpdateStation($stationId: String!, $name: String, $location: String, $nextStationIds: [String!]) {
       updateStation(stationId: $stationId, input: { name: $name, location: $location, nextStationIds: $nextStationIds }) {
         ${STATION_FIELDS}
       }
     }`,
    { stationId, name, location, nextStationIds },
  ).then((d) => d.updateStation);
}

export async function deleteStation(stationId: string): Promise<boolean> {
  return gql<{ deleteStation: boolean }>(
    `mutation DeleteStation($stationId: String!) {
       deleteStation(stationId: $stationId)
     }`,
    { stationId },
  ).then((d) => d.deleteStation);
}
