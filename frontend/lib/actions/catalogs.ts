import { api } from '@/lib/api';

export interface CatalogItem {
  code: string;
  name: string;
}

interface CatalogListResponse {
  items: CatalogItem[];
}

export async function getInsuranceTypes() {
  return api.get<CatalogListResponse>('/catalogs/insurance-types');
}

export async function getLocations() {
  return api.get<CatalogListResponse>('/catalogs/locations');
}

export async function getCoverages(insuranceType: string) {
  return api.get<CatalogListResponse>(
    `/catalogs/coverages?insuranceType=${insuranceType}`,
  );
}
