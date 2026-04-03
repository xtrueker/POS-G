import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { AppointmentRepository } from '@/repositories/AppointmentRepository';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import type { Appointment } from '@/types';


interface AppointmentContextType {
  appointments: Appointment[];
  loading: boolean;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<{ success: boolean; message: string }>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<{ success: boolean; message: string }>;
  deleteAppointment: (id: string) => Promise<{ success: boolean; message: string }>;
  refreshAppointments: () => Promise<void>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const { user } = useAuth();
  const repository = new AppointmentRepository();

  const refreshAppointments = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      // Get business_id from profile
      const { data: profile } = await (supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .maybeSingle() as any);
      
      const bId = (profile as any)?.business_id;
      if (!bId) { setLoading(false); return; }

      setBusinessId(bId);
      const data = await repository.getAll(bId);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    if (!businessId) return { success: false, message: 'No hay negocio asignado' };
    try {
      const newApt = await repository.create(businessId, appointment);
      setAppointments(prev => [...prev, newApt]);
      return { success: true, message: 'Cita agendada' };
    } catch (error) {
      console.error('Error adding appointment:', error);
      return { success: false, message: 'Error al agendar cita' };
    }
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>) => {
    try {
      await repository.update(id, appointment);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...appointment } : a));
      return { success: true, message: 'Cita actualizada' };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { success: false, message: 'Error al actualizar cita' };
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await repository.delete(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      return { success: true, message: 'Cita eliminada' };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return { success: false, message: 'Error al eliminar cita' };
    }
  };

  return (
    <AppointmentContext.Provider value={{ appointments, loading, addAppointment, updateAppointment, deleteAppointment, refreshAppointments }}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (context === undefined) throw new Error('useAppointments must be used within an AppointmentProvider');
  return context;
}
