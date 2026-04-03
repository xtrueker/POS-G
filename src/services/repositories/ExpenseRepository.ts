import { supabase } from '@/lib/supabase';
import { BaseRepository } from './BaseRepository';
import type { Expense } from '@/types';

export class ExpenseRepository extends BaseRepository {
  async getAll(businessId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });

    if (error) this.handleError(error, 'ExpenseRepository.getAll');
    return (data || []).map(this.mapToExpense);
  }

  async create(businessId: string, expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const { data, error } = await (supabase.from('expenses') as any)
      .insert({
        business_id: businessId,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        supplier_id: expense.supplierId,
        staff_id: expense.staffId,
        notes: expense.notes
      })
      .select()
      .single();

    if (error) this.handleError(error, 'ExpenseRepository.create');
    return this.mapToExpense(data);
  }

  async update(id: string, expense: Partial<Expense>): Promise<void> {
    const { error } = await (supabase.from('expenses') as any)
      .update({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        notes: expense.notes
      } as any)
      .eq('id', id);

    if (error) this.handleError(error, 'ExpenseRepository.update');
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) this.handleError(error, 'ExpenseRepository.delete');
  }

  private mapToExpense(data: any): Expense {
    return {
      id: data.id,
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: data.date,
      supplierId: data.supplier_id,
      staffId: data.staff_id,
      notes: data.notes,
      createdAt: data.created_at
    };
  }
}
