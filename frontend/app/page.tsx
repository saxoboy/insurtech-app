import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowRight, Car, HeartPulse, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full min-h-162.5 flex items-center bg-linear-to-br from-[#eae4d5] via-[#e2dbce] to-[#d6cbbc] pt-20">
        {/* Placeholder para la imagen de fondo */}
        {/* <div className="absolute inset-0 z-0 opacity-80 mix-blend-multiply">
          <Image src="/hero-bg.jpg" fill className="object-cover" alt="Hero background" priority />
        </div> */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-start gap-6">
          <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-500 uppercase tracking-wider shadow-sm">
            SEGUROS INTELIGENTES
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#0f172a] max-w-2xl leading-[1.1]">
            Cotiza tu seguro <br />
            <span className="text-[#51a8ff] text-6xl md:text-7xl font-black">
              en minutos
            </span>
          </h1>

          <p className="max-w-xl text-lg text-slate-600 font-medium">
            Protección real, simple y al instante. Auto, Salud y Hogar diseñados
            para tu tranquilidad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/quote"
              className={cn(
                buttonVariants({
                  size: 'lg',
                  className:
                    'bg-[#409cf0] hover:bg-blue-500 text-white rounded-xl px-8 h-12 shadow-md shadow-blue-500/20',
                }),
              )}
            >
              Comenzar cotización <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/quote">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl w-full sm:w-auto px-8 h-12 bg-white/70 border-white/50 backdrop-blur text-slate-800 hover:bg-white transition-all shadow-sm"
              >
                Ver coberturas
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex -space-x-3">
              <div className="h-10 w-10 rounded-full border-2 border-[#eae4d5] bg-blue-100 flex justify-center items-center text-xs overflow-hidden shadow-sm">
                <img
                  src="https://i.pravatar.cc/100?img=47"
                  alt="Client 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-[#eae4d5] bg-green-100 flex justify-center items-center text-xs overflow-hidden shadow-sm">
                <img
                  src="https://i.pravatar.cc/100?img=33"
                  alt="Client 2"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-[#eae4d5] bg-pink-100 flex justify-center items-center text-xs overflow-hidden shadow-sm">
                <img
                  src="https://i.pravatar.cc/100?img=12"
                  alt="Client 3"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-sm leading-tight">
                +10k clientes
              </span>
              <span className="text-slate-600 text-xs font-medium">
                Confían en nuestra protección
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Card Auto */}
          <div className="bg-[#f8f9fb] hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] p-8 flex flex-col gap-4 border-transparent">
            <div className="w-14 h-14 rounded-2xl bg-blue-100/60 flex items-center justify-center text-[#51a8ff] mb-2">
              <Car className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Auto</h3>
            <p className="text-sm text-slate-500 font-medium flex-1 leading-relaxed">
              Protección total para tu vehículo con asistencia técnica y legal
              disponible las 24 horas del día.
            </p>
            <Link
              href="/quote"
              className="inline-flex items-center text-sm font-bold text-[#51a8ff] hover:text-blue-600 transition-colors mt-2"
            >
              Saber más{' '}
              <span className="ml-2 text-xs opacity-70">&#10095;</span>
            </Link>
          </div>

          {/* Card Salud */}
          <div className="bg-[#f8f9fb] hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] p-8 flex flex-col gap-4 border-transparent">
            <div className="w-14 h-14 rounded-2xl bg-blue-100/60 flex items-center justify-center text-[#51a8ff] mb-2">
              <HeartPulse className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Salud</h3>
            <p className="text-sm text-slate-500 font-medium flex-1 leading-relaxed">
              Acceso inmediato a la red de hospitales más prestigiosa. Cobertura
              médica integral para toda tu familia.
            </p>
            <Link
              href="/quote"
              className="inline-flex items-center text-sm font-bold text-[#51a8ff] hover:text-blue-600 transition-colors mt-2"
            >
              Saber más{' '}
              <span className="ml-2 text-xs opacity-70">&#10095;</span>
            </Link>
          </div>

          {/* Card Hogar */}
          <div className="bg-[#f8f9fb] hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] p-8 flex flex-col gap-4 border-transparent">
            <div className="w-14 h-14 rounded-2xl bg-blue-100/60 flex items-center justify-center text-[#51a8ff] mb-2">
              <Home className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Hogar</h3>
            <p className="text-sm text-slate-500 font-medium flex-1 leading-relaxed">
              Resguarda tu patrimonio ante incendios, robos o desastres
              naturales con pólizas personalizadas.
            </p>
            <Link
              href="/quote"
              className="inline-flex items-center text-sm font-bold text-[#51a8ff] hover:text-blue-600 transition-colors mt-2"
            >
              Saber más{' '}
              <span className="ml-2 text-xs opacity-70">&#10095;</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
