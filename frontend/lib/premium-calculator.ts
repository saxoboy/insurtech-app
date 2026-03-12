// Client-side premium calculation — mirrors backend/src/quotes/quotes.service.ts

const BASE_PREMIUM: Record<string, number> = {
  AUTO: 50,
  SALUD: 80,
  HOGAR: 40,
};

const COVERAGE_FACTOR: Record<string, number> = {
  ESTANDAR: 0,
  PREMIUM: 30,
  GOLD: 60,
};

const LOCATION_FACTOR: Record<string, number> = {
  'EC-PICHINCHA': 15,
  'EC-GUAYAS': 12,
  'EC-AZUAY': 8,
  'EC-MANABI': 6,
  'EC-TUNGURAHUA': 5,
  'EC-LOJA': 4,
};

function getAgeFactor(age: number): number {
  if (age < 25) return 20;
  if (age < 40) return 10;
  if (age < 60) return 15;
  return 25;
}

export interface PremiumBreakdownItem {
  concept: string;
  amount: number;
}

export interface PremiumResult {
  breakdown: PremiumBreakdownItem[];
  total: number;
}

export function calculatePremium(
  insuranceType: string,
  coverage: string,
  age: number | undefined,
  location: string,
): PremiumResult | null {
  const base = BASE_PREMIUM[insuranceType];
  const coverageFactor = COVERAGE_FACTOR[coverage];
  const locationFactor = LOCATION_FACTOR[location];

  if (base == null || coverageFactor == null || locationFactor == null || !age) {
    return null;
  }

  const ageFactor = getAgeFactor(age);
  const total = base + ageFactor + locationFactor + coverageFactor;

  return {
    breakdown: [
      { concept: 'Prima Base', amount: base },
      { concept: 'Factor Edad', amount: ageFactor },
      { concept: 'Factor Ubicación', amount: locationFactor },
      { concept: 'Factor Cobertura', amount: coverageFactor },
    ],
    total,
  };
}

export const BENEFITS: Record<string, string[]> = {
  AUTO: [
    'Asistencia 24/7 en carretera',
    'Protección contra robo total',
    'Responsabilidad civil ampliada',
    'Auto de reemplazo (10 días)',
  ],
  SALUD: [
    'Cobertura hospitalaria',
    'Medicamentos incluidos',
    'Consultas ilimitadas',
    'Emergencias 24/7',
  ],
  HOGAR: [
    'Protección contra incendios',
    'Cobertura por robo',
    'Daños por desastres naturales',
    'Asistencia en el hogar',
  ],
};
