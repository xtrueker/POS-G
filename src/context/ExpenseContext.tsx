import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ExpenseRepository } from '@/services/repositories/ExpenseRepository';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import type { Expense } from '@/types';

interface ExpenseContextType {
  expenses: Expense[];
  isLoading: boolean;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<{ success: boolean; message: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; message: string }>;
  refreshExpenses: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const repository = new ExpenseRepository();

  const refreshExpenses = useCallback(async () => {
    if (!user || !businessId) return;
    setIsLoading(true);
    try {
      const data = await repository.getAll(businessId);
      setExpenses(data);
    } catch (err) {
      console.error('Error refreshing expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };
    try {
      const newExpense = await repository.create(businessId, expense);
      setExpenses(prev => [newExpense, ...prev]);
      return { success: true, message: 'Gasto registrado' };
    } catch (err) {
      return { success: false, message: 'Error al registrar gasto' };
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      await repository.update(id, expense);
      refreshExpenses();
      return { success: true, message: 'Gasto actualizado' };
    } catch (err) {
      return { success: false, message: 'Error al actualizar gasto' };
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await repository.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      return { success: true, message: 'Gasto eliminado' };
    } catch (err) {
      return { success: false, message: 'Error al eliminar gasto' };
    }
  };

  return (
    <ExpenseContext.Provider value={{ expenses, isLoading, addExpense, updateExpense, deleteExpense, refreshExpenses }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) throw new Error('useExpenses must be used within an ExpenseProvider');
  return context;
};
