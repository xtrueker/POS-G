import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TIER_THRESHOLDS } from './constants';
import type { Customer } from '@/types';

// ============================================
// TAILWIND MERGE
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// ID & BARCODE GENERATORS
// ============================================

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateBarcode(): string {
  return '7' + Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');
}

// ============================================
// DEVICE INFO
// ============================================

export function getDeviceInfo(): string {
  return `${navigator.platform} - ${navigator.userAgent.split(' ').slice(-1)[0]}`;
}

// ============================================
// FORMATTING
// ============================================

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`;
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CO', options);
}

// ============================================
// LOYALTY TIER
// ============================================

export function getCustomerTier(lifetimePoints: number): Customer['tier'] {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

// ============================================
// DEBOUNCE
// ============================================

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
