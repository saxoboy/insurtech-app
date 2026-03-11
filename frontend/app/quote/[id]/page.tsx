'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface QuoteResult {
  id: string;
  status: string;
  inputs: {
    insuranceType: string;
    coverage: string;
    location: string;
    age: number;
  };
  estimatedPremium: number;
  breakdown: { concept: string; amount: number }[];
  createdAt: string;
}

export default function QuoteResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    api
      .get<QuoteResult>(`/quotes/${id}`)
      .then(setQuote)
      .catch(() => setError('No se pudo cargar la cotización'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleIssuePolicy = async () => {
    setIssuing(true);
    setError(null);
    try {
      const policy = await api.post<{ id: string }>('/policies', {
        quoteId: id,
      });
      router.push(`/policy/${policy.id}`);
    } catch (err: unknown) {
      const apiError = err as Record<string, unknown>;
      const detail = apiError?.detail;
      const message = Array.isArray(detail)
        ? detail[0]
        : typeof detail === 'string'
          ? detail
          : 'Error al emitir póliza';
      setError(message);
    } finally {
      setIssuing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-lg">
        <AlertDescription>
          {error ?? 'Cotización no encontrada'}
        </AlertDescription>
      </Alert>
    );
  }

  const isIssued = quote.status === 'ISSUED';

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resultado de cotización</CardTitle>
            <Badge variant={isIssued ? 'secondary' : 'default'}>
              {isIssued ? 'Emitida' : 'Cotizada'}
            </Badge>
          </div>
          <CardDescription>
            {new Date(quote.createdAt).toLocaleDateString('es-EC', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Datos del seguro */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Tipo de seguro</p>
              <p className="font-medium">{quote.inputs.insuranceType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cobertura</p>
              <p className="font-medium">{quote.inputs.coverage}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Edad</p>
              <p className="font-medium">{quote.inputs.age} años</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ubicación</p>
              <p className="font-medium">{quote.inputs.location}</p>
            </div>
          </div>

          <Separator />

          {/* Desglose */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Desglose de prima
            </h3>
            <div className="space-y-1.5">
              {quote.breakdown.map((item) => (
                <div
                  key={item.concept}
                  className="flex justify-between text-sm"
                >
                  <span>{item.concept}</span>
                  <span className="font-mono">${item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Prima estimada</span>
            <span className="text-2xl font-bold tabular-nums">
              ${quote.estimatedPremium.toFixed(2)}
            </span>
          </div>

          {/* Acciones */}
          {isIssued ? (
            <p className="text-center text-sm text-muted-foreground">
              Esta cotización ya tiene una póliza emitida.
            </p>
          ) : isAuthenticated ? (
            <Dialog>
              <DialogTrigger
                render={<Button className="w-full" disabled={issuing} />}
              >
                {issuing ? 'Emitiendo...' : 'Emitir póliza'}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar emisión de póliza</DialogTitle>
                  <DialogDescription>
                    Se emitirá una póliza por{' '}
                    <strong>${quote.estimatedPremium.toFixed(2)}</strong>. Esta
                    acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Cancelar
                  </DialogClose>
                  <Button onClick={handleIssuePolicy} disabled={issuing}>
                    {issuing ? 'Emitiendo...' : 'Confirmar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                Inicia sesión para emitir tu póliza
              </p>
              <Link
                href="/login"
                className={buttonVariants({ variant: 'outline' })}
              >
                Iniciar sesión
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
