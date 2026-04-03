import { supabase } from '@/lib/supabase';

export class BaseRepository {
  protected async getBusinessId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await (supabase
        .from('profiles')
        .select('business_id')
        .eq('id', userId)
        .maybeSingle() as any);

      if (error) throw error;
      return (data as any)?.business_id || null;
    } catch (err) {
      console.error('Error fetching business_id:', err);
      return null;
    }
  }

  protected handleError(error: any, context: string) {
    console.error(`[Repository Error - ${context}]:`, error);
    throw error;
  }
}
