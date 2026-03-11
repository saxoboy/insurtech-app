'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (formData: RegisterFormData) => {
    setSubmitting(true);
    setErrorText(null);

    try {
      const data = await api.post<{ accessToken: string }>('/auth/register', formData);

      localStorage.setItem('accessToken', data.accessToken);
      useAuthStore.getState().hydrate();

      router.push('/policies');
    } catch (err: unknown) {
      const apiError = err as Record<string, unknown>;
      const detail = apiError?.detail;
      const message = Array.isArray(detail)
        ? detail[0]
        : typeof detail === 'string'
          ? detail
          : 'Error al registrar la cuenta';
      setErrorText(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#f8f9fb] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-[#409cf0]" />
          </div>
        </div>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-2xl font-bold">Crea tu cuenta</CardTitle>
            <CardDescription className="text-base mt-2">
              Ingresa tus datos para empezar
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errorText && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200 text-red-800"
                >
                  <AlertDescription>{errorText}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Ej. Juan Pérez"
                  className="h-11 bg-slate-50 border-slate-200"
                  {...register('name')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  autoComplete="email"
                  className="h-11 bg-slate-50 border-slate-200"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="h-11 bg-slate-50 border-slate-200"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#409cf0] hover:bg-blue-500 font-semibold text-base"
                disabled={submitting}
              >
                {submitting ? 'Registrando...' : 'Registrarse'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                href="/login"
                className="text-[#409cf0] hover:underline font-semibold"
              >
                Inicia sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
