import { api } from '@/lib/api';

export interface Policy {
  id: string;
  quoteId: string;
  status: string;
  issuedAt: string;
  quote?: {
    insuranceTypeCode: string;
    coverageCode: string;
    estimatedPremium: string;
  };
}

interface PolicyListResponse {
  items: Policy[];
}

export async function getPolicies() {
  return api.get<PolicyListResponse>('/policies');
}

export async function getPolicy(id: string) {
  return api.get<Policy>(`/policies/${id}`);
}

export async function issuePolicy(quoteId: string) {
  return api.post<{ id: string }>('/policies', { quoteId });
}
