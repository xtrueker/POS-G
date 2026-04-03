import { supabase } from '@/lib/supabase';
import { BaseRepository } from './BaseRepository';
import type { Sale } from '@/types';

export class SalesRepository extends BaseRepository {
  private mapToSale(row: any): Sale {
    return {
      id: row.id,
      businessId: row.business_id,
      locationId: row.location_id,
      staffId: row.staff_id,
      staffName: row.staff_name,
      products: row.items || [], // React UI expects "products", DB stores "items"
      subtotal: Number(row.subtotal),
      discountAmount: Number(row.discount_amount || row.discount || 0),
      total: Number(row.total),
      paymentMethod: row.payment_method,
      paymentLines: row.payment_lines || [], // MULTI-COBRO
      customerId: row.customer_id,
      customerName: row.customer_name, 
      notes: row.notes,
      date: row.date,
      deviceInfo: row.device_info,
      isReversed: row.is_reversed || false,
      reversalReason: row.reversal_reason,
      reversedAt: row.reversed_at
    } as Sale;
  }

  async getAll(businessId: string): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });

    if (error) this.handleError(error, 'SalesRepository.getAll');
    return (data || []).map(this.mapToSale);
  }

  async create(businessId: string, sale: Sale): Promise<void> {
    const { error } = await (supabase.from('sales') as any).insert({
      id: sale.id,
      business_id: businessId,
      location_id: sale.locationId || null,
      staff_id: sale.staffId || null,
      staff_name: sale.staffName || 'Sistema',
      subtotal: Number(sale.subtotal || 0),
      discount: Number(sale.discountAmount || 0),
      total: Number(sale.total || 0),
      payment_method: sale.paymentMethod || 'cash',
      payment_lines: sale.paymentLines || [],
      customer_id: sale.customerId || null,
      notes: sale.notes || '',
      items: sale.products || [],
      date: sale.date || new Date().toISOString(),
      device_info: sale.deviceInfo || {},
      tax: Number((sale as any).tax || 0),
      status: 'completed'
    } as any);

    if (error) this.handleError(error, 'SalesRepository.create');
  }

  async createOptimized(businessId: string, sale: Sale): Promise<void> {
    const { error } = await (supabase as any).rpc('process_sale_optimized', {
      p_sale_id: sale.id,
      p_business_id: businessId,
      p_location_id: sale.locationId,
      p_customer_id: sale.customerId,
      p_staff_id: sale.staffId,
      p_staff_name: sale.staffName,
      p_subtotal: sale.subtotal,
      p_discount: sale.discountAmount || 0,
      p_total: sale.total,
      p_payment_method: sale.paymentMethod,
      p_payment_lines: sale.paymentLines,
      p_items: (sale as any).products || [], // Mapeo a items en RPC
      p_device_info: sale.deviceInfo,
      p_notes: sale.notes || ''
    });

    if (error) this.handleError(error, 'SalesRepository.createOptimized');
  }

  async update(id: string, sale: Partial<Sale>): Promise<void> {
    const { error } = await (supabase.from('sales') as any)
      .update({
        is_reversed: sale.isReversed,
        reversal_reason: sale.reversalReason,
        reversed_at: (sale as any).reversedAt
      } as any)
      .eq('id', id);

    if (error) this.handleError(error, 'SalesRepository.update');
  }
}
