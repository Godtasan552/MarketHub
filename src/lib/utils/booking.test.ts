import { describe, it, expect } from 'vitest';
import { calculateBookingDetails, RentalType } from './booking';

describe('calculateBookingDetails', () => {
  const pricing = {
    daily: 100,
    weekly: 600,
    monthly: 2000,
  };

  it('should calculate daily rental correctly', () => {
    const startDate = new Date('2026-01-20');
    const result = calculateBookingDetails(pricing, startDate, 'daily');

    expect(result.totalAmount).toBe(100);
    expect(result.startDate.getFullYear()).toBe(2026);
    expect(result.startDate.getMonth()).toBe(0); // January
    expect(result.startDate.getDate()).toBe(20);
    expect(result.endDate.getDate()).toBe(20);
  });

  it('should calculate weekly rental correctly', () => {
    const startDate = new Date('2026-01-20');
    const result = calculateBookingDetails(pricing, startDate, 'weekly');

    expect(result.totalAmount).toBe(600);
    expect(result.endDate.getDate()).toBe(26); // 20 + 6
  });

  it('should fallback to daily * 7 if weekly pricing is missing', () => {
    const sparsePricing = { daily: 100 };
    const result = calculateBookingDetails(sparsePricing, new Date('2026-01-20'), 'weekly');
    expect(result.totalAmount).toBe(700);
  });

  it('should calculate monthly rental correctly', () => {
    const startDate = new Date('2026-01-20');
    const result = calculateBookingDetails(pricing, startDate, 'monthly');

    expect(result.totalAmount).toBe(2000);
    // Jan 20 + 29 days = Feb 18 (in 2026 which is not a leap year)
    expect(result.endDate.getMonth()).toBe(1); // February (0-indexed)
  });

  it('should throw error for invalid rental type', () => {
    expect(() => calculateBookingDetails(pricing, new Date(), 'yearly' as unknown as RentalType)).toThrow('รูปแบบการเช่าไม่ถูกต้อง');
  });
});
