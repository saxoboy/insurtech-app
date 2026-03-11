'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Cotiza tu seguro en minutos
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Auto, Salud y Hogar. Obtén tu cotización al instante y emite tu póliza
        en línea.
      </p>
      <Link href="/quote" className={buttonVariants({ size: 'lg' })}>
        Comenzar cotización
      </Link>
    </div>
  );
}
