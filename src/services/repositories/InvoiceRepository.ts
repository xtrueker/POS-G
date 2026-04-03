import { supabase } from '@/lib/supabase';
import { BaseRepository } from './BaseRepository';
import type { Invoice } from '@/types';

export class InvoiceRepository extends BaseRepository {
  async getAll(businessId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(name)')
      .eq('business_id', businessId)
      .order('issue_date', { ascending: false });

    if (error) this.handleError(error, 'InvoiceRepository.getAll');
    return (data || []).map(this.mapToInvoice);
  }

  async create(businessId: string, invoice: Invoice): Promise<void> {
    const { error } = await (supabase.from('invoices') as any).insert({
      id: invoice.id || crypto.randomUUID(), // If provided by sale, use it. Otherwise random.
      business_id: businessId,
      invoice_number: invoice.invoiceNumber,
      customer_id: invoice.customerId,
      total: invoice.total,
      status: invoice.status,
      due_date: invoice.dueDate,
      issue_date: invoice.issueDate,
      items: invoice.items,
      cufe: invoice.cufe,
      dian_status: invoice.dianStatus
    });

    if (error) this.handleError(error, 'InvoiceRepository.create');
  }

  async update(id: string, invoice: Partial<Invoice>): Promise<void> {
    const { error } = await (supabase.from('invoices') as any)
      .update({
        status: invoice.status,
        total: invoice.total,
        due_date: invoice.dueDate,
        dian_status: invoice.dianStatus
      } as any)
      .eq('id', id);

    if (error) this.handleError(error, 'InvoiceRepository.update');
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) this.handleError(error, 'InvoiceRepository.delete');
  }

  private mapToInvoice(data: any): Invoice {
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      customerId: data.customer_id,
      customerName: data.customer?.name || data.customer_name || 'Cliente sin nombre',
      total: Number(data.total),
      status: data.status,
      issueDate: data.issue_date,
      dueDate: data.due_date,
      items: data.items || [],
      cufe: data.cufe,
      dianStatus: data.dian_status,
      isEditable: data.status === 'draft' || data.status === 'sent',
      subtotal: data.subtotal || data.total,
      discountAmount: data.discount_amount || 0,
      tax: data.tax || 0
    };
  }
}
