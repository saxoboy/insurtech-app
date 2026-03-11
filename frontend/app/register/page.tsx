import type { Metadata } from 'next';
import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = {
  title: 'Registrarse - Insurtech',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
