'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quoteSchema, type QuoteFormData } from '@/lib/schemas/quote-schema';
import {
  getInsuranceTypes,
  getLocations,
  getCoverages,
  type CatalogItem,
} from '@/lib/actions/catalogs';
import { createQuote } from '@/lib/actions/quotes';
import { BENEFITS } from '@/lib/premium-calculator';
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
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck,
  Info,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const TYPE_NAMES: Record<string, string> = {
  AUTO: 'Seguro de Auto',
  SALUD: 'Seguro de Salud',
  HOGAR: 'Seguro de Hogar',
};

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
  const selectedCoverage = watch('coverage');
  const selectedAge = watch('age');
  const selectedLocation = watch('location');

  const benefits = BENEFITS[selectedInsuranceType] ?? [];

  // Cuántos campos están completos (para indicador de progreso)
  const filledFields = [
    selectedInsuranceType,
    selectedCoverage,
    selectedAge,
    selectedLocation,
  ].filter(Boolean).length;

  // Nombres legibles para el resumen
  const insuranceTypeName =
    insuranceTypes.find((t) => t.code === selectedInsuranceType)?.name ??
    TYPE_NAMES[selectedInsuranceType];
  const coverageName = coverages.find(
    (c) => c.code === selectedCoverage,
  )?.name;
  const locationName = locations.find(
    (l) => l.code === selectedLocation,
  )?.name;

  // Cargar catálogos iniciales en paralelo
  useEffect(() => {
    Promise.all([getInsuranceTypes(), getLocations()])
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
    getCoverages(selectedInsuranceType)
      .then((res) => setCoverages(res.items))
      .catch(() => setCoverages([]))
      .finally(() => setLoadingCoverages(false));
  }, [selectedInsuranceType, setValue]);

  const onSubmit = async (data: QuoteFormData) => {
    setError(null);
    setSubmitting(true);
    try {
      const quote = await createQuote(data);
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
    <div className="w-full min-h-screen bg-[#f8f9fb] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Solicitar Cotización
          </h1>
          <p className="text-slate-500 mt-2">
            Configura tu cobertura y obtén una respuesta inmediata.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 2-column layout — mobile: resumen primero, form después */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT: Formulario (order-2 en mobile, order-1 en desktop) */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <form
                  id="quote-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Row 1: Tipo + Cobertura */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tipo de seguro */}
                    <div className="space-y-2">
                      <Label htmlFor="insuranceType">Tipo de seguro</Label>
                      {loadingCatalogs ? (
                        <Skeleton className="h-9 w-full rounded-lg" />
                      ) : (
                        <Controller
                          name="insuranceType"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ?? undefined}
                              onValueChange={(val) =>
                                field.onChange(val ?? '')
                              }
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
                    <div className="space-y-2">
                      <Label htmlFor="coverage">Cobertura</Label>
                      {loadingCoverages ? (
                        <Skeleton className="h-9 w-full rounded-lg" />
                      ) : (
                        <Controller
                          name="coverage"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ?? undefined}
                              onValueChange={(val) =>
                                field.onChange(val ?? '')
                              }
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
                  </div>

                  {/* Row 2: Edad + Ubicación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Edad */}
                    <div className="space-y-2">
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
                              field.onChange(
                                val === '' ? undefined : Number(val),
                              );
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
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      {loadingCatalogs ? (
                        <Skeleton className="h-9 w-full rounded-lg" />
                      ) : (
                        <Controller
                          name="location"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ?? undefined}
                              onValueChange={(val) =>
                                field.onChange(val ?? '')
                              }
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
                  </div>
                  {/* Progress + Submit */}
                  <div className="pt-2 space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                        <span>Progreso</span>
                        <span>{filledFields} de 4 campos</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-[#409cf0] h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${(filledFields / 4) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#409cf0] hover:bg-blue-500"
                    >
                      {submitting ? (
                        'Cotizando...'
                      ) : (
                        <>
                          Cotizar Ahora
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
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

            {/* Tip box */}
            <Card className="border-0 shadow-sm rounded-2xl bg-blue-50/60">
              <CardContent className="p-5 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#409cf0] shrink-0 mt-0.5" />
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">
                    ¿Sabías que?{' '}
                  </span>
                  Al contratar tu seguro de forma anual puedes ahorrar hasta un
                  15% en tu prima total. Consulta con nuestros asesores para más
                  información.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Resumen de selección (order-1 en mobile, order-2 en desktop) */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="sticky top-6 space-y-4">
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                {/* Header azul */}
                <div className="bg-[#409cf0] p-5 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Tu Cotización</h3>
                  </div>
                  <p className="text-blue-100 text-sm">
                    Resumen de tu selección
                  </p>
                </div>

                <CardContent className="p-5">
                  {filledFields > 0 ? (
                    <>
                      <div className="space-y-3 mb-4">
                        {insuranceTypeName && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">
                              Tipo de seguro
                            </span>
                            <span className="font-medium text-slate-700">
                              {insuranceTypeName}
                            </span>
                          </div>
                        )}
                        {coverageName && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Cobertura</span>
                            <span className="font-medium text-slate-700">
                              {coverageName}
                            </span>
                          </div>
                        )}
                        {selectedAge != null && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Edad</span>
                            <span className="font-medium text-slate-700">
                              {selectedAge} años
                            </span>
                          </div>
                        )}
                        {locationName && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Ubicación</span>
                            <span className="font-medium text-slate-700">
                              {locationName}
                            </span>
                          </div>
                        )}
                      </div>

                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">
                        Completa el formulario para solicitar tu cotización.
                      </p>
                    </div>
                  )}

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
