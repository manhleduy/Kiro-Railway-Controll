import { gql } from './graphql.service';
import type { Feedback } from '@/types';

const FEEDBACK_FIELDS = `
  feedbackId
  customerId
  content
  createdAt
`;

export async function getFeedbacks(customerId: string): Promise<Feedback[]> {
  return gql<{ feedbacks: Feedback[] }>(
    `query Feedbacks($customerId: String!) {
       feedbacks(customerId: $customerId) {
         ${FEEDBACK_FIELDS}
       }
     }`,
    { customerId },
  ).then((d) => d.feedbacks);
}

export async function createFeedback(
  customerId: string,
  content: string,
): Promise<Feedback> {
  return gql<{ createFeedback: Feedback }>(
    `mutation CreateFeedback($customerId: String!, $content: String!) {
       createFeedback(customerId: $customerId, content: $content) {
         ${FEEDBACK_FIELDS}
       }
     }`,
    { customerId, content },
  ).then((d) => d.createFeedback);
}
