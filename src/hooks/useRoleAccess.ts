import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';

/**
 * Hook centralizado para la gestión de accesos y permisos (Elite Beauty Edition).
 * Abstrae la lógica de roles para facilitar refactorizaciones y auditorías.
 */
export function useRoleAccess() {
  const { user } = useAuth();
  const { businessInfo } = useBusiness();

  const role = (user as any)?.user_metadata?.role || (user as any)?.role || 'staff';
  
  const isOwner = role === 'owner';
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = isOwner || isSuperAdmin;
  const isStaff = role === 'staff';

  const canAccessSettings = isAdmin;
  const canModifySecurity = isSuperAdmin;
  const canSeeFinancials = isAdmin;
  
  // Para industria de belleza
  const canConfigureLoyalty = isOwner;
  const canManageSupplies = isAdmin;

  return {
    role,
    isOwner,
    isSuperAdmin,
    isAdmin,
    isStaff,
    canAccessSettings,
    canModifySecurity,
    canSeeFinancials,
    canConfigureLoyalty,
    canManageSupplies,
    businessInfo
  };
}
