import type { Metadata } from 'next';
import { QuoteForm } from '@/components/quote-form';

export const metadata: Metadata = {
  title: 'Nueva cotización - Insurtech',
};

export default function QuotePage() {
  return <QuoteForm />;
}
