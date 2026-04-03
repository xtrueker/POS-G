import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStaff } from '@/context/StaffContext';
import { toast } from 'sonner';

/**
 * Centralizes the security gate pattern used across 6+ pages.
 * Returns role information and redirects unauthorized users.
 */
export function useSecurityGate(options?: {
  requiredPermission?: string;
  redirectPath?: string;
  toastId?: string;
  toastMessage?: string;
}) {
  const { user } = useAuth();
  const { staff, hasPermission } = useStaff();
  const navigate = useNavigate();

  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';

  const hasAccess = options?.requiredPermission
    ? isOwnerOrAdmin || hasPermission(options.requiredPermission as any)
    : isOwnerOrAdmin;

  useEffect(() => {
    if (staff.length > 0 && !hasAccess) {
      navigate(options?.redirectPath || '/dashboard', { replace: true });
      toast.error(options?.toastMessage || 'Acceso Restringido: Rango insuficiente', {
        id: options?.toastId || 'security-block',
      });
    }
  }, [staff, hasAccess, navigate, options]);

  return { isSuperAdmin, currentStaff, isOwnerOrAdmin, hasAccess, user, staff };
}
