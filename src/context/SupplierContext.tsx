import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SupplierRepository } from '@/services/repositories/SupplierRepository';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import type { Supplier } from '@/types';

interface SupplierContextType {
  suppliers: Supplier[];
  isLoading: boolean;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'balance' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<{ success: boolean; message: string }>;
  deleteSupplier: (id: string) => Promise<{ success: boolean; message: string }>;
  refreshSuppliers: () => Promise<void>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const repository = new SupplierRepository();

  const refreshSuppliers = useCallback(async () => {
    if (!user || !businessId) return;
    setIsLoading(true);
    try {
      const data = await repository.getAll(businessId);
      setSuppliers(data);
    } catch (err) {
      console.error('Error refreshing suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    refreshSuppliers();
  }, [refreshSuppliers]);

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'totalPurchases' | 'balance' | 'createdAt'>) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };
    try {
      const createdSupplier = await repository.create(businessId, supplierData);
      setSuppliers(prev => [...prev, createdSupplier]);
      return { success: true, message: 'Proveedor creado' };
    } catch (err) {
      return { success: false, message: 'Error al crear proveedor' };
    }
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    if (!user) return { success: false, message: 'No auth' };
    try {
      await repository.update(id, supplier);
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...supplier } : s));
      return { success: true, message: 'Proveedor actualizado' };
    } catch (err) {
      return { success: false, message: 'Error al actualizar proveedor' };
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!user) return { success: false, message: 'No auth' };
    try {
      await repository.delete(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      return { success: true, message: 'Proveedor eliminado' };
    } catch (err) {
      return { success: false, message: 'Error al eliminar proveedor' };
    }
  };

  return (
    <SupplierContext.Provider value={{ suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier, refreshSuppliers }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};
