import axios from 'axios';
import { store } from '@/store';

const baseURL = import.meta.env['ENVIRONMENT']==='production' ?
 (import.meta.env['VITE_API_URL'] as string | undefined)  ?? 'http://localhost:8088':
 'http://localhost:3000'
 
const client = axios.create({
  baseURL:baseURL,
});

client.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
  
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { data } = await client.post<{
    data: T;
    errors?: { message: string }[];
  }>('/graphql', { query, variables });
  if (data.errors?.length) {
  
    throw new Error(data.errors[0].message);
  }
  return data.data;
}
