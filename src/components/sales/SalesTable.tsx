import { Search, RotateCcw, CheckCircle, AlertTriangle, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { type Sale } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface SalesTableProps {
  sales: Sale[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  canReverseSale: boolean;
  onReverseSale: (saleId: string) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPaymentLabel(method: string) {
  switch (method) {
    case 'cash': return 'EFECTIVO';
    case 'card': return 'TARJETA';
    default: return 'TRANSFERENCIA';
  }
}

function getPaymentStyle(method: string) {
  switch (method) {
    case 'cash': return 'bg-white dark:bg-zinc-950 border-zinc-900 text-zinc-900 dark:text-zinc-100';
    case 'card': return 'bg-zinc-100 border-zinc-300 text-zinc-600';
    default: return 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500';
  }
}

export default function SalesTable({ sales, searchTerm, onSearchChange, canReverseSale, onReverseSale }: SalesTableProps) {
  return (
    <>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.5]" />
        <Input
          placeholder="BUSCAR REGISTROS DE VENTA..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-12 rounded-none border border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest placeholder:text-zinc-500"
        />
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 overflow-hidden glass-light dark:glass-dark border-glow-light dark:border-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {['FECHA', 'CLIENTE', 'PRODUCTOS', 'DESCUENTO', 'MÉTODO', 'TOTAL', 'ESTADO', 'ACCIONES'].map((header, i) => (
                  <th key={header} className={`px-6 py-4 text-xs font-semibold tracking-wider uppercase text-zinc-500 ${i === 5 ? 'text-right' : i >= 6 ? 'text-center' : 'text-left'}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900/50 transition-colors group ${sale.isReversed ? 'opacity-60 bg-zinc-50 dark:bg-zinc-900/80 grayscale' : ''}`}>
                  <td className="px-6 py-4 text-sm font-mono tracking-widest text-zinc-600">{formatDate(sale.date)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-100 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-light text-zinc-900 dark:text-zinc-100 text-xs">
                        {(sale.customerName && sale.customerName !== 'Cliente general') ? sale.customerName.charAt(0) : 'G'}
                      </div>
                      <span className="font-medium text-xs tracking-wide uppercase text-zinc-900 dark:text-zinc-100">{sale.customerName || 'CLIENTE GENERAL'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-zinc-600">{sale.products.length} ÍTEMS</td>
                  <td className="px-6 py-4">
                    {sale.discountAmount && sale.discountAmount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold tracking-widest uppercase bg-zinc-900 text-white">
                        <Tag className="w-3 h-3 stroke-[2]" />{sale.discountCode} (-{formatCurrency(sale.discountAmount)})
                      </span>
                    ) : (
                      <span className="text-zinc-300 font-mono text-xs">---</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold tracking-widest uppercase border ${getPaymentStyle(sale.paymentMethod)}`}>
                      {getPaymentLabel(sale.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(sale.total)}</td>
                  <td className="px-6 py-4 text-center">
                    {sale.isReversed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold tracking-widest uppercase bg-zinc-200 text-zinc-500">
                        <AlertTriangle className="w-3 h-3 stroke-[2]" />REVERSO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold tracking-widest uppercase bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                        <CheckCircle className="w-3 h-3 stroke-[2]" />ACTIVA
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!sale.isReversed && canReverseSale && (
                        <button onClick={() => onReverseSale(sale.id)} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 transition-colors" title="Reversar Venta">
                          <RotateCcw className="w-4 h-4 stroke-[1.5]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
