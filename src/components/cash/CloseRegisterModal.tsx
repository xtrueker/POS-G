import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, DollarSign, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCash } from '@/context/CashContext';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CloseRegisterModal({ isOpen, onClose }: Props) {
  const { expectedCash, closeRegister, currentRegister } = useCash();
  const [actualAmountStr, setActualAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setActualAmountStr('');
      setNotes('');
    }
  }, [isOpen]);

  const actualAmount = Number(actualAmountStr.replace(/[^0-9]/g, ''));
  const difference = actualAmountStr ? actualAmount - expectedCash : 0;
  const isMatch = difference === 0;
  const isShort = difference < 0;
  const isOver = difference > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualAmountStr) {
      toast.error('Debes ingresar el conteo físico de la caja.');
      return;
    }

    setIsSubmitting(true);
    const result = await closeRegister(actualAmount, notes);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    if (numericValue) {
      setActualAmountStr(Number(numericValue).toLocaleString('es-CO'));
    } else {
      setActualAmountStr('');
    }
  };

  if (!currentRegister) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden p-0 gap-0 focus-visible:outline-none">
        
        <div className="bg-zinc-900 p-8 text-white relative">
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 bg-white dark:bg-zinc-950/10 flex items-center justify-center shrink-0 border border-white/20">
               <Lock className="w-5 h-5 text-white stroke-[1.5]" />
             </div>
             <div>
               <DialogTitle className="font-light uppercase tracking-[0.2em] text-lg m-0 p-0 leading-tight">
                 Cierre de Turno
               </DialogTitle>
               <DialogDescription className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mt-2">
                 REPORTE FINAL • ARQUEO DE CAJA
               </DialogDescription>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2"><Calculator className="w-3.5 h-3.5" /> BASE INICIAL</span>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">${currentRegister.initialAmount.toLocaleString('es-CO')}</span>
             </div>
             <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-[0.2em]">+ VENTAS EFECTIVO</span>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">+ ${(expectedCash - currentRegister.initialAmount).toLocaleString('es-CO')}</span>
             </div>
             <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em]">EFECTIVO ESPERADO</span>
                <span className="text-xl font-mono font-medium text-zinc-900 dark:text-zinc-100">${expectedCash.toLocaleString('es-CO')}</span>
             </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 block">
              CONTEO FÍSICO (EFECTIVO EN CAJÓN)
            </label>
            <div className="relative group">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 stroke-[1.5]" />
              <Input
                type="text"
                required
                value={actualAmountStr}
                onChange={handleAmountChange}
                placeholder="0"
                className="pl-12 h-14 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 rounded-none text-2xl font-mono tracking-tight transition-all focus-visible:ring-0 bg-white dark:bg-zinc-950"
              />
            </div>

            {/* Difference Indicator */}
            {actualAmountStr && (
              <div className={`p-4 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 transition-colors ${
                isMatch ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100' : 
                isShort ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600' : 
                'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
              }`}>
                 {isMatch ? <CheckCircle2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" /> : <AlertTriangle className="w-5 h-5 text-zinc-400" />}
                 <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] block">
                      {isMatch ? 'CAJA CUADRADA' : isShort ? 'FALTANTE DE CAJA' : 'SOBRANTE DE CAJA'}
                    </span>
                    {!isMatch && <span className="text-xs font-mono mt-1 block">DIFERENCIA: ${Math.abs(difference).toLocaleString('es-CO')}</span>}
                 </div>
              </div>
            )}
          </div>

          {(isShort || isOver) && (
            <div className="space-y-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 block">
                JUSTIFICACIÓN DEL DESCUADRE
              </label>
              <textarea
                required
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="EXPLIQUE LA RAZÓN DEL DESCUADRE..."
                className="w-full p-4 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 rounded-none text-xs uppercase tracking-widest min-h-[100px] outline-none transition-colors"
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-10 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 font-semibold uppercase tracking-[0.2em] text-[10px] transition-all shadow-none"
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !actualAmountStr || ((isShort || isOver) && notes.trim().length < 5)}
              className="flex-1 h-10 bg-zinc-900 text-white rounded-none hover:bg-zinc-800 font-semibold uppercase tracking-[0.2em] text-[10px] transition-all shadow-none"
            >
              CONFIRMAR CIERRE
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

