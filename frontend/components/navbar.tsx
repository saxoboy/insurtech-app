'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Insurtech
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/quote"
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted',
                pathname === '/quote'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              Cotizar
            </Link>
            {isAuthenticated && (
              <Link
                href="/policies"
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted',
                  pathname.startsWith('/polic')
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                Mis Pólizas
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              Cerrar sesión
            </Button>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
