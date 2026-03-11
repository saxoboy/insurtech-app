'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { quoteSchema, type QuoteFormData } from '@/lib/schemas/quote-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface CatalogItem {
  code: string;
  name: string;
}

export function QuoteForm() {
  const router = useRouter();
  const [insuranceTypes, setInsuranceTypes] = useState<CatalogItem[]>([]);
  const [coverages, setCoverages] = useState<CatalogItem[]>([]);
  const [locations, setLocations] = useState<CatalogItem[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [loadingCoverages, setLoadingCoverages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      insuranceType: '',
      coverage: '',
      location: '',
      age: undefined as unknown as number,
    },
  });

  const selectedInsuranceType = watch('insuranceType');

  // Cargar catálogos iniciales en paralelo (vercel best practice: async-parallel)
  useEffect(() => {
    Promise.all([
      api.get<{ items: CatalogItem[] }>('/catalogs/insurance-types'),
      api.get<{ items: CatalogItem[] }>('/catalogs/locations'),
    ])
      .then(([typesRes, locationsRes]) => {
        setInsuranceTypes(typesRes.items);
        setLocations(locationsRes.items);
      })
      .catch(() => setError('Error al cargar catálogos'))
      .finally(() => setLoadingCatalogs(false));
  }, []);

  // Cargar coberturas al cambiar tipo de seguro
  useEffect(() => {
    if (!selectedInsuranceType) {
      setCoverages([]);
      return;
    }

    setLoadingCoverages(true);
    setValue('coverage', '');
    api
      .get<{ items: CatalogItem[] }>(
        `/catalogs/coverages?insuranceType=${selectedInsuranceType}`,
      )
      .then((res) => setCoverages(res.items))
      .catch(() => setCoverages([]))
      .finally(() => setLoadingCoverages(false));
  }, [selectedInsuranceType, setValue]);

  const onSubmit = async (data: QuoteFormData) => {
    setError(null);
    setSubmitting(true);
    try {
      const quote = await api.post<{ id: string }>('/quotes', data);
      router.push(`/quote/${quote.id}`);
    } catch (err: unknown) {
      const apiError = err as Record<string, unknown>;
      const detail = apiError?.detail;
      const message = Array.isArray(detail)
        ? detail[0]
        : typeof detail === 'string'
          ? detail
          : 'Error al crear cotización';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Nueva cotización</CardTitle>
          <CardDescription>
            Completa los datos para obtener tu prima estimada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tipo de seguro */}
            <div className="grid gap-2">
              <Label htmlFor="insuranceType">Tipo de seguro</Label>
              {loadingCatalogs ? (
                <Skeleton className="h-9 w-full rounded-4xl" />
              ) : (
                <Controller
                  name="insuranceType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(val) => field.onChange(val ?? '')}
                    >
                      <SelectTrigger
                        id="insuranceType"
                        className="w-full"
                        aria-invalid={!!errors.insuranceType}
                      >
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceTypes.map((t) => (
                          <SelectItem key={t.code} value={t.code}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.insuranceType && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.insuranceType.message}
                </p>
              )}
            </div>

            {/* Cobertura */}
            <div className="grid gap-2">
              <Label htmlFor="coverage">Cobertura</Label>
              {loadingCoverages ? (
                <Skeleton className="h-9 w-full rounded-4xl" />
              ) : (
                <Controller
                  name="coverage"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(val) => field.onChange(val ?? '')}
                      disabled={!selectedInsuranceType}
                    >
                      <SelectTrigger
                        id="coverage"
                        className="w-full"
                        aria-invalid={!!errors.coverage}
                      >
                        <SelectValue
                          placeholder={
                            selectedInsuranceType
                              ? 'Seleccionar...'
                              : 'Primero selecciona un tipo'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {coverages.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.coverage && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.coverage.message}
                </p>
              )}
            </div>

            {/* Edad */}
            <div className="grid gap-2">
              <Label htmlFor="age">Edad</Label>
              <Controller
                name="age"
                control={control}
                render={({ field }) => (
                  <Input
                    id="age"
                    type="number"
                    inputMode="numeric"
                    min={18}
                    max={100}
                    placeholder="18 - 100"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : Number(val));
                    }}
                    aria-invalid={!!errors.age}
                  />
                )}
              />
              {errors.age && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.age.message}
                </p>
              )}
            </div>

            {/* Ubicación */}
            <div className="grid gap-2">
              <Label htmlFor="location">Ubicación</Label>
              {loadingCatalogs ? (
                <Skeleton className="h-9 w-full rounded-4xl" />
              ) : (
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(val) => field.onChange(val ?? '')}
                    >
                      <SelectTrigger
                        id="location"
                        className="w-full"
                        aria-invalid={!!errors.location}
                      >
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.code} value={l.code}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.location && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.location.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting ? 'Calculando...' : 'Cotizar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
