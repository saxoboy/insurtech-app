'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, hydrate } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isPoliciesActive =
    pathname === '/policies' || pathname.startsWith('/policies/');

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
                  isPoliciesActive
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

          {/* Mobile menu toggle */}
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Abrir menú de navegación"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t px-4 py-2 sm:hidden"
          aria-hidden={!menuOpen}
        >
          <Link
            href="/quote"
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
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
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                isPoliciesActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              Mis Pólizas
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
