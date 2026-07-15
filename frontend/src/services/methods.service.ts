import { gql } from './graphql.service';
import type { Method } from '@/types';

export async function getMethods(): Promise<Method[]> {
  return gql<{ methods: Method[] }>(
    `query Methods {
       methods {
         methodId
         name
         description
       }
     }`,
  ).then((d) => d.methods);
}
