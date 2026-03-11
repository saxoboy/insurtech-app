import { z } from 'zod';

export const quoteSchema = z.object({
  insuranceType: z.string().min(1, 'Selecciona un tipo de seguro'),
  coverage: z.string().min(1, 'Selecciona una cobertura'),
  age: z
    .number({ error: 'Ingresa una edad válida' })
    .int({ error: 'La edad debe ser un número entero' })
    .min(18, { error: 'Edad mínima: 18 años' })
    .max(100, { error: 'Edad máxima: 100 años' }),
  location: z.string().min(1, 'Selecciona una ubicación'),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;
