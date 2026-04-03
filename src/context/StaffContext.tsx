import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { StaffRepository } from '@/services/repositories/StaffRepository';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import type { StaffMember, Permission } from '@/types';
import { createClient } from '@supabase/supabase-js';

interface StaffContextType {
  staff: StaffMember[];
  isLoading: boolean;
  addStaff: (staff: Omit<StaffMember, 'id' | 'createdAt' | 'lastLogin' | 'isActive'>) => Promise<{ success: boolean; message: string }>;
  updateStaff: (id: string, staff: Partial<StaffMember>) => Promise<{ success: boolean; message: string }>;
  deleteStaff: (id: string) => Promise<{ success: boolean; message: string }>;
  hasPermission: (permission: Permission) => boolean;
  verifyOwnerPin: (pin: string) => Promise<boolean>;
  refreshStaff: () => Promise<void>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const repository = new StaffRepository();

  const refreshStaff = useCallback(async () => {
    if (!user || !businessId) return;
    setIsLoading(true);
    try {
      const data = await repository.getAll(businessId);
      // Limpiar campos sensibles antes de guardar en estado
      const secureStaff = data.map(({ pin, ...s }: any) => s);
      setStaff(secureStaff);
    } catch (err) {
      console.error('Error refreshing staff:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    refreshStaff();
  }, [refreshStaff]);

  const hasPermission = (permission: Permission) => {
    if (!user) return false;
    const currentStaff = staff.find(s => s.id === user.id);
    if (!currentStaff) return false;
    return currentStaff.role === 'owner' || currentStaff.permissions.includes(permission);
  };

  const verifyOwnerPin = async (pin: string) => {
    if (!user) return false;
    
    const { data, error } = await (supabase as any).rpc('verify_owner_pin', {
      p_input_pin: pin
    });

    if (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }

    return !!data;
  };

  const addStaff = async (staffData: Omit<StaffMember, 'id' | 'createdAt' | 'lastLogin' | 'isActive'>) => {
    if (!user || !businessId) return { success: false, message: 'No auth' };

    // RBAC SECURITY: Solo dueños y admins pueden modificar equipo
    const currentReq = staff.find(s => s.id === user.id);
    if (currentReq?.role !== 'owner' && currentReq?.role !== 'admin' && currentReq?.role !== 'superadmin') {
      return { success: false, message: 'Acceso Denegado: Requiere nivel Administrador' };
    }

    try {
      // 1. Crear un Bypass de Auth Client para registrar al empleado sin desconectar al dueño
      const adminAuthClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
        import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key',
        {
          auth: {
            persistSession: false,     // Crítico: No destruir sesión local
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      // Usar PIN acolchado como contraseña secreta para cumplir reglas de Supabase (>6 chars)
      const safePassword = staffData.pin.length < 6 ? staffData.pin.padEnd(6, '0') : staffData.pin;

      const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
        email: staffData.email,
        password: safePassword,
        options: {
          data: {
            full_name: staffData.name,
            role: staffData.role,
            business_name: 'Cajero' // No tiene negocio propio
          }
        }
      });

      if (authError) {
        console.error('Error Auth SignUp Cajero:', authError);
        return { success: false, message: authError.message || 'Error registrando empleado en Auth' };
      }

      const newUserId = authData.user?.id;
      if (!newUserId) throw new Error("No se pudo obtener UUID del empleado nuevo");

      // 2. Inyectar el Profile nativo ahora que la Llave Foránea existe
      const member: StaffMember = {
        ...staffData,
        id: newUserId, // <- Inyectamos el ID orgánico devuelto por Auth
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      
      await repository.create(businessId, member);
      setStaff(prev => [...prev, member]);
      
      return { success: true, message: 'Colaborador creado con éxito' };
    } catch (err: any) {
      console.error('Stacktrace 400 Profile:', err);
      return { success: false, message: 'Error al forjar la identidad relacional del colaborador' };
    }
  };

  const updateStaff = async (id: string, member: Partial<StaffMember>) => {
    if (!user) return { success: false, message: 'No auth' };

    // RBAC SECURITY: Solo dueños y admins pueden modificar equipo
    const currentReq = staff.find(s => s.id === user.id);
    if (currentReq?.role !== 'owner' && currentReq?.role !== 'admin' && currentReq?.role !== 'superadmin') {
      return { success: false, message: 'Acceso Denegado: Intento de auto-escalamiento bloqueado.' };
    }

    try {
      await repository.update(id, member);
      setStaff(prev => prev.map(s => s.id === id ? { ...s, ...member } : s));
      return { success: true, message: 'Colaborador actualizado' };
    } catch (err) {
      return { success: false, message: 'Error al actualizar colaborador' };
    }
  };

  const deleteStaff = async (id: string) => {
    if (!user) return { success: false, message: 'No auth' };

    // RBAC SECURITY: Solo dueños y admins pueden modificar equipo
    const currentReq = staff.find(s => s.id === user.id);
    if (currentReq?.role !== 'owner' && currentReq?.role !== 'admin' && currentReq?.role !== 'superadmin') {
      return { success: false, message: 'Acceso Denegado: Requiere nivel Administrador' };
    }

    try {
      await repository.delete(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      return { success: true, message: 'Colaborador eliminado' };
    } catch (err) {
      return { success: false, message: 'Error al eliminar colaborador' };
    }
  };

  return (
    <StaffContext.Provider value={{ 
      staff, 
      isLoading, 
      addStaff, 
      updateStaff, 
      deleteStaff, 
      hasPermission, 
      verifyOwnerPin, 
      refreshStaff 
    }}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
};
