import { supabase } from '@/lib/supabase';
import type { StaffMember } from '@/types';

export class StaffRepository {
  async getAll(businessId: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('business_id', businessId);

    if (error) throw error;
    
    return (data || []).map(row => ({
      id: row.id,
      name: row.full_name || '',
      email: row.email || '',
      role: row.role || 'cashier',
      permissions: row.permissions || [],
      phone: row.phone || '',
      isActive: row.is_active ?? true,
      locationId: row.location_id,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      pin: row.pin || ''
    }));
  }

  async create(businessId: string, member: StaffMember): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: member.id,
        business_id: businessId,
        full_name: member.name,
        role: member.role,
        permissions: member.permissions,
        phone: member.phone,
        is_active: member.isActive,
        pin: member.pin,
        location_id: member.locationId
      } as any);

    if (error) throw error;
  }

  async update(id: string, member: Partial<StaffMember>): Promise<void> {
    const update: any = {};
    if (member.name) update.full_name = member.name;
    if (member.role) update.role = member.role;
    if (member.permissions) update.permissions = member.permissions;
    if (member.phone) update.phone = member.phone;
    if (member.isActive !== undefined) update.is_active = member.isActive;
    if (member.pin) update.pin = member.pin;
    if (member.locationId !== undefined) update.location_id = member.locationId;

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', id);

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await (supabase.rpc as any)('delete_user_completely', { target_user_id: id });
    if (error) {
      console.error('Error delete auth:', error);
      throw error;
    }
  }
}
