import { describe, it, expect } from 'vitest';
import { quoteSchema } from '@/lib/schemas/quote-schema';

describe('quoteSchema', () => {
  const validData = {
    insuranceType: 'AUTO',
    coverage: 'ESTANDAR',
    age: 30,
    location: 'EC-PICHINCHA',
  };

  describe('valid data', () => {
    it('passes with all valid fields', () => {
      const result = quoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('passes with minimum age (18)', () => {
      const result = quoteSchema.safeParse({ ...validData, age: 18 });
      expect(result.success).toBe(true);
    });

    it('passes with maximum age (100)', () => {
      const result = quoteSchema.safeParse({ ...validData, age: 100 });
      expect(result.success).toBe(true);
    });
  });

  describe('insuranceType validation', () => {
    it('fails when insuranceType is empty string', () => {
      const result = quoteSchema.safeParse({ ...validData, insuranceType: '' });
      expect(result.success).toBe(false);
    });

    it('fails when insuranceType is missing', () => {
      const { insuranceType, ...rest } = validData;
      const result = quoteSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('coverage validation', () => {
    it('fails when coverage is empty string', () => {
      const result = quoteSchema.safeParse({ ...validData, coverage: '' });
      expect(result.success).toBe(false);
    });

    it('fails when coverage is missing', () => {
      const { coverage, ...rest } = validData;
      const result = quoteSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('age validation', () => {
    it('fails when age is below 18', () => {
      const result = quoteSchema.safeParse({ ...validData, age: 17 });
      expect(result.success).toBe(false);
    });

    it('fails when age is above 100', () => {
      const result = quoteSchema.safeParse({ ...validData, age: 101 });
      expect(result.success).toBe(false);
    });

    it('fails when age is not an integer', () => {
      const result = quoteSchema.safeParse({ ...validData, age: 30.5 });
      expect(result.success).toBe(false);
    });

    it('fails when age is a string', () => {
      const result = quoteSchema.safeParse({ ...validData, age: '30' });
      expect(result.success).toBe(false);
    });

    it('fails when age is missing', () => {
      const { age, ...rest } = validData;
      const result = quoteSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('location validation', () => {
    it('fails when location is empty string', () => {
      const result = quoteSchema.safeParse({ ...validData, location: '' });
      expect(result.success).toBe(false);
    });

    it('fails when location is missing', () => {
      const { location, ...rest } = validData;
      const result = quoteSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('completely invalid input', () => {
    it('fails with an empty object', () => {
      const result = quoteSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('fails with null', () => {
      const result = quoteSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('fails with undefined', () => {
      const result = quoteSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });
});
