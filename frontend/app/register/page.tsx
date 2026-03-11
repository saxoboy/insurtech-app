'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorText(null);

    try {
      // 1. Crear usuario a la API
      const data = await api.post<{ accessToken: string }>('/auth/register', {
        email,
        password,
        name,
      });

      // 2. Guardar token manualmente (emulando lo que hace el store) o hidratar store
      localStorage.setItem('accessToken', data.accessToken);
      const authStore = useAuthStore.getState();
      authStore.hydrate(); // forzar que el store lea el nuevo token y ponga isAuthenticated = true

      // 3. Redirigir al inicio o a pólizas
      router.push('/policies');
    } catch (err) {
      const detail =
        typeof err === 'object' &&
          err !== null &&
          Array.isArray((err as Record<string, unknown>).detail)
          ? ((err as Record<string, unknown>).detail as string[])[0]
          : typeof err === 'object' &&
            err !== null &&
            typeof (err as Record<string, unknown>).detail === 'string'
            ? ((err as Record<string, unknown>).detail as string)
            : 'Error al registrar la cuenta';
      setErrorText(detail);
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200"
                  required
                  minLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-slate-50 border-slate-200"
                  required
                  minLength={6}
                />
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
