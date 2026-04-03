import { useState, useMemo, useEffect } from 'react';
import { 
  Search, AlertTriangle, Info, Shield, User, FileText, CheckCircle,
  AlertOctagon, TrendingUp, TrendingDown, DollarSign, Package,
  Users, Receipt, Settings, MapPin, Trash2, RotateCcw, ChefHat
} from 'lucide-react';
import { useSecurity } from '@/context/SecurityContext';
import { useStaff } from '@/context/StaffContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { AuditAction } from '@/types';

const ACTION_LABELS: Record<AuditAction, { label: string; icon: React.ReactNode; category: string }> = {
  USER_LOGIN: { label: 'Inicio de Sesión', icon: <User className="w-4 h-4" />, category: 'auth' },
  USER_LOGOUT: { label: 'Cierre de Sesión', icon: <User className="w-4 h-4" />, category: 'auth' },
  USER_CREATE: { label: 'Usuario Creado', icon: <User className="w-4 h-4" />, category: 'auth' },
  USER_UPDATE: { label: 'Usuario Actualizado', icon: <User className="w-4 h-4" />, category: 'auth' },
  USER_DELETE: { label: 'Usuario Eliminado', icon: <User className="w-4 h-4" />, category: 'auth' },
  SALE_CREATE: { label: 'Venta Creada', icon: <DollarSign className="w-4 h-4" />, category: 'sales' },
  SALE_REVERSE: { label: 'Venta Reversada', icon: <RotateCcw className="w-4 h-4" />, category: 'sales' },
  SALE_DELETE: { label: 'Venta Eliminada', icon: <Trash2 className="w-4 h-4" />, category: 'sales' },
  INVENTORY_CREATE: { label: 'Producto Creado', icon: <Package className="w-4 h-4" />, category: 'inventory' },
  INVENTORY_UPDATE: { label: 'Producto Actualizado', icon: <Package className="w-4 h-4" />, category: 'inventory' },
  INVENTORY_DELETE: { label: 'Producto Eliminado', icon: <Trash2 className="w-4 h-4" />, category: 'inventory' },
  CUSTOMER_CREATE: { label: 'Cliente Creado', icon: <Users className="w-4 h-4" />, category: 'customers' },
  CUSTOMER_UPDATE: { label: 'Cliente Actualizado', icon: <Users className="w-4 h-4" />, category: 'customers' },
  CUSTOMER_DELETE: { label: 'Cliente Eliminado', icon: <Trash2 className="w-4 h-4" />, category: 'customers' },
  INVOICE_CREATE: { label: 'Factura Creada', icon: <Receipt className="w-4 h-4" />, category: 'invoices' },
  INVOICE_UPDATE: { label: 'Factura Actualizada', icon: <Receipt className="w-4 h-4" />, category: 'invoices' },
  INVOICE_DELETE: { label: 'Factura Eliminada', icon: <Trash2 className="w-4 h-4" />, category: 'invoices' },
  INVOICE_PAY: { label: 'Factura Pagada', icon: <DollarSign className="w-4 h-4" />, category: 'invoices' },
  EXPENSE_CREATE: { label: 'Gasto Creado', icon: <TrendingDown className="w-4 h-4" />, category: 'expenses' },
  EXPENSE_UPDATE: { label: 'Gasto Actualizado', icon: <TrendingDown className="w-4 h-4" />, category: 'expenses' },
  EXPENSE_DELETE: { label: 'Gasto Eliminado', icon: <Trash2 className="w-4 h-4" />, category: 'expenses' },
  PROMOTION_CREATE: { label: 'Promoción Creada', icon: <TrendingUp className="w-4 h-4" />, category: 'promotions' },
  PROMOTION_APPLY: { label: 'Promoción Aplicada', icon: <CheckCircle className="w-4 h-4" />, category: 'promotions' },
  PROMOTION_UPDATE: { label: 'Promoción Actualizada', icon: <TrendingUp className="w-4 h-4" />, category: 'promotions' },
  PROMOTION_DELETE: { label: 'Promoción Eliminada', icon: <Trash2 className="w-4 h-4" />, category: 'promotions' },
  STAFF_CREATE: { label: 'Personal Creado', icon: <Users className="w-4 h-4" />, category: 'staff' },
  STAFF_UPDATE: { label: 'Personal Actualizado', icon: <Users className="w-4 h-4" />, category: 'staff' },
  STAFF_DELETE: { label: 'Personal Eliminado', icon: <Trash2 className="w-4 h-4" />, category: 'staff' },
  LOCATION_CHANGE: { label: 'Cambio de Ubicación', icon: <MapPin className="w-4 h-4" />, category: 'settings' },
  SETTINGS_UPDATE: { label: 'Configuración Actualizada', icon: <Settings className="w-4 h-4" />, category: 'settings' },
  REPORT_EXPORT: { label: 'Reporte Exportado', icon: <FileText className="w-4 h-4" />, category: 'reports' },
  SECURITY_ALERT: { label: 'Alerta de Seguridad', icon: <Shield className="w-4 h-4" />, category: 'security' },
  ANOMALY_DETECTED: { label: 'Anomalía Detectada', icon: <AlertOctagon className="w-4 h-4" />, category: 'security' },
  PRODUCTION_CREATE: { label: 'Producción Iniciada', icon: <ChefHat className="w-4 h-4 text-orange-500" />, category: 'bakery' },
  WASTE_CREATE: { label: 'Merma Registrada', icon: <Trash2 className="w-4 h-4 text-red-500" />, category: 'bakery' },
};

const SEVERITY_COLORS = {
  info: { bg: 'bg-zinc-50 dark:bg-zinc-900', text: 'text-zinc-500', border: 'border-zinc-100 dark:border-zinc-900', icon: <Info className="w-3.5 h-3.5 stroke-[1.5]" /> },
  warning: { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200 dark:border-zinc-800', icon: <AlertTriangle className="w-3.5 h-3.5 stroke-[1.5]" /> },
  critical: { bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-900', icon: <AlertOctagon className="w-3.5 h-3.5 stroke-[1.5]" /> },
};

export default function Auditoria() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { auditLogs, securityAlerts, markAlertAsRead, clearAlerts } = useSecurity();
  const { hasPermission, verifyOwnerPin, staff } = useStaff();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  useEffect(() => {
    if (staff.length > 0 && !isSuperAdmin && !hasPermission('audit.view')) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido: Nivel de Auditoría Insuficiente', { id: 'security-block-audit' });
    }
  }, [staff, isSuperAdmin, hasPermission, navigate]);

  const [activeTab, setActiveTab] = useState<'logs' | 'alerts'>('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  if (!isSuperAdmin && !hasPermission('audit.view')) {
    return null; // Return null while redirecting
  }

  const filteredLogs = useMemo(() => auditLogs.filter(log =>
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase())
  ), [auditLogs, searchTerm]);

  const filteredAlerts = useMemo(() => securityAlerts.filter(alert =>
    alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.message.toLowerCase().includes(searchTerm.toLowerCase())
  ), [securityAlerts, searchTerm]);

  const handleClearAlerts = async () => {
    const pin = prompt('Ingrese PIN de propietario para limpiar alertas:');
    if (pin) {
      setIsClearing(true);
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        const result = await clearAlerts(pin);
        if (result.success) {
          toast.success('Alertas eliminadas');
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('PIN incorrecto');
      }
      setIsClearing(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'INSTANTE';
    if (mins < 60) return `${mins}M`;
    if (mins < 1440) return `${Math.floor(mins / 60)}H`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-8 border-b border-zinc-100 dark:border-zinc-900 pb-8">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Centro de Auditoría</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-[0.1em] font-bold mt-2">Trazabilidad técnica y vigilancia de integridad</p>
        </div>
        <div className="flex bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 p-1 rounded-none shadow-sm">
          <button onClick={() => setActiveTab('logs')} className={`px-8 py-3 rounded-none text-[10px] font-bold tracking-[0.2em] transition-all uppercase ${activeTab === 'logs' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>REGISTROS DE EVENTOS</button>
          <button onClick={() => setActiveTab('alerts')} className={`px-8 py-3 rounded-none text-[10px] font-bold tracking-[0.2em] transition-all uppercase ${activeTab === 'alerts' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}>ALERTAS CRÍTICAS ({securityAlerts.filter(a => !a.isRead).length})</button>
        </div>
      </div>

      <div className="relative border-b border-zinc-100 dark:border-white/5 pb-8">
        <Search className="absolute left-0 top-0 mt-3.5 w-4 h-4 text-zinc-300 dark:text-zinc-500 stroke-[2.5]" />
        <Input 
          placeholder={`REASTREAR FILTRADO EN ${activeTab === 'logs' ? 'NÚCLEO DE EVENTOS' : 'PROTOCOLOS DE RIESGO'}...`} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-12 h-10 border-none bg-transparent rounded-none focus-visible:ring-0 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-200 dark:placeholder:text-zinc-800" 
        />
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 rounded-none overflow-hidden shadow-none glass-light dark:glass-dark border-glow-light dark:border-glow">
        {activeTab === 'logs' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-white/5">
                  <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Temporalidad</th>
                  <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Identidad</th>
                  <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Acción</th>
                  <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Descripción del Suceso</th>
                  <th className="px-8 py-6 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Impacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/50 dark:divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                    <td className="px-8 py-6 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">{formatTimeAgo(log.timestamp)}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-none flex items-center justify-center text-sm font-light shadow-xl">
                          {log.userName.charAt(0)}
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100">{log.userName}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest leading-none">
                        <span className="p-2 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border border-zinc-100 dark:border-white/5 group-hover:border-zinc-900 dark:group-hover:border-white group-hover:text-zinc-900 dark:group-hover:text-white transition-all shadow-sm">{ACTION_LABELS[log.action]?.icon}</span>
                        <span className="truncate max-w-[120px]">{ACTION_LABELS[log.action]?.label || log.action}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[10px] text-zinc-500 dark:text-zinc-100/60 font-medium tracking-widest max-w-sm truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors italic">"{log.description}"</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-2 rounded-none text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm ${SEVERITY_COLORS[log.severity].bg} ${SEVERITY_COLORS[log.severity].text} ${SEVERITY_COLORS[log.severity].border} ${log.severity === 'critical' ? 'dark:bg-white dark:text-zinc-950 dark:border-white shadow-red-600/10' : ''}`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 space-y-6">
              {filteredAlerts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {filteredAlerts.map(alert => (
                    <div key={alert.id} className={`p-10 border rounded-none flex items-start gap-10 transition-all duration-500 glass-light dark:glass-dark ${alert.isRead ? 'border-zinc-100/50 dark:border-white/5 opacity-40 grayscale' : 'border-zinc-900 dark:border-white shadow-[0_0_50px_rgba(0,0,0,0.2)]'}`}>
                      <div className={`p-5 rounded-none shadow-2xl ${alert.severity === 'critical' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-glow' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'}`}>
                        <AlertTriangle className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start border-b border-zinc-100/50 dark:border-white/5 pb-4">
                          <div>
                            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-1">{alert.severity === 'critical' ? 'INCIDENCIA CRÍTICA' : 'NOTIFICACIÓN DE SEGURIDAD'}</p>
                            <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-zinc-900 dark:text-zinc-100">{alert.title}</h3>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">{formatTimeAgo(alert.timestamp)}</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase leading-relaxed tracking-wide">{alert.message}</p>
                        {!alert.isRead && (
                          <button 
                            onClick={() => markAlertAsRead(alert.id)} 
                            className="mt-8 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all shadow-xl"
                          >
                            MARCAR COMO GESTIONADO
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center border-2 border-dashed border-zinc-100/50 dark:border-white/5 glass-light dark:glass-dark">
                  <Shield className="w-16 h-16 mx-auto mb-8 text-zinc-100 dark:text-zinc-900 stroke-[1]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-300 dark:text-zinc-700">INTEGRIDAD DEL SISTEMA: 100%</p>
                </div>
              )}
              
              {securityAlerts.length > 0 && (
                <div className="pt-16 border-t border-zinc-100/50 dark:border-white/5 flex justify-center">
                  <Button 
                    onClick={handleClearAlerts} 
                    disabled={isClearing}
                    variant="ghost" 
                    className={`h-20 px-16 rounded-none text-[10px] font-bold uppercase tracking-[0.3em] transition-all ${isClearing ? 'text-zinc-500 cursor-not-allowed opacity-50' : 'text-zinc-300 dark:text-zinc-700 hover:text-red-600 dark:hover:text-red-500 hover:bg-transparent'}`}
                  >
                    {isClearing ? 'TRANSCRIPCIÓN EN CURSO...' : 'EJECUTAR PURGA DE HISTORIAL'}
                  </Button>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}


