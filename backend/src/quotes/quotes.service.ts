import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

// ─── Factores de cálculo de prima ────────────────────────

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

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuoteDto) {
    // Validar que los códigos de catálogo existan
    const insuranceType = await this.prisma.insuranceType.findUnique({
      where: { code: dto.insuranceType },
    });
    if (!insuranceType) {
      throw new BadRequestException(
        `Insurance type '${dto.insuranceType}' not found`,
      );
    }

    const coverage = await this.prisma.coverage.findFirst({
      where: {
        code: dto.coverage,
        insuranceTypeId: insuranceType.id,
      },
    });
    if (!coverage) {
      throw new BadRequestException(
        `Coverage '${dto.coverage}' not found for type '${dto.insuranceType}'`,
      );
    }

    const location = await this.prisma.location.findUnique({
      where: { code: dto.location },
    });
    if (!location) {
      throw new BadRequestException(`Location '${dto.location}' not found`);
    }

    // Calcular prima
    const base = BASE_PREMIUM[dto.insuranceType] ?? 50;
    const ageFactor = getAgeFactor(dto.age);
    const locationFactor = LOCATION_FACTOR[dto.location] ?? 5;
    const coverageFactor = COVERAGE_FACTOR[dto.coverage] ?? 0;
    const estimatedPremium = base + ageFactor + locationFactor + coverageFactor;

    // Crear quote con breakdown
    const quote = await this.prisma.quote.create({
      data: {
        insuranceTypeCode: dto.insuranceType,
        coverageCode: dto.coverage,
        locationCode: dto.location,
        age: dto.age,
        estimatedPremium: estimatedPremium,
        breakdown: {
          create: [
            { concept: 'Base', amount: base },
            { concept: 'Factor edad', amount: ageFactor },
            { concept: 'Factor ubicación', amount: locationFactor },
            { concept: 'Factor cobertura', amount: coverageFactor },
          ],
        },
      },
      include: { breakdown: true },
    });

    return this.formatQuote(quote);
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { breakdown: true },
    });

    if (!quote) {
      throw new NotFoundException(`Quote '${id}' not found`);
    }

    return this.formatQuote(quote);
  }

  private formatQuote(quote: any) {
    return {
      id: quote.id,
      status: quote.status,
      inputs: {
        insuranceType: quote.insuranceTypeCode,
        coverage: quote.coverageCode,
        location: quote.locationCode,
        age: quote.age,
      },
      estimatedPremium: Number(quote.estimatedPremium),
      breakdown: quote.breakdown.map((b: any) => ({
        concept: b.concept,
        amount: Number(b.amount),
      })),
      createdAt: quote.createdAt,
    };
  }
}
