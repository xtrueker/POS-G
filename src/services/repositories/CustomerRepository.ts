import { supabase } from '@/lib/supabase';
import { BaseRepository } from './BaseRepository';
import type { Customer } from '@/types';

export class CustomerRepository extends BaseRepository {
  private mapToDomain(row: any): Customer {
    return {
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      address: row.address || '',
      loyaltyPoints: Number(row.loyalty_points || 0),
      lifetimePoints: Number(row.lifetime_points || 0),
      tier: row.tier || 'bronze',
      totalSpent: Number(row.total_spent || 0),
      totalPurchases: Number(row.total_purchases || 0),
      balance: Number(row.balance || 0),
      birthdate: row.birthdate || undefined,
      notes: row.notes || '',
      preferences: row.preferences || [],
      lastPurchaseDate: row.last_purchase_date || undefined,
      createdAt: row.created_at,
    };
  }

  async getAll(businessId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) this.handleError(error, 'CustomerRepository.getAll');
    return (data || []).map(this.mapToDomain);
  }

  async create(businessId: string, customer: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'totalSpent' | 'balance' | 'loyaltyPoints' | 'lifetimePoints' | 'tier'>): Promise<Customer> {
    const { data, error } = await (supabase.from('customers') as any)
      .insert({
        business_id: businessId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        loyalty_points: 0,
        lifetime_points: 0,
        tier: 'bronze',
        total_spent: 0,
        total_purchases: 0,
        balance: 0,
        birthdate: customer.birthdate,
        notes: customer.notes,
      })
      .select()
      .single();

    if (error) this.handleError(error, 'CustomerRepository.create');
    return this.mapToDomain(data);
  }

  async update(id: string, customer: Partial<Customer>): Promise<void> {
    const payload: any = {};
    if (customer.name !== undefined) payload.name = customer.name;
    if (customer.email !== undefined) payload.email = customer.email || null;
    if (customer.phone !== undefined) payload.phone = customer.phone || null;
    if (customer.address !== undefined) payload.address = customer.address || null;
    if (customer.notes !== undefined) payload.notes = customer.notes || null;
    if (customer.birthdate !== undefined) payload.birthdate = customer.birthdate || null;
    if (customer.tags !== undefined) payload.tags = customer.tags;
    if (customer.preferences !== undefined) payload.preferences = customer.preferences;
    if (customer.loyaltyPoints !== undefined) payload.loyalty_points = customer.loyaltyPoints;
    if (customer.lifetimePoints !== undefined) payload.lifetime_points = customer.lifetimePoints;
    if (customer.tier !== undefined) payload.tier = customer.tier;
    if (customer.totalSpent !== undefined) payload.total_spent = customer.totalSpent;
    if (customer.totalPurchases !== undefined) payload.total_purchases = customer.totalPurchases;
    if (customer.lastPurchaseDate !== undefined) payload.last_purchase_date = customer.lastPurchaseDate;
    if (customer.balance !== undefined) payload.balance = customer.balance;

    const { error } = await (supabase.from('customers') as any)
      .update(payload)
      .eq('id', id);

    if (error) this.handleError(error, 'CustomerRepository.update');
  }

  async updateLoyalty(id: string, loyalty: { points: number; lifetime: number, tier: string }): Promise<void> {
    const { error } = await (supabase.from('customers') as any)
      .update({
        loyalty_points: loyalty.points,
        lifetime_points: loyalty.lifetime,
        tier: loyalty.tier
      })
      .eq('id', id);

    if (error) this.handleError(error, 'CustomerRepository.updateLoyalty');
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) this.handleError(error, 'CustomerRepository.delete');
  }
}
