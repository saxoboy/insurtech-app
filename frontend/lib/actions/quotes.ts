import { api } from '@/lib/api';

export interface QuoteInputs {
  insuranceType: string;
  coverage: string;
  location: string;
  age: number;
}

export interface QuoteResult {
  id: string;
  status: string;
  inputs: QuoteInputs;
  estimatedPremium: number;
  breakdown: { concept: string; amount: number }[];
  createdAt: string;
}

interface CreateQuotePayload {
  insuranceType: string;
  coverage: string;
  location: string;
  age: number;
}

export async function createQuote(payload: CreateQuotePayload) {
  return api.post<{ id: string }>('/quotes', payload);
}

export async function getQuote(id: string) {
  return api.get<QuoteResult>(`/quotes/${id}`);
}
