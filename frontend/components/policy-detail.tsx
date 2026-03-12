'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { BENEFITS } from '@/lib/premium-calculator';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileDown,
  Calendar,
  Car,
  HeartPulse,
  Home,
  MapPin,
  User,
  Shield,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PolicyResult {
  id: string;
  quoteId: string;
  status: string;
  issuedAt: string;
}

interface QuoteResult {
  id: string;
  inputs: {
    insuranceType: string;
    coverage: string;
    location: string;
    age: number;
  };
  estimatedPremium: number;
  breakdown: { concept: string; amount: number }[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  AUTO: Car,
  SALUD: HeartPulse,
  HOGAR: Home,
};

const TYPE_NAMES: Record<string, string> = {
  AUTO: 'Seguro de Auto',
  SALUD: 'Seguro de Salud',
  HOGAR: 'Seguro de Hogar',
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Activa',
    className: 'text-emerald-600 bg-emerald-50',
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'text-red-600 bg-red-50',
  },
  PENDING: {
    label: 'Pendiente',
    className: 'text-amber-600 bg-amber-50',
  },
  EXPIRED: {
    label: 'Expirada',
    className: 'text-slate-600 bg-slate-100',
  },
  SUSPENDED: {
    label: 'Suspendida',
    className: 'text-orange-600 bg-orange-50',
  },
};

export function PolicyDetail({ id }: { id: string }) {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [policy, setPolicy] = useState<PolicyResult | null>(null);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    api
      .get<PolicyResult>(`/policies/${id}`)
      .then((policyData) => {
        setPolicy(policyData);
        // Fetch associated quote for full details
        return api
          .get<QuoteResult>(`/quotes/${policyData.quoteId}`)
          .then(setQuote)
          .catch(() => {
            // Quote fetch is optional — policy still shows
          });
      })
      .catch(() => setError('No se pudo cargar la póliza'))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-[#f8f9fb] py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Skeleton className="h-52 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="w-full min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-0 shadow-sm rounded-2xl p-8">
          <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Póliza no encontrada
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            {error ?? 'No pudimos encontrar esta póliza.'}
          </p>
          <Link
            href="/quote"
            className={buttonVariants({
              className: 'bg-[#409cf0] hover:bg-blue-500',
            })}
          >
            Nueva cotización
          </Link>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[policy.status] ?? {
    label: policy.status,
    className: 'text-slate-600 bg-slate-100',
  };

  const typeCode = quote?.inputs.insuranceType ?? '';
  const TypeIcon = TYPE_ICONS[typeCode] || ShieldCheck;
  const benefits = BENEFITS[typeCode] ?? [];

  return (
    <div className="w-full min-h-screen bg-[#f8f9fb] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Póliza Emitida
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Emitida el{' '}
            {new Date(policy.issuedAt).toLocaleDateString('es-EC', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT: Detalles de la póliza */}
          <div className="lg:col-span-3 space-y-6">
            {/* Info principal */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      {quote ? (
                        <TypeIcon className="w-5 h-5" />
                      ) : (
                        <ShieldCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">
                        {TYPE_NAMES[typeCode] || 'Póliza de seguro'}
                      </h3>
                      <span className="text-xs text-slate-400">
                        ID: {policy.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {quote ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Cobertura
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800">
                        {quote.inputs.coverage}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Edad
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800">
                        {quote.inputs.age} años
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Ubicación
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800">
                        {quote.inputs.location}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Hash className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Cotización
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-xs font-mono">
                        {policy.quoteId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Hash className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          ID de póliza
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-xs font-mono break-all">
                        {policy.id}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Hash className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Cotización
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-xs font-mono break-all">
                        {policy.quoteId}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Beneficios Incluidos */}
            {benefits.length > 0 && (
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-800 mb-4">
                    Beneficios Incluidos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: Resumen financiero */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                {/* Header verde */}
                <div className="bg-emerald-600 p-5 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Póliza Activa</h3>
                  </div>
                  <p className="text-emerald-100 text-sm">
                    Tu seguro está vigente
                  </p>
                </div>

                <CardContent className="p-5">
                  {quote ? (
                    <>
                      {/* Breakdown */}
                      <div className="space-y-3 mb-4">
                        {quote.breakdown.map((item) => (
                          <div
                            key={item.concept}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-slate-500">
                              {item.concept}
                            </span>
                            <span className="font-medium text-slate-700">
                              ${item.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      {/* Total */}
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-800">
                          Prima Mensual
                        </span>
                        <span className="text-2xl font-bold text-emerald-600">
                          ${quote.estimatedPremium.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 text-right mb-6">
                        MONEDA: USD
                      </p>
                    </>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-slate-500">
                        Póliza emitida correctamente
                      </p>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="space-y-3">
                    <Link
                      href={`/quote/${policy.quoteId}`}
                      className={buttonVariants({
                        variant: 'outline',
                        className: 'w-full',
                      })}
                    >
                      Ver cotización
                    </Link>

                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="w-full"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>

                    <Link
                      href="/quote"
                      className={buttonVariants({
                        variant: 'ghost',
                        className: 'w-full',
                      })}
                    >
                      Nueva cotización
                    </Link>
                  </div>

                  {/* Payment badges */}
                  <div className="flex items-center justify-center gap-3 mt-5">
                    {['VISA', 'MC', 'AMEX'].map((badge) => (
                      <span
                        key={badge}
                        className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-2 py-1 tracking-wider"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pago seguro */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Pago seguro procesado por LibelulaSoft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
