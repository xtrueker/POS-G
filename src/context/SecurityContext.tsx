import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { generateId, getDeviceInfo } from '@/lib/utils';
import type { AuditLog, SecurityAlert } from '@/types';

interface SecurityContextType {
  auditLogs: AuditLog[];
  securityAlerts: SecurityAlert[];
  isOffline: boolean;
  isSyncing: boolean;
  logAudit: (log: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole' | 'deviceInfo'>) => Promise<void>;
  addAlert: (alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
  clearAlerts: (pin: string) => Promise<{ success: boolean; message: string }>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const logAudit = useCallback(async (log: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole' | 'deviceInfo'>) => {
    const entry: AuditLog = {
      ...log,
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId: user?.id ?? 'system',
      userName: (user as any)?.user_metadata?.full_name || user?.email || 'Sistema',
      userRole: (user as any)?.user_metadata?.role || 'owner',
      deviceInfo: getDeviceInfo(),
    };
    
    setAuditLogs(prev => [entry, ...prev]);
    
    if (!isOffline) {
      try {
        await supabase.from('audit_logs').insert(entry as any);
      } catch (err) {
        console.error('Error persisting audit log:', err);
      }
    }
  }, [user, isOffline]);

  const addAlert = useCallback(async (alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'isRead'>) => {
    const entry: SecurityAlert = {
      ...alert,
      id: generateId(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setSecurityAlerts(prev => [entry, ...prev]);
  }, []);

  const markAlertAsRead = useCallback(async (alertId: string) => {
    setSecurityAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  }, []);

  const clearAlerts = useCallback(async (_pin: string) => {
    // La verificación real se hace en el componente usando verifyOwnerPin
    // Aquí solo procedemos a limpiar el estado
    setSecurityAlerts([]);
    return { success: true, message: 'Alertas limpiadas' };
  }, []);

  return (
    <SecurityContext.Provider value={{ 
      auditLogs, securityAlerts, isOffline, isSyncing: false, 
      logAudit, addAlert, markAlertAsRead, clearAlerts 
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within a SecurityProvider');
  return context;
};
