'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, Bell, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, hydrate } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isPoliciesActive =
    pathname === '/policies' || pathname.startsWith('/policies/');
  const isQuotesActive =
    pathname === '/quote' || pathname.startsWith('/quote/');

  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'w-full z-50 transition-colors',
        isHome
          ? 'absolute top-0 bg-transparent text-slate-800'
          : 'sticky top-0 bg-white border-b border-slate-100',
      )}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50/80 flex items-center justify-center">
            <ShieldCheck
              className="h-6 w-6 text-[#409cf0]"
              fill="currentColor"
              fillOpacity={0.2}
            />
          </div>
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Insurtech
          </Link>

          {/* Authenticated Links (Center/Left shifted) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6 ml-8">
              <Link
                href="/quote"
                className={cn(
                  'text-sm font-semibold transition-colors pb-7 pt-7 border-b-2',
                  isQuotesActive
                    ? 'border-[#409cf0] text-[#409cf0]'
                    : 'border-transparent text-slate-500 hover:text-slate-800',
                )}
              >
                Cotizaciones
              </Link>
              <Link
                href="/policies"
                className={cn(
                  'text-sm font-semibold transition-colors pb-7 pt-7 border-b-2',
                  isPoliciesActive
                    ? 'border-[#409cf0] text-[#409cf0]'
                    : 'border-transparent text-slate-500 hover:text-slate-800',
                )}
              >
                Mis Pólizas
              </Link>
              <Link
                href="#"
                className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 pb-7 pt-7 border-b-2 border-transparent"
              >
                Siniestros
              </Link>
              <Link
                href="#"
                className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800 pb-7 pt-7 border-b-2 border-transparent"
              >
                Soporte
              </Link>
            </nav>
          )}
        </div>

        {/* Center Links for Unauthenticated */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={cn(
                'text-sm font-semibold transition-colors hover:text-[#409cf0]',
                pathname === '/' ? 'text-slate-900' : 'text-slate-600',
              )}
            >
              Inicio
            </Link>
            <Link
              href="/seguros"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#409cf0]"
            >
              Seguros
            </Link>
            <Link
              href="/nosotros"
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#409cf0]"
            >
              Nosotros
            </Link>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-4">
              <button className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-600 hover:bg-slate-200 transition-colors">
                <Bell className="h-5 w-5" />
              </button>

              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-600 hover:bg-slate-200 transition-colors overflow-hidden"
              >
                <User className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-600 hover:text-[#409cf0] transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({
                    size: 'sm',
                    className:
                      'bg-[#409cf0] hover:bg-blue-500 text-white rounded-lg px-5 shadow-sm font-semibold border-none',
                  }),
                )}
              >
                Registrarse
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Abrir menú de navegación"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-4 md:hidden absolute w-full shadow-lg"
          aria-hidden={!menuOpen}
        >
          {isAuthenticated ? (
            <>
              <Link
                href="/quote"
                className="px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Cotizaciones
              </Link>
              <Link
                href="/policies"
                className="px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Mis Pólizas
              </Link>
              <Link
                href="#"
                className="px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Siniestros
              </Link>
              <Link
                href="#"
                className="px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Soporte
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md text-left"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Inicio
              </Link>
              <Link
                href="/seguros"
                className="px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Seguros
              </Link>
              <Link
                href="/nosotros"
                className="px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Nosotros
              </Link>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-md mt-4 border-t pt-4"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
