import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#f8f9fc] border-t border-slate-200 py-10 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-500" />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Insurtech
          </span>
        </div>

        <nav className="flex flex-wrap justify-center items-center gap-6">
          <Link
            href="/privacidad"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Privacidad
          </Link>
          <Link
            href="/terminos"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Términos
          </Link>
          <Link
            href="/faq"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/contacto"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Contacto
          </Link>
        </nav>

        <div className="text-sm font-medium text-slate-400">
          © {new Date().getFullYear()} Insurtech. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
