import { describe, it, expect } from 'vitest';
import { calculatePremium } from '@/lib/premium-calculator';

describe('calculatePremium', () => {
  describe('returns null for incomplete inputs', () => {
    it('returns null when insuranceType is unknown', () => {
      expect(calculatePremium('UNKNOWN', 'ESTANDAR', 30, 'EC-PICHINCHA')).toBeNull();
    });

    it('returns null when coverage is unknown', () => {
      expect(calculatePremium('AUTO', 'UNKNOWN', 30, 'EC-PICHINCHA')).toBeNull();
    });

    it('returns null when location is unknown', () => {
      expect(calculatePremium('AUTO', 'ESTANDAR', 30, 'UNKNOWN')).toBeNull();
    });

    it('returns null when age is undefined', () => {
      expect(calculatePremium('AUTO', 'ESTANDAR', undefined, 'EC-PICHINCHA')).toBeNull();
    });

    it('returns null when age is 0 (falsy)', () => {
      expect(calculatePremium('AUTO', 'ESTANDAR', 0, 'EC-PICHINCHA')).toBeNull();
    });
  });

  describe('age factor calculation', () => {
    it('applies age factor 20 for age < 25', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 20, 'EC-PICHINCHA');
      expect(result).not.toBeNull();
      const ageLine = result!.breakdown.find((b) => b.concept === 'Factor Edad');
      expect(ageLine?.amount).toBe(20);
    });

    it('applies age factor 10 for age 25-39', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-PICHINCHA');
      const ageLine = result!.breakdown.find((b) => b.concept === 'Factor Edad');
      expect(ageLine?.amount).toBe(10);
    });

    it('applies age factor 15 for age 40-59', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 50, 'EC-PICHINCHA');
      const ageLine = result!.breakdown.find((b) => b.concept === 'Factor Edad');
      expect(ageLine?.amount).toBe(15);
    });

    it('applies age factor 25 for age >= 60', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 65, 'EC-PICHINCHA');
      const ageLine = result!.breakdown.find((b) => b.concept === 'Factor Edad');
      expect(ageLine?.amount).toBe(25);
    });
  });

  describe('insurance type base premiums', () => {
    it('AUTO has base premium 50', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-PICHINCHA');
      const baseLine = result!.breakdown.find((b) => b.concept === 'Prima Base');
      expect(baseLine?.amount).toBe(50);
    });

    it('SALUD has base premium 80', () => {
      const result = calculatePremium('SALUD', 'ESTANDAR', 30, 'EC-PICHINCHA');
      const baseLine = result!.breakdown.find((b) => b.concept === 'Prima Base');
      expect(baseLine?.amount).toBe(80);
    });

    it('HOGAR has base premium 40', () => {
      const result = calculatePremium('HOGAR', 'ESTANDAR', 30, 'EC-PICHINCHA');
      const baseLine = result!.breakdown.find((b) => b.concept === 'Prima Base');
      expect(baseLine?.amount).toBe(40);
    });
  });

  describe('coverage factors', () => {
    it('ESTANDAR adds 0', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-PICHINCHA');
      const line = result!.breakdown.find((b) => b.concept === 'Factor Cobertura');
      expect(line?.amount).toBe(0);
    });

    it('PREMIUM adds 30', () => {
      const result = calculatePremium('AUTO', 'PREMIUM', 30, 'EC-PICHINCHA');
      const line = result!.breakdown.find((b) => b.concept === 'Factor Cobertura');
      expect(line?.amount).toBe(30);
    });

    it('GOLD adds 60', () => {
      const result = calculatePremium('AUTO', 'GOLD', 30, 'EC-PICHINCHA');
      const line = result!.breakdown.find((b) => b.concept === 'Factor Cobertura');
      expect(line?.amount).toBe(60);
    });
  });

  describe('location factors', () => {
    it('EC-PICHINCHA adds 15', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-PICHINCHA');
      const line = result!.breakdown.find((b) => b.concept === 'Factor Ubicación');
      expect(line?.amount).toBe(15);
    });

    it('EC-GUAYAS adds 12', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-GUAYAS');
      const line = result!.breakdown.find((b) => b.concept === 'Factor Ubicación');
      expect(line?.amount).toBe(12);
    });

    it('EC-LOJA adds 4', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-LOJA');
      const line = result!.breakdown.find((b) => b.concept === 'Factor Ubicación');
      expect(line?.amount).toBe(4);
    });
  });

  describe('total calculation', () => {
    it('correctly sums all factors for AUTO/ESTANDAR/age30/PICHINCHA', () => {
      // base=50 + age=10 + location=15 + coverage=0 = 75
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-PICHINCHA');
      expect(result!.total).toBe(75);
    });

    it('correctly sums all factors for SALUD/GOLD/age20/GUAYAS', () => {
      // base=80 + age=20 + location=12 + coverage=60 = 172
      const result = calculatePremium('SALUD', 'GOLD', 20, 'EC-GUAYAS');
      expect(result!.total).toBe(172);
    });

    it('correctly sums all factors for HOGAR/PREMIUM/age65/LOJA', () => {
      // base=40 + age=25 + location=4 + coverage=30 = 99
      const result = calculatePremium('HOGAR', 'PREMIUM', 65, 'EC-LOJA');
      expect(result!.total).toBe(99);
    });
  });

  describe('breakdown structure', () => {
    it('returns exactly 4 breakdown items', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-PICHINCHA');
      expect(result!.breakdown).toHaveLength(4);
    });

    it('breakdown items have concept and amount properties', () => {
      const result = calculatePremium('AUTO', 'ESTANDAR', 30, 'EC-PICHINCHA');
      for (const item of result!.breakdown) {
        expect(item).toHaveProperty('concept');
        expect(item).toHaveProperty('amount');
        expect(typeof item.concept).toBe('string');
        expect(typeof item.amount).toBe('number');
      }
    });
  });
});
