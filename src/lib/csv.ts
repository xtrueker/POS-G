// ============================================
// CSV EXPORT UTILITY
// ============================================

/**
 * Convierte un array de objetos a CSV y lo descarga.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: Partial<Record<keyof T, string>>,
): void {
  if (data.length === 0) return;

  const keys = Object.keys(data[0]) as (keyof T)[];
  const headerRow = keys.map(k => headers?.[k] ?? String(k)).join(',');

  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(','),
  );

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\n'); // BOM for Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Descarga ventas como CSV.
 */
export function exportSalesToCSV(sales: {
  id: string; date: string; total: number; subtotal: number;
  discountAmount: number; paymentMethod: string; customerName?: string;
  staffName?: string; isReversed?: boolean; products: { name: string; quantity: number; price: number }[];
}[]): void {
  const rows = sales.map(s => ({
    ID: s.id,
    Fecha: new Date(s.date).toLocaleDateString('es-CO'),
    Hora: new Date(s.date).toLocaleTimeString('es-CO'),
    Cliente: s.customerName || 'Consumidor Final',
    Productos: s.products.map(p => `${p.quantity}x ${p.name}`).join(' | '),
    Subtotal: s.subtotal,
    Descuento: s.discountAmount,
    Total: s.total,
    'Método de pago': s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia',
    Cajero: s.staffName || '',
    Estado: s.isReversed ? 'Reversada' : 'Completada',
  }));
  exportToCSV(rows, `ventas_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Descarga inventario como CSV.
 */
export function exportInventoryToCSV(products: {
  id: string; name: string; sku?: string; barcode?: string; category: string;
  price: number; cost: number; stock: number; minStock: number;
}[]): void {
  const rows = products.map(p => ({
    SKU: p.sku || '',
    'Código de barras': p.barcode || '',
    Nombre: p.name,
    Categoría: p.category,
    'Precio venta': p.price,
    'Precio costo': p.cost,
    'Margen %': p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0,
    Stock: p.stock,
    'Stock mínimo': p.minStock,
    Estado: p.stock === 0 ? 'Agotado' : p.stock <= p.minStock ? 'Stock bajo' : 'Normal',
  }));
  exportToCSV(rows, `inventario_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Descarga clientes como CSV.
 */
export function exportCustomersToCSV(customers: {
  name: string; email?: string; phone?: string; totalPurchases: number;
  totalSpent: number; loyaltyPoints: number; tier: string; createdAt: string;
}[]): void {
  const rows = customers.map(c => ({
    Nombre: c.name,
    Email: c.email || '',
    Teléfono: c.phone || '',
    'N° compras': c.totalPurchases,
    'Total gastado': c.totalSpent,
    'Puntos de lealtad': c.loyaltyPoints,
    Tier: c.tier.charAt(0).toUpperCase() + c.tier.slice(1),
    'Fecha registro': new Date(c.createdAt).toLocaleDateString('es-CO'),
  }));
  exportToCSV(rows, `clientes_${new Date().toISOString().split('T')[0]}`);
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
