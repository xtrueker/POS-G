import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { SalesRepository } from '@/services/repositories/SalesRepository';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { useInventory } from './InventoryContext';
import type { Sale } from '@/types';

interface SalesContextType {
  sales: Sale[];
  isLoading: boolean;
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'staffId' | 'staffName'>) => Promise<{ success: boolean; sale?: Sale; message: string }>;
  reverseSale: (id: string, pin: string, reason: string) => Promise<{ success: boolean; message: string }>;
  refreshSales: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const { products, updateProduct } = useInventory();
  
  const repository = new SalesRepository();

  const refreshSales = useCallback(async () => {
    if (!user || !businessId) return;
    setIsLoading(true);
    try {
      const data = await repository.getAll(businessId);
      setSales(data);
    } catch (err) {
      console.error('Error refreshing sales:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    refreshSales();
  }, [refreshSales]);

  const addSale = useCallback(async (sale: any) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };

    // 1. Logic: Check stock (Only for physical products)
    for (const item of sale.products) {
      const product = products.find(p => p.id === item.productId);
      if (product && !product.isService && product.stock < item.quantity) {
        return { success: false, message: `Stock insuficiente para ${item.name}` };
      }
    }

    const newSale: Sale = { 
      ...sale, 
      id: crypto.randomUUID(), 
      date: new Date().toISOString(), 
      staffId: user?.id, 
      staffName: (user as any)?.user_metadata?.full_name || user?.email, 
      paymentLines: sale.paymentLines || [], // MULTI-COBRO
      deviceInfo: {
        platform: navigator.platform,
        userAgent: navigator.userAgent.split(' ').slice(-1)[0],
        timestamp: new Date().toISOString()
      } as any
    };

    // 2. OPTIMISTIC UI: Actualizar estados locales INSTANTÁNEAMENTE para fluidez total
    setSales(prev => [newSale, ...prev].slice(0, 100)); // Limitar a 100 para ahorrar RAM
    
    // Descontar stock localmente (Only for physical products)
    for (const item of sale.products) {
      const product = products.find(p => p.id === item.productId);
      if (product && !product.isService) {
        // Actualizamos el inventario local sin esperar al server
        updateProduct(product.id, { stock: product.stock - item.quantity });
      }
    }

    try {
      // 3. PERSISTENCIA ESTÁNDAR (Fallback ante limitaciones de RPC en servicios)
      await repository.create(businessId, newSale);

      return { success: true, sale: newSale, message: 'Venta completada exitosamente' };
    } catch (err) {
      // 4. ROLLBACK en caso de fallo crítico
      console.error('Error persistiendo venta:', err);
      refreshSales(); 
      return { success: false, message: 'Error de red al sincronizar la venta' };
    }
  }, [user, businessId, products, updateProduct, refreshSales]);

  const reverseSale = useCallback(async (id: string, _pin: string, reason: string) => {
    const sale = sales.find(s => s.id === id);
    if (!sale || sale.isReversed) return { success: false, message: 'Venta no válida' };

    try {
      await repository.update(id, { isReversed: true, reversalReason: reason, reversedAt: new Date().toISOString() } as any);
      
      // Restore stock (Only for physical products)
      for (const item of sale.products) {
        const product = products.find(p => p.id === item.productId);
        if (product && !product.isService) {
          await updateProduct(product.id, { stock: product.stock + item.quantity });
        }
      }

      setSales(prev => prev.map(s => s.id === id ? { ...s, isReversed: true, reversalReason: reason } : s));
      return { success: true, message: 'Venta reversada' };
    } catch (err) {
      return { success: false, message: 'Error al reversar' };
    }
  }, [sales, products, updateProduct]);

  const value = useMemo(() => ({
    sales, isLoading, addSale, reverseSale, refreshSales
  }), [sales, isLoading, addSale, reverseSale, refreshSales]);

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (context === undefined) throw new Error('useSales must be used within a SalesProvider');
  return context;
};
