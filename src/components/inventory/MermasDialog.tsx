import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/context/BusinessContext';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';
import { AlertOctagon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MermasDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MermasDialog({ isOpen, onClose }: MermasDialogProps) {
  const { businessId } = useBusiness();
  const { user } = useAuth();
  const { products, updateProduct } = useInventory();
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar solo productos que tengan stock
  const availableProducts = products.filter(p => p.stock > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return toast.error('Error: Sesión de inquilino no encontrada');
    
    if (!selectedProduct || !quantity || parseFloat(quantity) <= 0) {
      return toast.error('Selecciona un producto y cantidad válida');
    }
    
    if (!notes) {
      return toast.error('Justifica la razón de la merma (Ej: Pan quemado, vencido)');
    }

    const qtyNumber = parseFloat(quantity);
    const product = products.find(p => p.id === selectedProduct);
    
    if (!product) return;
    if (qtyNumber > product.stock) {
      return toast.error(`No puedes decomisar más del stock actual (${product.stock})`);
    }

    setIsSubmitting(true);
    try {
      // 1. Descontar Stock a través del Contexto (o directamente en PG)
      const newStock = product.stock - qtyNumber;
      
      const { error: updateError } = await (supabase as any)
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', product.id)
        .eq('business_id', businessId);
        
      if (updateError) throw updateError;
      
      // Actualizar frontend context
      updateProduct(product.id, { stock: newStock });

      // 2. Registrar en el Kárdex Inmutable como 'waste' (Merma)
      const { error: moveError } = await (supabase as any)
        .from('inventory_movements')
        .insert({
          business_id: businessId,
          product_id: product.id,
          location_id: null,
          type: 'waste',
          quantity: qtyNumber,
          notes: `[MERMA] ${notes}`,
          created_by: user?.id
        });

      if (moveError) {
        console.error("Kárdex Error:", moveError);
        toast.warning('Stock descontado, pero hubo un error registrando la merma.');
      } else {
        toast.success(`Merma de ${qtyNumber} unidades registrada correctamente.`);
      }

      // Limpiar y cerrar
      setSelectedProduct('');
      setQuantity('');
      setNotes('');
      onClose();

    } catch (e: any) {
      toast.error('Error al declarar merma: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-red-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
            <AlertOctagon className="w-5 h-5"/> Registrar Merma
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-gray-500 mb-2">
          Registra productos dañados, vencidos o descartados. Esto ajustará el inventario en el Kárdex de Mermas correctamente.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold block mb-2">Producto o Insumo a dar de baja</label>
            <select 
               className="w-full h-11 px-3 rounded-xl border border-gray-300 bg-white dark:bg-zinc-950" 
               value={selectedProduct} 
               onChange={e => setSelectedProduct(e.target.value)} 
               required
            >
              <option value="">-- Selecciona el Producto --</option>
              {availableProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Disponible: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold block mb-2">Cantidad a Descartar</label>
              <Input 
                 type="number" 
                 step="0.01" 
                 className="rounded-xl h-11 border-red-200 focus-visible:ring-red-500" 
                 value={quantity} 
                 onChange={e => setQuantity(e.target.value)} 
                 min="0.01" 
                 placeholder="Ej: 5"
                 required 
              />
            </div>
            <div>
              <label className="text-sm font-bold block mb-2">Motivo / Causa</label>
              <Input 
                 type="text" 
                 className="rounded-xl h-11" 
                 value={notes} 
                 onChange={e => setNotes(e.target.value)} 
                 placeholder="Ej: Pan quemado en horno"
                 required 
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-12" disabled={isSubmitting}>
              <Trash2 className="w-4 h-4 mr-2" /> {isSubmitting ? 'Registrando...' : 'Confirmar Merma'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

