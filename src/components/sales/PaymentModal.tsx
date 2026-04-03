import { useState } from 'react';
import {
  Plus, Trash2, Layers, Wallet,
  CreditCard, Banknote, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { type SalePaymentLine } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartTotal: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'split';
  setPaymentMethod: (method: 'cash' | 'card' | 'transfer' | 'split') => void;
  paymentLines: SalePaymentLine[];
  setPaymentLines: (lines: SalePaymentLine[]) => void;
  onConfirm: () => void;
}

const PAYMENT_METHODS = [
  { id: 'cash', icon: Banknote, label: 'Efectivo' },
  { id: 'card', icon: CreditCard, label: 'Tarjeta' },
  { id: 'transfer', icon: Smartphone, label: 'Transf.' },
  { id: 'split', icon: Layers, label: 'Dividir' },
] as const;

export default function PaymentModal({
  isOpen,
  onClose,
  cartTotal,
  paymentMethod,
  setPaymentMethod,
  paymentLines,
  setPaymentLines,
  onConfirm,
}: PaymentModalProps) {
  const totalPaid = paymentLines.reduce((s, l) => s + l.amount, 0);
  const remaining = cartTotal - totalPaid;
  const isBalanceCovered = totalPaid >= cartTotal;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl p-0 overflow-hidden flex flex-col h-[600px]">
        <DialogHeader className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex flex-row items-center justify-between">
          <DialogTitle className="text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
            <Wallet className="w-4 h-4" />
            Finalizar Transacción
          </DialogTitle>
          <span className="text-xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{formatCurrency(cartTotal)}</span>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
           {/* Selector de Método Rápido */}
           <div>
             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4 block">Seleccionar Método</label>
             <div className="grid grid-cols-4 gap-3">
               {PAYMENT_METHODS.map((m) => (
                 <button
                    key={m.id}
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id !== 'split') {
                        setPaymentLines([{ method: m.id as any, amount: cartTotal }]);
                      } else if (paymentLines.length === 0) {
                        setPaymentLines([{ method: 'cash', amount: cartTotal }]);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 border transition-all duration-300 ${paymentMethod === m.id ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300'}`}
                 >
                   <m.icon className="w-5 h-5 mb-2 stroke-[1.5]" />
                   <span className="text-[10px] uppercase font-bold tracking-widest">{m.label}</span>
                 </button>
               ))}
             </div>
           </div>

           {paymentMethod === 'split' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Desglose de Pago</label>
                   <Button variant="ghost" size="sm" onClick={() => setPaymentLines([...paymentLines, { method: 'cash', amount: 0 }])} className="text-[10px] uppercase tracking-widest text-zinc-900 dark:text-zinc-100 h-6 px-2">
                     <Plus className="w-3 h-3 mr-1" /> Añadir Línea
                   </Button>
                </div>
                
                <div className="space-y-2">
                   {paymentLines.map((line, idx) => (
                     <div key={idx} className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-800">
                       <select 
                         className="bg-transparent text-[11px] uppercase font-bold tracking-widest outline-none border-none pr-4"
                         value={line.method}
                         onChange={(e) => {
                           const newLines = [...paymentLines];
                           newLines[idx].method = e.target.value as any;
                           setPaymentLines(newLines);
                         }}
                       >
                          <option value="cash">Efectivo</option>
                          <option value="card">Tarjeta</option>
                          <option value="transfer">Transferencia</option>
                       </select>
                       <div className="flex-1 flex items-center bg-white dark:bg-zinc-950 px-3 border border-zinc-200 dark:border-zinc-800 h-10">
                         <span className="text-zinc-400 mr-2">$</span>
                         <input 
                           type="number"
                           className="bg-transparent w-full text-right font-mono text-sm outline-none"
                           value={line.amount}
                           onChange={(e) => {
                             const newLines = [...paymentLines];
                             newLines[idx].amount = parseFloat(e.target.value) || 0;
                             setPaymentLines(newLines);
                           }}
                         />
                       </div>
                       <button onClick={() => setPaymentLines(paymentLines.filter((_, i) => i !== idx))} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-900">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Restante</span>
                   <span className={`text-sm font-mono ${remaining === 0 ? 'text-green-500' : 'text-red-500'}`}>
                     {formatCurrency(remaining)}
                   </span>
                </div>
             </div>
           )}
        </div>

        <DialogFooter className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-900 sm:justify-between items-center">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
             <div className={`w-3 h-3 rounded-none ${isBalanceCovered ? 'bg-green-500' : 'bg-red-500'}`} />
             {isBalanceCovered ? 'SALDO CUBIERTO' : 'SALDO INCOMPLETO'}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-none border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest px-8">Atrás</Button>
            <Button 
              onClick={() => {
                onConfirm();
                onClose();
              }} 
              disabled={!isBalanceCovered}
              className="rounded-none bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 border-glow-light dark:border-glow text-[10px] font-bold uppercase tracking-widest px-12 h-10"
            >
              Confirmar Cobro
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
