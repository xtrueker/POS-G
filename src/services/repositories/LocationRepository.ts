import { supabase } from '@/lib/supabase';
import type { Location } from '@/types';

export class LocationRepository {
  private mapToDomain(row: any): Location {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone || undefined,
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
    };
  }

  async getAll(businessId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(this.mapToDomain);
  }

  async save(businessId: string, location: Partial<Location>): Promise<Location> {
    const { data, error } = await (supabase.from('locations') as any)
      .upsert({
        id: location.id,
        business_id: businessId,
        name: location.name,
        address: location.address,
        phone: location.phone,
        is_active: location.isActive,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
