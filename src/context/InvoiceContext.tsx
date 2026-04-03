import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { InvoiceRepository } from '@/services/repositories/InvoiceRepository';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';

import type { Invoice } from '@/types';

interface InvoiceContextType {
  invoices: Invoice[];
  isLoading: boolean;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'isEditable'> & { id?: string }) => Promise<{ success: boolean; message: string }>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<{ success: boolean; message: string }>;
  deleteInvoice: (id: string) => Promise<{ success: boolean; message: string }>;
  markAsPaid: (id: string, method?: 'cash' | 'card' | 'transfer' | 'split') => Promise<{ success: boolean; message: string }>;
  refreshInvoices: () => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const repository = new InvoiceRepository();

  const refreshInvoices = useCallback(async () => {
    if (!user || !businessId) return;
    setIsLoading(true);
    try {
      const data = await repository.getAll(businessId);
      setInvoices(data);
    } catch (err) {
      console.error('Error refreshing invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    refreshInvoices();
  }, [refreshInvoices]);

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'isEditable'> & { id?: string }) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };
    try {
      const invoice: Invoice = {
        ...invoiceData,
        id: invoiceData.id || crypto.randomUUID(),
        invoiceNumber: `INV-${Date.now()}`,
        isEditable: true
      };
      await repository.create(businessId, invoice);
      setInvoices(prev => [invoice, ...prev]);
      return { success: true, message: 'Factura creada' };
    } catch (err) {
      return { success: false, message: 'Error al crear factura' };
    }
  };

  const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
    try {
      await repository.update(id, invoice);
      refreshInvoices();
      return { success: true, message: 'Factura actualizada' };
    } catch (err) {
      return { success: false, message: 'Error al actualizar factura' };
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await repository.delete(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      return { success: true, message: 'Factura eliminada' };
    } catch (err) {
      return { success: false, message: 'Error al eliminar factura' };
    }
  };

  const markAsPaid = async (id: string, method: 'cash' | 'card' | 'transfer' | 'split' = 'cash') => {
    try {
      await repository.update(id, { status: 'paid', paidDate: new Date().toISOString(), paymentMethod: method } as any);
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid', paidDate: new Date().toISOString(), paymentMethod: method } : i));
      return { success: true, message: 'Factura marcada como pagada' };
    } catch (err) {
      return { success: false, message: 'Error al actualizar factura' };
    }
  };

  return (
    <InvoiceContext.Provider value={{ invoices, isLoading, addInvoice, updateInvoice, deleteInvoice, markAsPaid, refreshInvoices }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoices = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) throw new Error('useInvoices must be used within an InvoiceProvider');
  return context;
};
