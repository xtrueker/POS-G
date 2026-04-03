import { supabase } from '@/lib/supabase';
import type { Appointment } from '@/types';

export class AppointmentRepository {
  async getAll(businessId: string): Promise<Appointment[]> {
    const { data, error } = await (supabase
      .from('appointments')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: true }) as any);

    if (error) throw error;
    return (data || []).map((item: any) => ({
      id: item.id,
      customerId: item.customer_id,
      customerName: item.customer_name,
      staffId: item.staff_id,
      staffName: item.staff_name,
      service: item.service,
      date: item.date,
      time: item.time,
      duration: item.duration,
      status: item.status,
      notes: item.notes,
      price: Number(item.price || 0),
      productId: item.product_id,
    }));
  }

  async create(businessId: string, appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const { data, error } = await (supabase
      .from('appointments')
      .insert({
        business_id: businessId,
        customer_id: appointment.customerId,
        customer_name: appointment.customerName,
        staff_id: appointment.staffId,
        staff_name: appointment.staffName,
        service: appointment.service,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes,
        price: appointment.price,
        product_id: appointment.productId,
      } as any)
      .select()
      .single() as any);

    if (error) throw error;
    return {
      id: data.id,
      ...appointment,
      price: Number(data.price || 0),
      productId: data.product_id,
    };
  }

  async update(id: string, appointment: Partial<Appointment>): Promise<void> {
    const { error } = await (supabase
      .from('appointments')
      .update({
        customer_id: appointment.customerId,
        customer_name: appointment.customerName,
        staff_id: appointment.staffId,
        staff_name: appointment.staffName,
        service: appointment.service,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes,
        price: appointment.price,
        product_id: appointment.productId,
      } as any)
      .eq('id', id) as any);

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
