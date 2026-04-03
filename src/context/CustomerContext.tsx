import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { CustomerRepository } from '@/services/repositories/CustomerRepository';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { getCustomerTier } from '@/lib/utils';
import { LoyaltyService } from '@/domain/services/LoyaltyService';
import type { Customer } from '@/types';

interface CustomerContextType {
  customers: Customer[];
  isLoading: boolean;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalSpent' | 'balance' | 'loyaltyPoints' | 'lifetimePoints' | 'tier' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<{ success: boolean; message: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; message: string }>;
  processCustomerSale: (customerId: string, saleTotal: number) => Promise<void>;
  reverseCustomerSale: (customerId: string, saleTotal: number) => Promise<void>;
  addLoyaltyPoints: (customerId: string, points: number, reason?: string) => Promise<void>;
  redeemLoyaltyPoints: (customerId: string, points: number) => Promise<{ success: boolean; message: string }>;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const repository = new CustomerRepository();

  const refreshCustomers = useCallback(async () => {
    if (!user || !businessId) return;
    setIsLoading(true);
    try {
      const data = await repository.getAll(businessId);
      setCustomers(data);
    } catch (err) {
      console.error('Error refreshing customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'totalSpent' | 'balance' | 'loyaltyPoints' | 'lifetimePoints' | 'tier'>) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };
    try {
      const createdCustomer = await repository.create(businessId, customerData);
      setCustomers(prev => [...prev, createdCustomer]);
      return { success: true, message: 'Cliente creado' };
    } catch (err) {
      return { success: false, message: 'Error al crear cliente' };
    }
  }, [user, businessId]);

  const updateCustomer = useCallback(async (id: string, customerData: Partial<Customer>) => {
    if (!user) return { success: false, message: 'No auth' };
    try {
      await repository.update(id, customerData);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...customerData } : c));
      return { success: true, message: 'Cliente actualizado' };
    } catch (err) {
      return { success: false, message: 'Error al actualizar cliente' };
    }
  }, [user]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!user) return { success: false, message: 'No auth' };
    try {
      await repository.delete(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      return { success: true, message: 'Cliente eliminado' };
    } catch (err) {
      return { success: false, message: 'Error al eliminar cliente' };
    }
  }, [user]);

  const addLoyaltyPoints = useCallback(async (customerId: string, points: number, reason?: string) => {
    if (!user) return;
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const newLifetime = (customer.lifetimePoints || 0) + points;
    const newTier = getCustomerTier(newLifetime);
    
    const update = {
      loyaltyPoints: (customer.loyaltyPoints || 0) + points,
      lifetimePoints: newLifetime,
      tier: newTier
    };

    try {
      await repository.update(customerId, update);
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...update } : c));
      console.log(`Added ${points} points to ${customer.name}. Reason: ${reason || 'N/A'}`);
    } catch (err) {
      console.error('Error adding loyalty points:', err);
    }
  }, [user, customers]);

  const processCustomerSale = useCallback(async (customerId: string, saleTotal: number) => {
    if (!user) return;
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const update = LoyaltyService.processSale(customer, saleTotal);

    try {
      await repository.update(customerId, update);
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...update } : c));
    } catch (err) {
      console.error('Error processing customer sale:', err);
    }
  }, [user, customers]);

  const reverseCustomerSale = useCallback(async (customerId: string, saleTotal: number) => {
    if (!user) return;
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const update = LoyaltyService.reverseSale(customer, saleTotal);

    try {
      await repository.update(customerId, update);
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...update } : c));
    } catch (err) {
      console.error('Error reversing customer sale:', err);
    }
  }, [user, customers]);

  const redeemLoyaltyPoints = useCallback(async (customerId: string, points: number) => {
    if (!user) return { success: false, message: 'No auth' };
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return { success: false, message: 'Cliente no encontrado' };

    if ((customer.loyaltyPoints || 0) < points) {
      return { success: false, message: 'Puntos insuficientes' };
    }

    const update = {
      loyaltyPoints: (customer.loyaltyPoints || 0) - points,
    };

    try {
      await repository.update(customerId, update);
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...update } : c));
      return { success: true, message: `Canjeados ${points} puntos exitosamente` };
    } catch (err) {
      return { success: false, message: 'Error al canjear puntos' };
    }
  }, [user, customers]);

  const value = useMemo(() => ({
    customers, 
    isLoading, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    processCustomerSale,
    reverseCustomerSale,
    addLoyaltyPoints, 
    redeemLoyaltyPoints,
    refreshCustomers 
  }), [customers, isLoading, addCustomer, updateCustomer, deleteCustomer, processCustomerSale, reverseCustomerSale, addLoyaltyPoints, redeemLoyaltyPoints, refreshCustomers]);

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
