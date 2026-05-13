/**
 * Utility functions for medical calculations
 */

/**
 * Round to specified decimal places using banker's rounding
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Safe natural log — protects against log(0) and negative values
 */
export function safeLn(value: number): number {
  if (value <= 0) return 0;
  return Math.log(value);
}

/**
 * Safe division
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  fallback = 0,
): number {
  if (denominator === 0) return fallback;
  return numerator / denominator;
}

/**
 * Convert age from birthdate
 */
export function calculateAge(birthDate: Date, referenceDate?: Date): number {
  const ref = referenceDate || new Date();
  let age = ref.getFullYear() - birthDate.getFullYear();
  const monthDiff = ref.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && ref.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Format weeks and days from total days
 */
export function formatGestationalAge(totalDays: number): {
  weeks: number;
  days: number;
  display: string;
} {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return {
    weeks,
    days,
    display: `${weeks}w ${days}d`,
  };
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format date to ISO date string YYYY-MM-DD
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Severity color coding
 */
export type SeverityLevel =
  | 'normal'
  | 'low'
  | 'borderline'
  | 'elevated'
  | 'high'
  | 'critical'
  | 'severe';

export interface SeverityColor {
  level: SeverityLevel;
  color: string;
  bgColor: string;
}

export const SEVERITY_COLORS: Record<SeverityLevel, SeverityColor> = {
  normal: { level: 'normal', color: '#16a34a', bgColor: '#dcfce7' },
  low: { level: 'low', color: '#2563eb', bgColor: '#dbeafe' },
  borderline: { level: 'borderline', color: '#ca8a04', bgColor: '#fef9c3' },
  elevated: { level: 'elevated', color: '#ea580c', bgColor: '#ffedd5' },
  high: { level: 'high', color: '#dc2626', bgColor: '#fee2e2' },
  critical: { level: 'critical', color: '#7c3aed', bgColor: '#ede9fe' },
  severe: { level: 'severe', color: '#991b1b', bgColor: '#fee2e2' },
};
