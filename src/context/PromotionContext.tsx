import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { PromotionRepository } from '../services/repositories/PromotionRepository';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import type { Promotion } from '@/types';

interface PromotionContextType {
  promotions: Promotion[];
  addPromotion: (promotion: Partial<Promotion>) => Promise<{ success: boolean; message: string }>;
  updatePromotion: (id: string, promotion: Partial<Promotion>) => Promise<{ success: boolean; message: string }>;
  deletePromotion: (id: string, pin: string) => Promise<{ success: boolean; message: string }>;
  validatePromoCode: (code: string, subtotal: number, items: { productId: string; category: string }[]) => { valid: boolean; message: string; discountAmount: number; promotion?: Promotion; requiresPin: boolean };
  incrementPromoUsage: (code: string) => Promise<void>;
  loading: boolean;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export function PromotionProvider({ children }: { children: ReactNode }) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { user } = useAuth();
  const repo = new PromotionRepository();

  const loadPromotions = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .maybeSingle() as any;
      
      const bId = profile?.business_id;
      if (!bId) { setLoading(false); return; }
      
      setBusinessId(bId);
      const data = await repo.getAll(bId);
      setPromotions(data);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const validatePromoCode = (code: string, subtotal: number, items: { productId: string; category: string }[]) => {
    const promotion = promotions.find(p => p.code.toUpperCase() === code.toUpperCase() && p.isActive);
    
    if (!promotion) return { valid: false, message: 'Código no válido o inactivo', discountAmount: 0, requiresPin: false };

    const now = new Date();
    if (new Date(promotion.startDate) > now) return { valid: false, message: 'La promoción aún no ha comenzado', discountAmount: 0, requiresPin: false };
    if (new Date(promotion.endDate) < now) return { valid: false, message: 'La promoción ha expirado', discountAmount: 0, requiresPin: false };

    if (promotion.minPurchase && subtotal < promotion.minPurchase) {
      return { valid: false, message: `Compra mínima requerida: $${promotion.minPurchase.toLocaleString()}`, discountAmount: 0, requiresPin: false };
    }

    if (promotion.usageLimit && (promotion.usageCount || 0) >= promotion.usageLimit) {
      return { valid: false, message: 'Límite de usos alcanzado', discountAmount: 0, requiresPin: false };
    }

    if (promotion.applicableCategories && promotion.applicableCategories.length > 0) {
      const hasApplicableCategory = items.some(item => promotion.applicableCategories?.includes(item.category));
      if (!hasApplicableCategory) return { valid: false, message: 'La promoción no aplica a estos productos', discountAmount: 0, requiresPin: false };
    }

    let discountAmount = 0;
    if (promotion.type === 'percentage') {
      discountAmount = (subtotal * promotion.value) / 100;
      if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) discountAmount = promotion.maxDiscount;
    } else {
      discountAmount = promotion.value;
    }

    return { valid: true, message: 'Código aplicado correctamente', discountAmount, promotion, requiresPin: promotion.requiresPin };
  };

  const addPromotion = async (promotion: Partial<Promotion>) => {
    if (!businessId) return { success: false, message: 'No hay negocio asignado' };
    try {
      const newPromo = await repo.save(businessId, { ...promotion, usageCount: 0 });
      setPromotions(prev => [newPromo, ...prev]);
      return { success: true, message: 'Promoción agregada exitosamente' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: `DB: ${error?.message || error?.details || 'Error desconocido'}` };
    }
  };

  const updatePromotion = async (id: string, promotion: Partial<Promotion>) => {
    if (!businessId) return { success: false, message: 'No hay negocio asignado' };
    try {
      const updated = await repo.save(businessId, { ...promotion, id });
      setPromotions(prev => prev.map(p => p.id === id ? updated : p));
      return { success: true, message: 'Promoción actualizada exitosamente' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: `DB: ${error?.message || error?.details || 'Error desconocido'}` };
    }
  };

  const deletePromotion = async (id: string, pin: string) => {
    if (pin !== '1234') return { success: false, message: 'PIN incorrecto' };
    try {
      await repo.delete(id);
      setPromotions(prev => prev.filter(p => p.id !== id));
      return { success: true, message: 'Promoción eliminada exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al eliminar promoción' };
    }
  };

  const incrementPromoUsage = async (code: string) => {
    if (!businessId) return;
    const promotion = promotions.find(p => p.code.toUpperCase() === code.toUpperCase());
    if (!promotion || !promotion.id) return;

    try {
      const newUsageCount = (promotion.usageCount || 0) + 1;
      const updated = await repo.save(businessId, { ...promotion, usageCount: newUsageCount });
      setPromotions(prev => prev.map(p => p.id === promotion.id ? updated : p));
    } catch (error) {
      console.error('Error incrementing promo usage', error);
    }
  };

  return (
    <PromotionContext.Provider value={{ 
      promotions, 
      addPromotion, 
      updatePromotion, 
      deletePromotion, 
      validatePromoCode,
      incrementPromoUsage, 
      loading 
    }}>
      {children}
    </PromotionContext.Provider>
  );
}

export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (!context) throw new Error('usePromotion must be used within a PromotionProvider');
  return context;
};
