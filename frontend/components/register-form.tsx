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
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import {
  Asterisk,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserRound,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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
      const data = await api.post<{ accessToken: string }>(
        '/auth/register',
        formData,
      );

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
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
            <Asterisk className="w-8 h-8 text-[#409cf0]" strokeWidth={3} />
          </div>
        </div>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="px-8 pt-8 pb-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-800">
                Crea tu cuenta
              </h1>
              <p className="text-slate-500 mt-2">
                Ingresa tus datos para empezar
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {errorText && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200 text-red-800"
                >
                  <AlertDescription>{errorText}</AlertDescription>
                </Alert>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    placeholder="Ej. Juan Pérez"
                    className="h-12 pl-10 bg-slate-50 border-slate-200"
                    {...register('name')}
                    aria-invalid={!!errors.name}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    autoComplete="email"
                    className="h-12 pl-10 bg-slate-50 border-slate-200"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="h-12 pl-10 pr-10 bg-slate-50 border-slate-200"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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

        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Secure Cloud
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider font-medium">
            <KeyRound className="w-3.5 h-3.5" />
            256-bit AES
          </div>
        </div>
      </div>
    </div>
  );
}
