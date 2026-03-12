import type { Metadata } from 'next';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = {
  title: 'Iniciar sesión - Insurtech',
};

export default function LoginPage() {
  return <LoginForm />;
}
