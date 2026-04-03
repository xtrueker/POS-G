// ============================================
// DIAN COLOMBIA — Utilidades de Facturación Electrónica
// ============================================
// Referencia: Resolución DIAN 000042 de 2020

/**
 * Calcula el CUFE (Código Único de Factura Electrónica)
 * Formato simplificado para uso local (el CUFE real requiere firma digital).
 */
export function generateCUFE(params: {
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  total: number;
  nit: string;
}): string {
  const raw = `${params.nit}${params.invoiceNumber}${params.issueDate}${params.total.toFixed(2)}`;
  // Simple hash determinístico — el CUFE real requiere SHA-384 con clave técnica DIAN
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
}

/**
 * Valida formato de NIT colombiano (sin dígito verificador).
 */
export function validateNIT(nit: string): boolean {
  const clean = nit.replace(/[.\-]/g, '');
  return /^\d{8,10}$/.test(clean);
}

/**
 * Calcula el dígito verificador del NIT colombiano.
 */
export function nitVerificationDigit(nit: string): number {
  const clean = nit.replace(/[.\-]/g, '');
  const primes = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47];
  const digits = clean.split('').reverse().map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * (primes[i] ?? 1), 0);
  const rem = sum % 11;
  return rem < 2 ? rem : 11 - rem;
}

/**
 * Formatea NIT con puntos y guion: 123.456.789-0
 */
export function formatNIT(nit: string, digit?: number): string {
  const clean = nit.replace(/[.\-]/g, '');
  const parts = clean.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return digit !== undefined ? `${parts}-${digit}` : parts;
}

// ============================================
// TARIFAS TRIBUTARIAS COLOMBIA 2024
// ============================================

export const TARIFAS_IVA = {
  EXENTO: 0,       // Alimentos de la canasta familiar, libros
  CINCO: 5,        // Algunos bienes agropecuarios
  DIECINUEVE: 19,  // Tarifa general
} as const;

export const REGIMENES = {
  simplificado: 'No Responsable de IVA',
  comun: 'Responsable de IVA',
} as const;

/**
 * Calcula IVA sobre un valor base.
 */
export function calcularIVA(base: number, tarifa: number = 19): { iva: number; total: number } {
  const iva = Math.round(base * (tarifa / 100));
  return { iva, total: base + iva };
}

/**
 * Calcula retención en la fuente básica (2.5% para compras >$1.174.000 en 2024)
 */
export function calcularRetencion(base: number, tasa: number = 2.5): number {
  return Math.round(base * (tasa / 100));
}

/**
 * URL del QR de verificación DIAN (producción).
 */
export function getDIANVerificationURL(cufe: string): string {
  return `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;
}
