'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { BENEFITS } from '@/lib/premium-calculator';
import { getQuote, type QuoteResult } from '@/lib/actions/quotes';
import { issuePolicy } from '@/lib/actions/policies';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileDown,
  ArrowRight,
  Calendar,
  Car,
  HeartPulse,
  Home,
  MapPin,
  User,
  Shield,
} from 'lucide-react';

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
  QUOTED: {
    label: 'Cotizada',
    className: 'text-[#409cf0] bg-blue-50',
  },
  ISSUED: {
    label: 'Emitida',
    className: 'text-emerald-600 bg-emerald-50',
  },
  EXPIRED: {
    label: 'Expirada',
    className: 'text-slate-600 bg-slate-100',
  },
};

export function QuoteDetail({ id }: { id: string }) {
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
    getQuote(id)
      .then(setQuote)
      .catch(() => setError('No se pudo cargar la cotización'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleIssuePolicy = async () => {
    setIssuing(true);
    setError(null);
    try {
      const policy = await issuePolicy(id);
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
      <div className="w-full min-h-screen bg-[#f8f9fb] py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Skeleton className="h-52 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="w-full min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-0 shadow-sm rounded-2xl p-8">
          <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Cotización no encontrada
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            {error ?? 'No pudimos encontrar esta cotización.'}
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

  const isIssued = quote.status === 'ISSUED';
  const typeCode = quote.inputs.insuranceType;
  const TypeIcon = TYPE_ICONS[typeCode] || ShieldCheck;
  const benefits = BENEFITS[typeCode] ?? [];
  const statusConfig = STATUS_CONFIG[quote.status] ?? {
    label: quote.status,
    className: 'text-slate-600 bg-slate-100',
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f9fb] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Resultado de Cotización
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(quote.createdAt).toLocaleDateString('es-EC', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
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
          {/* LEFT: Detalles */}
          <div className="lg:col-span-3 space-y-6">
            {/* Datos del seguro */}
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-[#409cf0]">
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">
                        {TYPE_NAMES[typeCode] || typeCode}
                      </h3>
                      <span className="text-xs text-slate-400">
                        ID: {quote.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${statusConfig.className}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

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
                  <div className="bg-slate-50 rounded-xl p-4 col-span-2">
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
                </div>
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

          {/* RIGHT: Resumen de Prima */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-4">
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                {/* Header azul */}
                <div className="bg-[#409cf0] p-5 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Resumen de Prima</h3>
                  </div>
                  <p className="text-blue-100 text-sm">
                    {isIssued
                      ? 'Póliza emitida exitosamente'
                      : 'Cotización válida por 48 horas'}
                  </p>
                </div>

                <CardContent className="p-5">
                  {/* Breakdown */}
                  <div className="space-y-3 mb-4">
                    {quote.breakdown.map((item) => (
                      <div
                        key={item.concept}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-slate-500">{item.concept}</span>
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
                      Total Mensual
                    </span>
                    <span className="text-2xl font-bold text-[#409cf0]">
                      ${quote.estimatedPremium.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 text-right mb-6">
                    MONEDA: USD
                  </p>

                  {/* Acciones */}
                  <div className="space-y-3">
                    {isIssued ? (
                      <p className="text-center text-sm text-slate-500 py-2">
                        Esta cotización ya tiene una póliza emitida.
                      </p>
                    ) : isAuthenticated ? (
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button
                              className="w-full bg-[#409cf0] hover:bg-blue-500"
                              disabled={issuing}
                            />
                          }
                        >
                          {issuing ? (
                            'Emitiendo...'
                          ) : (
                            <>
                              Emitir Póliza
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Confirmar emisión de póliza
                            </DialogTitle>
                            <DialogDescription>
                              Se emitirá una póliza por{' '}
                              <strong>
                                ${quote.estimatedPremium.toFixed(2)}
                              </strong>
                              . Esta acción no se puede deshacer.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose
                              render={<Button variant="outline" />}
                            >
                              Cancelar
                            </DialogClose>
                            <Button
                              onClick={handleIssuePolicy}
                              disabled={issuing}
                              className="bg-[#409cf0] hover:bg-blue-500"
                            >
                              {issuing ? 'Emitiendo...' : 'Confirmar'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="text-center space-y-3">
                        <p className="text-sm text-slate-500">
                          Inicia sesión para emitir tu póliza
                        </p>
                        <Link
                          href="/login"
                          className={buttonVariants({
                            className:
                              'w-full bg-[#409cf0] hover:bg-blue-500',
                          })}
                        >
                          Iniciar sesión
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="w-full"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
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
