import { supabase } from '@/lib/supabase';
import type { CashRegister } from '@/types';

export class CashRegisterRepository {
  private tableName = 'cash_registers';

  private mapFromDb(dbItem: any): CashRegister {
    return {
      id: dbItem.id,
      businessId: dbItem.business_id,
      locationId: dbItem.location_id,
      openedBy: dbItem.opened_by,
      openedAt: dbItem.opened_at,
      closedAt: dbItem.closed_at,
      initialAmount: Number(dbItem.initial_amount),
      expectedAmount: Number(dbItem.expected_amount),
      actualAmount: dbItem.actual_amount != null ? Number(dbItem.actual_amount) : undefined,
      difference: dbItem.difference != null ? Number(dbItem.difference) : undefined,
      notes: dbItem.notes,
      status: dbItem.status,
      createdAt: dbItem.created_at,
      updatedAt: dbItem.updated_at
    };
  }

  private mapToDb(item: Partial<CashRegister>): any {
    const dbItem: any = {};
    if (item.id) dbItem.id = item.id;
    if (item.businessId) dbItem.business_id = item.businessId;
    if (item.locationId) dbItem.location_id = item.locationId;
    if (item.openedBy) dbItem.opened_by = item.openedBy;
    if (item.openedAt) dbItem.opened_at = item.openedAt;
    if (item.closedAt !== undefined) dbItem.closed_at = item.closedAt;
    if (item.initialAmount !== undefined) dbItem.initial_amount = item.initialAmount;
    if (item.expectedAmount !== undefined) dbItem.expected_amount = item.expectedAmount;
    if (item.actualAmount !== undefined) dbItem.actual_amount = item.actualAmount;
    if (item.difference !== undefined) dbItem.difference = item.difference;
    if (item.notes !== undefined) dbItem.notes = item.notes;
    if (item.status) dbItem.status = item.status;
    return dbItem;
  }

  async getOpenRegister(businessId: string, locationId: string, userId: string): Promise<CashRegister | null> {
    try {
      // Find the currently open register for this specific user in this specific location
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('business_id', businessId)
        .eq('location_id', locationId)
        .eq('opened_by', userId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching open register:', error);
        return null;
      }
      return data ? this.mapFromDb(data) : null;
    } catch (err) {
      console.error('Exception fetching open register:', err);
      return null;
    }
  }

  async create(register: Omit<CashRegister, 'id' | 'createdAt' | 'updatedAt' | 'openedAt'>): Promise<CashRegister> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert((this.mapToDb({ ...register, openedAt: new Date().toISOString() }) as any))
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');
    
    return this.mapFromDb(data);
  }

  async update(id: string, updates: Partial<CashRegister>): Promise<CashRegister> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update((this.mapToDb({ ...updates }) as any))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from update');
    
    return this.mapFromDb(data);
  }
}
