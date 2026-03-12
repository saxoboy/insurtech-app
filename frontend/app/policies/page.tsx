import type { Metadata } from 'next';
import { PoliciesList } from '@/components/policies-list';

export const metadata: Metadata = {
  title: 'Mis pólizas - Insurtech',
};

export default function PoliciesPage() {
  return <PoliciesList />;
}
