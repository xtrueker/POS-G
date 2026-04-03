import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { BusinessInfo } from '@/types';

interface BusinessContextType {
  businessInfo: BusinessInfo | null;
  businessId: string | null;
  updateBusinessInfo: (info: Partial<BusinessInfo>) => Promise<{ success: boolean; message: string }>;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadBusinessInfo();
    }
  }, [user]);

  const loadBusinessInfo = async () => {
    try {
      // Step 1: Get the profile to find business_id
      const { data: profile, error: profileError } = await (supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user?.id ?? '')
        .maybeSingle() as any);

      if (profileError) throw profileError;
      if (!(profile as any)?.business_id) {
        setLoading(false);
        return;
      }
      
      const bId = (profile as any).business_id;
      setBusinessId(bId);

      // Step 2: Get the business details
      const { data: bus, error: bizError } = await (supabase
        .from('businesses')
        .select('*')
        .eq('id', (profile as any).business_id)
        .maybeSingle() as any);

      if (bizError) throw bizError;

      if (bus) {
        setBusinessInfo({
          id: (bus as any).id,
          legalName: (bus as any).legal_name || '',
          nit: (bus as any).nit || '',
          verificationDigit: (bus as any).verification_digit || 0,
          address: (bus as any).address || '',
          city: (bus as any).city || '',
          department: (bus as any).department || '',
          phone: (bus as any).phone || '',
          email: (bus as any).email || '',
           regimen: (bus as any).regimen as any,
          resolutionNumber: (bus as any).resolution_number || '',
          prefix: (bus as any).prefix || '',
          vertical: (bus as any).vertical || 'general',
          settings: (bus as any).settings || {},
          subscriptionEndDate: (bus as any).subscription_end_date,
          subscriptionStatus: (bus as any).subscription_status,
        });
      }
    } catch (error) {
      console.error('Error loading business info:', error);
    } finally {
      setLoading(false);
    }
  };


  const updateBusinessInfo = async (info: Partial<BusinessInfo>) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };
    try {
      const updatePayload: any = {};
      if (info.legalName !== undefined) updatePayload.legal_name = info.legalName || null;
      if (info.nit !== undefined) updatePayload.nit = info.nit || null;
      if (info.verificationDigit !== undefined) updatePayload.verification_digit = info.verificationDigit;
      if (info.address !== undefined) updatePayload.address = info.address || null;
      if (info.city !== undefined) updatePayload.city = info.city || null;
      if (info.department !== undefined) updatePayload.department = info.department || null;
      if (info.phone !== undefined) updatePayload.phone = info.phone || null;
      if (info.email !== undefined) updatePayload.email = info.email || null;
      if (info.regimen !== undefined) updatePayload.regimen = info.regimen;
      if (info.resolutionNumber !== undefined) updatePayload.resolution_number = info.resolutionNumber || null;
      if (info.prefix !== undefined) updatePayload.prefix = info.prefix || null;
      if (info.vertical !== undefined) updatePayload.vertical = info.vertical;
      if (info.settings !== undefined) updatePayload.settings = info.settings;

      const { error } = await (supabase.from('businesses') as any)
        .update(updatePayload)
        .eq('id', businessId);

      if (error) throw error;

      setBusinessInfo(prev => prev ? { ...prev, ...info } : (info as BusinessInfo));
      return { success: true, message: 'Información actualizada exitosamente' };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: 'Error al actualizar información: ' + error.message };
    }
  };

  return (
    <BusinessContext.Provider value={{ businessInfo, businessId, updateBusinessInfo, loading }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
};
