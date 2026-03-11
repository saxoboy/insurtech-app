'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  Calendar,
  FileText,
  ArrowRight,
  Home,
  Car,
  HeartPulse,
} from 'lucide-react';

interface Policy {
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
  ACTIVE: { label: 'Activa', className: 'text-emerald-600 bg-emerald-50' },
  CANCELLED: { label: 'Cancelada', className: 'text-red-600 bg-red-50' },
  EXPIRED: { label: 'Expirada', className: 'text-slate-600 bg-slate-100' },
  PENDING: { label: 'Pendiente', className: 'text-amber-600 bg-amber-50' },
};

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const emptySubscribe = () => () => {};

export function PoliciesList() {
  const { isAuthenticated } = useAuthStore();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;

    let isCancelled = false;

    api
      .get<{ items: Policy[] }>('/policies')
      .then((res) => {
        if (isCancelled) return;
        setPolicies(res.items || []);
        setError(null);
      })
      .catch(() => {
        if (isCancelled) return;
        setError(
          'No pudimos cargar tus pólizas. Por favor, intenta de nuevo.',
        );
      })
      .finally(() => {
        if (isCancelled) return;
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, mounted]);

  // Pantalla de carga mientras se monta el componente
  if (!mounted) {
    return (
      <div className="w-full min-h-[calc(100vh-5rem)] bg-[#f8f9fb] flex items-center justify-center p-4">
        <Skeleton className="h-64 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  // Estado No Autenticado
  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[calc(100vh-5rem)] bg-[#f8f9fb] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-lg border-0 rounded-2xl p-6">
          <ShieldCheck className="w-16 h-16 text-blue-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-slate-500 mb-6 font-medium">
            Debes iniciar sesión para poder ver o administrar tus pólizas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className={cn(buttonVariants(), 'bg-[#409cf0] hover:bg-blue-500')}
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/quote"
              className={buttonVariants({ variant: 'outline' })}
            >
              Cotizar Seguro
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f8f9fb] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Tus Pólizas
          </h1>
          <p className="text-slate-500 mt-2">
            Administra tus seguros contratados y consulta los detalles.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : policies.length === 0 ? (
          <Card className="text-center p-12 border-0 shadow-sm rounded-2xl">
            <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              No tienes pólizas activas
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Aún no has contratado ningún seguro con nosotros. Explora nuestras
              opciones y obtén una cotización inmediata.
            </p>
            <Link
              href="/quote"
              className={cn(buttonVariants(), 'bg-[#409cf0] hover:bg-blue-500')}
            >
              Cotizar ahora
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((policy) => {
              const typeCode = policy.quote?.insuranceTypeCode || 'AUTO';
              const Icon = TYPE_ICONS[typeCode] || FileText;

              const statusConfig = STATUS_CONFIG[policy.status] || {
                label: policy.status,
                className: 'text-slate-600 bg-slate-100'
              };

              return (
                <Card
                  key={policy.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden group flex flex-col"
                >
                  <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#409cf0]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 leading-tight">
                          {TYPE_NAMES[typeCode] || typeCode}
                        </h4>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-5 bg-slate-50/50 flex-1 flex flex-col">
                    <div className="space-y-3 mb-5 flex-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Emisión
                        </span>
                        <span className="font-semibold text-slate-700">
                          {formatDate(policy.issuedAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Cobertura</span>
                        <span className="font-semibold text-slate-700 capitalize">
                          {policy.quote?.coverageCode?.toLowerCase() || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Prima</span>
                        <span className="font-semibold text-[#409cf0]">
                          ${policy.quote?.estimatedPremium || '0.00'}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/policy/${policy.id}`}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'w-full border-slate-200 text-slate-600 hover:text-[#409cf0] hover:border-[#409cf0] hover:bg-blue-50 group-hover:bg-[#409cf0] group-hover:text-white group-hover:border-[#409cf0] transition-all',
                      )}
                    >
                      Ver Detalles <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
