import { gql } from './graphql.service';
import type { SeatClass } from '@/types';

const SEAT_CLASS_FIELDS = `
  seatClassId
  name
  price
`;

export async function getSeatClasses(): Promise<SeatClass[]> {
  return gql<{ seatClasses: SeatClass[] }>(
    `query SeatClasses {
       seatClasses {
         ${SEAT_CLASS_FIELDS}
       }
     }`,
  ).then((d) => d.seatClasses);
}

export async function createSeatClass(
  name: string,
  price: number,
): Promise<SeatClass> {
  return gql<{ createSeatClass: SeatClass }>(
    `mutation CreateSeatClass($name: String!, $price: Float!) {
       createSeatClass(input: { name: $name, price: $price }) {
         ${SEAT_CLASS_FIELDS}
       }
     }`,
    { name, price },
  ).then((d) => d.createSeatClass);
}

export async function updateSeatClass(
  seatClassId: number,
  name?: string,
  price?: number,
): Promise<SeatClass> {
  return gql<{ updateSeatClass: SeatClass }>(
    `mutation UpdateSeatClass($seatClassId: Int!, $name: String, $price: Float) {
       updateSeatClass(seatClassId: $seatClassId, input: { name: $name, price: $price }) {
         ${SEAT_CLASS_FIELDS}
       }
     }`,
    { seatClassId, name, price },
  ).then((d) => d.updateSeatClass);
}
