import { vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Helpers ────────────────────────────────────────────

function makePrismaStub() {
  return {
    insuranceType: { findUnique: vi.fn() },
    coverage: { findFirst: vi.fn() },
    location: { findUnique: vi.fn() },
    quote: { create: vi.fn(), findUnique: vi.fn() },
  } as unknown as PrismaService;
}

/** Configure the Prisma stub so that catalog lookups succeed. */
function stubCatalogLookups(
  prisma: any,
  opts: {
    insuranceType?: string;
    coverage?: string;
    location?: string;
  } = {},
) {
  const typeCode = opts.insuranceType ?? 'AUTO';
  const covCode = opts.coverage ?? 'ESTANDAR';
  const locCode = opts.location ?? 'EC-PICHINCHA';

  prisma.insuranceType.findUnique.mockResolvedValue({
    id: 1,
    code: typeCode,
    name: typeCode,
  });
  prisma.coverage.findFirst.mockResolvedValue({
    id: 1,
    code: covCode,
    name: covCode,
    insuranceTypeId: 1,
  });
  prisma.location.findUnique.mockResolvedValue({
    id: 1,
    code: locCode,
    name: locCode,
  });
}

function stubQuoteCreate(prisma: any) {
  prisma.quote.create.mockImplementation(({ data }: any) => {
    const breakdown = data.breakdown?.create ?? [];
    return Promise.resolve({
      id: 'quote-uuid',
      status: 'DRAFT',
      insuranceTypeCode: data.insuranceTypeCode,
      coverageCode: data.coverageCode,
      locationCode: data.locationCode,
      age: data.age,
      estimatedPremium: data.estimatedPremium,
      breakdown,
      createdAt: new Date('2026-01-01'),
    });
  });
}

// ─── Tests ──────────────────────────────────────────────

describe('QuotesService', () => {
  let service: QuotesService;
  let prisma: any;

  beforeEach(() => {
    prisma = makePrismaStub();
    service = new QuotesService(prisma);
  });

  // ── Premium calculation ─────────────────────────────

  describe('create – premium calculation', () => {
    /*
     * Expected formula:
     *   estimatedPremium = BASE_PREMIUM[type]
     *                    + ageFactor(age)
     *                    + LOCATION_FACTOR[loc]
     *                    + COVERAGE_FACTOR[cov]
     *
     * BASE_PREMIUM:    AUTO=50, SALUD=80, HOGAR=40
     * COVERAGE_FACTOR: ESTANDAR=0, PREMIUM=30, GOLD=60
     * LOCATION_FACTOR: EC-PICHINCHA=15, EC-GUAYAS=12, EC-AZUAY=8,
     *                  EC-MANABI=6, EC-TUNGURAHUA=5, EC-LOJA=4
     * ageFactor:       <25 → 20, <40 → 10, <60 → 15, >=60 → 25
     */

    const cases: {
      label: string;
      insuranceType: string;
      coverage: string;
      location: string;
      age: number;
      expectedPremium: number;
    }[] = [
      // AUTO + ESTANDAR + Pichincha + age 30  → 50+10+15+0 = 75
      {
        label: 'AUTO / ESTANDAR / Pichincha / age 30',
        insuranceType: 'AUTO',
        coverage: 'ESTANDAR',
        location: 'EC-PICHINCHA',
        age: 30,
        expectedPremium: 75,
      },
      // SALUD + PREMIUM + Guayas + age 20  → 80+20+12+30 = 142
      {
        label: 'SALUD / PREMIUM / Guayas / age 20',
        insuranceType: 'SALUD',
        coverage: 'PREMIUM',
        location: 'EC-GUAYAS',
        age: 20,
        expectedPremium: 142,
      },
      // HOGAR + GOLD + Azuay + age 50  → 40+15+8+60 = 123
      {
        label: 'HOGAR / GOLD / Azuay / age 50',
        insuranceType: 'HOGAR',
        coverage: 'GOLD',
        location: 'EC-AZUAY',
        age: 50,
        expectedPremium: 123,
      },
      // AUTO + GOLD + Loja + age 65  → 50+25+4+60 = 139
      {
        label: 'AUTO / GOLD / Loja / age 65',
        insuranceType: 'AUTO',
        coverage: 'GOLD',
        location: 'EC-LOJA',
        age: 65,
        expectedPremium: 139,
      },
      // SALUD + ESTANDAR + Manabi + age 24  → 80+20+6+0 = 106
      {
        label: 'SALUD / ESTANDAR / Manabi / age 24',
        insuranceType: 'SALUD',
        coverage: 'ESTANDAR',
        location: 'EC-MANABI',
        age: 24,
        expectedPremium: 106,
      },
      // HOGAR + PREMIUM + Tungurahua + age 40  → 40+15+5+30 = 90
      {
        label: 'HOGAR / PREMIUM / Tungurahua / age 40',
        insuranceType: 'HOGAR',
        coverage: 'PREMIUM',
        location: 'EC-TUNGURAHUA',
        age: 40,
        expectedPremium: 90,
      },
    ];

    for (const c of cases) {
      it(`calculates ${c.expectedPremium} for ${c.label}`, async () => {
        stubCatalogLookups(prisma, {
          insuranceType: c.insuranceType,
          coverage: c.coverage,
          location: c.location,
        });
        stubQuoteCreate(prisma);

        const result = await service.create({
          insuranceType: c.insuranceType,
          coverage: c.coverage,
          location: c.location,
          age: c.age,
        });

        expect(result.estimatedPremium).toBe(c.expectedPremium);

        // Also verify Prisma was called with the computed premium
        expect(prisma.quote.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              estimatedPremium: c.expectedPremium,
            }),
          }),
        );
      });
    }
  });

  // ── Age factor boundaries ───────────────────────────

  describe('create – age factor boundaries', () => {
    // All use AUTO/ESTANDAR/EC-PICHINCHA so base=50, loc=15, cov=0
    const ageCases = [
      { age: 18, factor: 20, label: 'age <25' },
      { age: 24, factor: 20, label: 'age =24 (still <25)' },
      { age: 25, factor: 10, label: 'age =25 (25..39)' },
      { age: 39, factor: 10, label: 'age =39 (still <40)' },
      { age: 40, factor: 15, label: 'age =40 (40..59)' },
      { age: 59, factor: 15, label: 'age =59 (still <60)' },
      { age: 60, factor: 25, label: 'age =60 (>=60)' },
      { age: 100, factor: 25, label: 'age =100 (>=60)' },
    ];

    for (const { age, factor, label } of ageCases) {
      it(`applies age factor ${factor} for ${label}`, async () => {
        stubCatalogLookups(prisma);
        stubQuoteCreate(prisma);

        const result = await service.create({
          insuranceType: 'AUTO',
          coverage: 'ESTANDAR',
          location: 'EC-PICHINCHA',
          age,
        });

        // base(50) + ageFactor + location(15) + coverage(0)
        expect(result.estimatedPremium).toBe(50 + factor + 15 + 0);
      });
    }
  });

  // ── Breakdown structure ─────────────────────────────

  describe('create – breakdown structure', () => {
    it('returns four breakdown items with correct concepts and amounts', async () => {
      stubCatalogLookups(prisma, {
        insuranceType: 'AUTO',
        coverage: 'PREMIUM',
        location: 'EC-GUAYAS',
      });
      stubQuoteCreate(prisma);

      const result = await service.create({
        insuranceType: 'AUTO',
        coverage: 'PREMIUM',
        location: 'EC-GUAYAS',
        age: 35,
      });

      // AUTO=50, age35→10, EC-GUAYAS=12, PREMIUM=30 → 102
      expect(result.breakdown).toHaveLength(4);
      expect(result.breakdown).toEqual([
        { concept: 'Base', amount: 50 },
        { concept: 'Factor edad', amount: 10 },
        { concept: 'Factor ubicación', amount: 12 },
        { concept: 'Factor cobertura', amount: 30 },
      ]);
    });

    it('passes breakdown create array to Prisma', async () => {
      stubCatalogLookups(prisma);
      stubQuoteCreate(prisma);

      await service.create({
        insuranceType: 'AUTO',
        coverage: 'ESTANDAR',
        location: 'EC-PICHINCHA',
        age: 30,
      });

      expect(prisma.quote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            breakdown: {
              create: [
                { concept: 'Base', amount: 50 },
                { concept: 'Factor edad', amount: 10 },
                { concept: 'Factor ubicación', amount: 15 },
                { concept: 'Factor cobertura', amount: 0 },
              ],
            },
          }),
          include: { breakdown: true },
        }),
      );
    });
  });

  // ── Validation errors ───────────────────────────────

  describe('create – validation errors', () => {
    it('throws BadRequestException when insurance type not found', async () => {
      prisma.insuranceType.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          insuranceType: 'VIDA',
          coverage: 'ESTANDAR',
          location: 'EC-PICHINCHA',
          age: 30,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create({
          insuranceType: 'VIDA',
          coverage: 'ESTANDAR',
          location: 'EC-PICHINCHA',
          age: 30,
        }),
      ).rejects.toThrow("Insurance type 'VIDA' not found");
    });

    it('throws BadRequestException when coverage not found', async () => {
      prisma.insuranceType.findUnique.mockResolvedValue({
        id: 1,
        code: 'AUTO',
        name: 'Auto',
      });
      prisma.coverage.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          insuranceType: 'AUTO',
          coverage: 'ULTRA',
          location: 'EC-PICHINCHA',
          age: 30,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create({
          insuranceType: 'AUTO',
          coverage: 'ULTRA',
          location: 'EC-PICHINCHA',
          age: 30,
        }),
      ).rejects.toThrow("Coverage 'ULTRA' not found for type 'AUTO'");
    });

    it('throws BadRequestException when location not found', async () => {
      prisma.insuranceType.findUnique.mockResolvedValue({
        id: 1,
        code: 'AUTO',
        name: 'Auto',
      });
      prisma.coverage.findFirst.mockResolvedValue({
        id: 1,
        code: 'ESTANDAR',
        name: 'Estandar',
        insuranceTypeId: 1,
      });
      prisma.location.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          insuranceType: 'AUTO',
          coverage: 'ESTANDAR',
          location: 'EC-NOWHERE',
          age: 30,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create({
          insuranceType: 'AUTO',
          coverage: 'ESTANDAR',
          location: 'EC-NOWHERE',
          age: 30,
        }),
      ).rejects.toThrow("Location 'EC-NOWHERE' not found");
    });

    it('throws BadRequestException for unknown coverage factor (catalog exists but no factor)', async () => {
      // The catalog lookup succeeds, but the coverage code has no entry in COVERAGE_FACTOR
      prisma.insuranceType.findUnique.mockResolvedValue({
        id: 1,
        code: 'AUTO',
        name: 'Auto',
      });
      prisma.coverage.findFirst.mockResolvedValue({
        id: 99,
        code: 'ULTRA',
        name: 'Ultra',
        insuranceTypeId: 1,
      });
      prisma.location.findUnique.mockResolvedValue({
        id: 1,
        code: 'EC-PICHINCHA',
        name: 'Pichincha',
      });

      await expect(
        service.create({
          insuranceType: 'AUTO',
          coverage: 'ULTRA',
          location: 'EC-PICHINCHA',
          age: 30,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create({
          insuranceType: 'AUTO',
          coverage: 'ULTRA',
          location: 'EC-PICHINCHA',
          age: 30,
        }),
      ).rejects.toThrow("Unknown coverage factor: 'ULTRA'");
    });

    it('throws BadRequestException for unknown location factor (catalog exists but no factor)', async () => {
      prisma.insuranceType.findUnique.mockResolvedValue({
        id: 1,
        code: 'AUTO',
        name: 'Auto',
      });
      prisma.coverage.findFirst.mockResolvedValue({
        id: 1,
        code: 'ESTANDAR',
        name: 'Estandar',
        insuranceTypeId: 1,
      });
      prisma.location.findUnique.mockResolvedValue({
        id: 99,
        code: 'EC-GALAPAGOS',
        name: 'Galapagos',
      });

      await expect(
        service.create({
          insuranceType: 'AUTO',
          coverage: 'ESTANDAR',
          location: 'EC-GALAPAGOS',
          age: 30,
        }),
      ).rejects.toThrow("Unknown location factor: 'EC-GALAPAGOS'");
    });
  });

  // ── findOne ─────────────────────────────────────────

  describe('findOne', () => {
    it('returns a formatted quote when found', async () => {
      prisma.quote.findUnique.mockResolvedValue({
        id: 'abc-123',
        status: 'DRAFT',
        insuranceTypeCode: 'SALUD',
        coverageCode: 'GOLD',
        locationCode: 'EC-AZUAY',
        age: 45,
        estimatedPremium: 163,
        breakdown: [
          { concept: 'Base', amount: 80 },
          { concept: 'Factor edad', amount: 15 },
          { concept: 'Factor ubicación', amount: 8 },
          { concept: 'Factor cobertura', amount: 60 },
        ],
        createdAt: new Date('2026-01-15'),
      });

      const result = await service.findOne('abc-123');

      expect(result).toEqual({
        id: 'abc-123',
        status: 'DRAFT',
        inputs: {
          insuranceType: 'SALUD',
          coverage: 'GOLD',
          location: 'EC-AZUAY',
          age: 45,
        },
        estimatedPremium: 163,
        breakdown: [
          { concept: 'Base', amount: 80 },
          { concept: 'Factor edad', amount: 15 },
          { concept: 'Factor ubicación', amount: 8 },
          { concept: 'Factor cobertura', amount: 60 },
        ],
        createdAt: new Date('2026-01-15'),
      });
    });

    it('throws NotFoundException when quote does not exist', async () => {
      prisma.quote.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        "Quote 'nonexistent' not found",
      );
    });
  });
});
