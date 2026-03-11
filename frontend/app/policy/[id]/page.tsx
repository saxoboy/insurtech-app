import { PolicyDetail } from '@/components/policy-detail';

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PolicyDetail id={id} />;
}
