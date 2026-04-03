import { supabase } from '@/lib/supabase';
import { BaseRepository } from './BaseRepository';
import type { Supplier } from '@/types';

export class SupplierRepository extends BaseRepository {
  private mapToDomain(row: any): Supplier {
    return {
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      totalPurchases: Number(row.total_purchases || 0),
      balance: Number(row.balance || 0),
      createdAt: row.created_at,
    };
  }

  async getAll(businessId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) this.handleError(error, 'SupplierRepository.getAll');
    return (data || []).map(this.mapToDomain);
  }

  async create(businessId: string, supplier: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await (supabase.from('suppliers') as any)
      .insert({
        business_id: businessId,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        total_purchases: 0,
        balance: 0,
      })
      .select()
      .single();

    if (error) this.handleError(error, 'SupplierRepository.create');
    return this.mapToDomain(data);
  }

  async update(id: string, supplier: Partial<Supplier>): Promise<void> {
    const { error } = await (supabase.from('suppliers') as any)
      .update({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        total_purchases: supplier.totalPurchases,
        balance: supplier.balance,
      } as any)
      .eq('id', id);

    if (error) this.handleError(error, 'SupplierRepository.update');
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) this.handleError(error, 'SupplierRepository.delete');
  }
}
