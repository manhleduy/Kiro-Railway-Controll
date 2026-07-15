import { gql } from './graphql.service';
import type { Shift } from '@/types';

const SHIFT_FIELDS = `
  shiftId
  staffId
  startTime
  endTime
`;

export async function getShifts(staffId: string): Promise<Shift[]> {
  return gql<{ shifts: Shift[] }>(
    `query Shifts($staffId: String!) {
       shifts(staffId: $staffId) {
         ${SHIFT_FIELDS}
       }
     }`,
    { staffId },
  ).then((d) => d.shifts);
}

export async function createShift(
  staffId: string,
  startTime: string,
  endTime: string,
): Promise<Shift> {
  return gql<{ createShift: Shift }>(
    `mutation CreateShift($staffId: String!, $startTime: String!, $endTime: String!) {
       createShift(input: { staffId: $staffId, startTime: $startTime, endTime: $endTime }) {
         ${SHIFT_FIELDS}
       }
     }`,
    { staffId, startTime, endTime },
  ).then((d) => d.createShift);
}

export async function deleteShift(shiftId: number): Promise<boolean> {
  return gql<{ deleteShift: boolean }>(
    `mutation DeleteShift($shiftId: Int!) {
       deleteShift(shiftId: $shiftId)
     }`,
    { shiftId },
  ).then((d) => d.deleteShift);
}
