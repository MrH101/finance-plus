import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-0.99)).toBe('-$0.99');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles large numbers correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(1000000000)).toBe('$1,000,000,000.00');
    });

    it('handles decimal places correctly', () => {
      expect(formatCurrency(1234.5678)).toBe('$1,234.57');
      expect(formatCurrency(1234.5612)).toBe('$1,234.56');
    });
  });

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      expect(formatDate('2024-03-01')).toBe('March 1, 2024');
      expect(formatDate('2024-12-31')).toBe('December 31, 2024');
    });

    it('formats Date object correctly', () => {
      expect(formatDate(new Date('2024-03-01'))).toBe('March 1, 2024');
      expect(formatDate(new Date('2024-12-31'))).toBe('December 31, 2024');
    });

    it('handles different months correctly', () => {
      expect(formatDate('2024-01-01')).toBe('January 1, 2024');
      expect(formatDate('2024-06-15')).toBe('June 15, 2024');
    });

    it('handles single digit days correctly', () => {
      expect(formatDate('2024-03-05')).toBe('March 5, 2024');
      expect(formatDate('2024-03-09')).toBe('March 9, 2024');
    });
  });

  describe('formatDateTime', () => {
    it('formats date string with time correctly', () => {
      expect(formatDateTime('2024-03-01T09:30:00')).toBe('March 1, 2024, 09:30 AM');
      expect(formatDateTime('2024-12-31T15:45:00')).toBe('December 31, 2024, 03:45 PM');
    });

    it('formats Date object with time correctly', () => {
      expect(formatDateTime(new Date('2024-03-01T09:30:00'))).toBe('March 1, 2024, 09:30 AM');
      expect(formatDateTime(new Date('2024-12-31T15:45:00'))).toBe('December 31, 2024, 03:45 PM');
    });

    it('handles midnight correctly', () => {
      expect(formatDateTime('2024-03-01T00:00:00')).toBe('March 1, 2024, 12:00 AM');
    });

    it('handles noon correctly', () => {
      expect(formatDateTime('2024-03-01T12:00:00')).toBe('March 1, 2024, 12:00 PM');
    });

    it('handles single digit hours and minutes correctly', () => {
      expect(formatDateTime('2024-03-01T01:05:00')).toBe('March 1, 2024, 01:05 AM');
      expect(formatDateTime('2024-03-01T09:09:00')).toBe('March 1, 2024, 09:09 AM');
    });
  });
}); 