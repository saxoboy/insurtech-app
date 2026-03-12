import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';
import './globals.css';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Insurtech - Cotización de Seguros',
  description: 'Plataforma de cotización y emisión de pólizas de seguros',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn('font-sans', figtree.variable)}>
      <body className="min-h-dvh flex flex-col antialiased bg-white">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
