'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface PolicyResult {
  id: string;
  quoteId: string;
  status: string;
  issuedAt: string;
}

export function PolicyDetail({ id }: { id: string }) {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [policy, setPolicy] = useState<PolicyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    api
      .get<PolicyResult>(`/policies/${id}`)
      .then(setPolicy)
      .catch(() => setError('No se pudo cargar la póliza'))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!policy) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-lg">
        <AlertDescription>{error ?? 'Póliza no encontrada'}</AlertDescription>
      </Alert>
    );
  }

  const statusConfig: Record<
    string,
    {
      label: string;
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
  > = {
    ACTIVE: { label: 'Activa', variant: 'default' },
    CANCELLED: { label: 'Cancelada', variant: 'destructive' },
    PENDING: { label: 'Pendiente', variant: 'outline' },
    EXPIRED: { label: 'Expirada', variant: 'secondary' },
    SUSPENDED: { label: 'Suspendida', variant: 'secondary' },
  };

  const { label: statusLabel, variant: statusVariant } = statusConfig[
    policy.status
  ] ?? { label: policy.status, variant: 'secondary' as const };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Póliza emitida</CardTitle>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <CardDescription>
            Emitida el{' '}
            {new Date(policy.issuedAt).toLocaleDateString('es-EC', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">ID de póliza</p>
              <p className="font-mono text-xs font-medium">{policy.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ID de cotización</p>
              <p className="font-mono text-xs font-medium">{policy.quoteId}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/quote/${policy.quoteId}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Ver cotización
            </Link>
            <Link
              href="/quote"
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              Nueva cotización
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
