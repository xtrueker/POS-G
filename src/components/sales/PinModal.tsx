import { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<void>;
  title: string;
  description: string;
  showReason?: boolean;
  onReasonChange?: (reason: string) => void;
}

export default function PinModal({ isOpen, onClose, onConfirm, title, description, showReason, onReasonChange }: PinModalProps) {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (showReason && reason.length < 5) {
      toast.error('La razón debe tener al menos 5 caracteres');
      return;
    }
    setIsSubmitting(true);
    await onConfirm(pin);
    setIsSubmitting(false);
    setPin('');
    setReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl p-8 focus-visible:outline-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-light tracking-widest uppercase text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-900 pb-4">
            <Lock className="w-4 h-4 text-zinc-900 dark:text-zinc-100 stroke-[1.5]" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm uppercase tracking-widest text-zinc-600 flex items-start gap-2 font-medium leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {description}
            </p>
          </div>
          
          <div>
            <label className="text-sm uppercase tracking-widest text-zinc-500 font-semibold mb-2 block">PIN del dueño</label>
            <Input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="h-12 text-center text-2xl tracking-[0.5em] font-mono border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950"
            />
          </div>

          {showReason && (
            <div>
              <label className="text-sm uppercase tracking-widest text-zinc-500 font-semibold mb-2 block">Razón</label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  onReasonChange?.(e.target.value);
                }}
                placeholder="EXPLIQUE LA RAZÓN..."
                className="w-full p-4 border border-zinc-200 dark:border-zinc-800 rounded-none outline-none focus:border-zinc-900 resize-none text-xs uppercase tracking-wide bg-white dark:bg-zinc-950"
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <Button variant="outline" onClick={onClose} className="rounded-none border-zinc-200 dark:border-zinc-800 text-sm font-semibold uppercase tracking-widest w-32 shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 text-zinc-600 h-10">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={pin.length < 4 || (showReason && reason.length < 5) || isSubmitting}
              className="rounded-none bg-zinc-900 hover:bg-zinc-800 text-white text-sm uppercase tracking-widest font-semibold w-40 shadow-none h-10"
            >
              {isSubmitting ? 'Verificando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
