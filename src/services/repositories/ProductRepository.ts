import { supabase } from '@/lib/supabase';
import { BaseRepository } from './BaseRepository';
import type { Product } from '@/types';

export class ProductRepository extends BaseRepository {
  private mapToDomain(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      price: Number(row.price || 0),
      cost: Number(row.cost || 0),
      stock: Number(row.stock || 0),
      category: row.category || 'General',
      minStock: Number(row.min_stock || 0),
      barcode: row.barcode || undefined,
      sku: row.sku || undefined,
      imageUrl: row.image_url || undefined,
      locationId: row.location_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by || undefined,
    };
  }

  async getAll(businessId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) this.handleError(error, 'ProductRepository.getAll');
    return (data || []).map(this.mapToDomain);
  }

  async create(businessId: string, product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { data, error } = await (supabase.from('products') as any)
      .insert({
        business_id: businessId,
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        category: product.category,
        min_stock: product.minStock,
        barcode: product.barcode,
        sku: product.sku,
        image_url: product.imageUrl
      })
      .select()
      .single();

    if (error) this.handleError(error, 'ProductRepository.create');
    return this.mapToDomain(data);
  }

  async update(id: string, product: Partial<Product>): Promise<void> {
    const { error } = await (supabase.from('products') as any)
      .update({
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        category: product.category,
        min_stock: product.minStock,
        barcode: product.barcode,
        sku: product.sku,
        image_url: product.imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) this.handleError(error, 'ProductRepository.update');
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) this.handleError(error, 'ProductRepository.delete');
  }
}
