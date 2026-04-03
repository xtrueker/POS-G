import { supabase } from '@/lib/supabase';
import type { Promotion } from '@/types';

export class PromotionRepository {
  async getAll(businessId: string): Promise<Promotion[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      value: Number(item.value),
      minPurchase: item.min_purchase ? Number(item.min_purchase) : undefined,
      maxDiscount: item.max_discount ? Number(item.max_discount) : undefined,
      startDate: item.start_date,
      endDate: item.end_date,
      isActive: item.is_active,
      applicableProducts: item.applicable_products,
      applicableCategories: item.applicable_categories,
      code: item.code,
      usageLimit: item.usage_limit,
      usageCount: item.usage_count,
      requiresPin: item.requires_pin,
      createdBy: item.created_by
    }));
  }

  async save(businessId: string, promotion: Partial<Promotion>): Promise<Promotion> {
    const payload = {
      business_id: businessId,
      name: promotion.name,
      type: promotion.type,
      value: promotion.value,
      min_purchase: promotion.minPurchase,
      max_discount: promotion.maxDiscount,
      start_date: promotion.startDate,
      end_date: promotion.endDate,
      is_active: promotion.isActive,
      applicable_products: promotion.applicableProducts || [],
      applicable_categories: promotion.applicableCategories || [],
      code: promotion.code,
      usage_limit: promotion.usageLimit,
      usage_count: promotion.usageCount || 0,
      requires_pin: promotion.requiresPin || false,
      created_by: promotion.createdBy
    };

    let query;
    if (promotion.id && !promotion.id.includes('-')) {
       // if ID is somehow not a UUID (like from a previous buggy local state), ignore it. 
       // Only update if it's an existing valid UUID format.
       query = supabase.from('promotions').insert(payload).select().single();
    } else if (promotion.id) {
       query = supabase.from('promotions').update(payload).eq('id', promotion.id).select().single();
    } else {
       query = supabase.from('promotions').insert(payload).select().single();
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Supabase Error DDL:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      value: Number(data.value),
      minPurchase: data.min_purchase ? Number(data.min_purchase) : undefined,
      maxDiscount: data.max_discount ? Number(data.max_discount) : undefined,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
      applicableProducts: data.applicable_products,
      applicableCategories: data.applicable_categories,
      code: data.code,
      usageLimit: data.usage_limit,
      usageCount: data.usage_count,
      requiresPin: data.requires_pin,
      createdBy: data.created_by
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
