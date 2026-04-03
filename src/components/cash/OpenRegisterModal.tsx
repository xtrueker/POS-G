import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LockOpen, DollarSign } from 'lucide-react';
import { useCash } from '@/context/CashContext';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function OpenRegisterModal({ isOpen, onClose }: Props) {
  const { openRegister } = useCash();
  const [initialAmount, setInitialAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(initialAmount.replace(/[^0-9]/g, ''));
    if (amount < 0) {
      toast.error('El monto inicial no puede ser negativo.');
      return;
    }

    setIsSubmitting(true);
    const result = await openRegister(amount);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message);
      setInitialAmount('');
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    if (numericValue) {
      setInitialAmount(Number(numericValue).toLocaleString('es-CO'));
    } else {
      setInitialAmount('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl bg-white dark:bg-zinc-950 p-0">
        <DialogHeader className="p-8 pb-4">
          <div className="w-12 h-12 bg-zinc-900 text-white flex items-center justify-center mb-6">
            <LockOpen className="w-5 h-5 flex-shrink-0" />
          </div>
          <DialogTitle className="text-lg font-light tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
            Apertura de Turno
          </DialogTitle>
          <DialogDescription className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em] mt-2">
            INGRESA LA BASE DE EFECTIVO PARA INICIAR
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 block">
              Efectivo en Caja (Monto Inicial)
            </label>
            <div className="relative group">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 stroke-[1.5]" />
              <Input
                type="text"
                required
                value={initialAmount}
                onChange={handleAmountChange}
                placeholder="0"
                className="pl-12 h-14 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 rounded-none text-2xl font-mono tracking-tight transition-all focus-visible:ring-0 bg-zinc-50 dark:bg-zinc-900/30"
              />
            </div>
            <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest">Solo efectivo físico presente al inicio.</p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-10 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 font-semibold uppercase tracking-widest text-[10px] transition-all shadow-none"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !initialAmount}
              className="flex-1 h-10 bg-zinc-900 text-white rounded-none hover:bg-zinc-800 font-semibold uppercase tracking-widest text-[10px] transition-all shadow-none"
            >
              Iniciar Turno
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

