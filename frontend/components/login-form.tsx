'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  Asterisk,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      const from = searchParams.get('from') ?? '/quote';
      router.push(from);
    } catch (err: unknown) {
      const detail =
        typeof err === 'object' &&
        err !== null &&
        Array.isArray((err as Record<string, unknown>).detail)
          ? ((err as Record<string, unknown>).detail as string[])[0]
          : undefined;
      setError(detail ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
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
                Bienvenido de nuevo
              </h1>
              <p className="text-slate-500 mt-2">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200 text-red-800"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
                    autoComplete="current-password"
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
                <div className="text-right">
                  <Link
                    href="#"
                    className="text-sm text-[#409cf0] hover:underline"
                  >
                    ¿Olvidé mi contraseña?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#409cf0] hover:bg-blue-500 font-semibold text-base"
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/register"
                className="text-[#409cf0] hover:underline font-semibold"
              >
                Regístrate gratis
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
