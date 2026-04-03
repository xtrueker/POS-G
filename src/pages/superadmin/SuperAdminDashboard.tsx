import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Activity, Users, Building2, LogOut, ShieldAlert, ArrowRight, CalendarPlus, Ban, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalMetrics {
  totalBusinesses: number;
  totalUsers: number;
  totalSalesAmount: number;
  totalLocations: number;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const fetchGlobalData = async () => {
    try {
      setLoading(true);
      // Calls the SECURITY DEFINER function to bypass regular RLS
      const { data: mData, error: mError } = await supabase.rpc('get_global_saas_metrics');
      if (mError) throw mError;
      setMetrics(mData as GlobalMetrics);

      const { data: bData, error: bError } = await supabase.rpc('get_all_businesses_superadmin');
      if (bError) throw bError;
      setBusinesses(bData || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Acceso Global Denegado o Error al extraer métricas');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (businessId: string, businessName: string) => {
    try {
      const { error } = await (supabase.rpc as any)('impersonate_business', { target_business_id: businessId });
      if (error) throw error;
      
      toast.success(`Suplantando entidad: ${businessName}`);
      
      // Hard reload required to rebuild all React Contexts with the new business_id scope
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
      
    } catch (err: any) {
      console.error(err);
      toast.error('Falló la suplantación. Verifica logs.');
    }
  };

  const handleExtendSubscription = async (businessId: string, businessName: string) => {
    try {
      if (!confirm(`¿Dar 30 días de suscripción a ${businessName}?`)) return;
      const { error } = await (supabase.rpc as any)('extend_subscription', { target_business_id: businessId, days_to_add: 30 });
      if (error) throw error;
      toast.success(`${businessName} renovado por 30 días.`);
      fetchGlobalData(); // Recargar datos
    } catch (err: any) {
      console.error(err);
      toast.error('Error al renovar: ' + err.message);
    }
  };

  const handleSuspendSubscription = async (businessId: string, businessName: string) => {
    try {
      if (!confirm(`¿Estás seguro de SUSPENDER a ${businessName}? Esto bloqueará su cuenta inmediatamente.`)) return;
      const { error } = await (supabase.rpc as any)('suspend_subscription', { target_business_id: businessId });
      if (error) throw error;
      toast.error(`${businessName} suspendido.`);
      fetchGlobalData(); // Recargar datos
    } catch (err: any) {
      console.error(err);
      toast.error('Error al suspender: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased p-8 lg:p-12">
      <header className="flex justify-between items-center mb-12 border-b-2 border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-600" />
            Bóveda Global SaaS
          </h1>
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mt-2">Nivel de Acceso: Omnisciente / SuperAdmin</p>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-none transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Desconectar Sistema
        </button>
      </header>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-black border-2 border-white/10 p-6 rounded-none">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">GMV Acumulado SaaS</span>
              <Activity className="text-emerald-500 w-5 h-5" />
            </div>
            <div className="text-3xl font-black">${metrics.totalSalesAmount.toLocaleString('es-CO')}</div>
          </div>
          <div className="bg-black border-2 border-white/10 p-6 rounded-none">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Empresas Registradas</span>
              <Building2 className="text-white w-5 h-5" />
            </div>
            <div className="text-3xl font-black">{metrics.totalBusinesses}</div>
          </div>
          <div className="bg-black border-2 border-white/10 p-6 rounded-none">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Usuarios Globales</span>
              <Users className="text-white w-5 h-5" />
            </div>
            <div className="text-3xl font-black">{metrics.totalUsers}</div>
          </div>
          <div className="bg-black border-2 border-white/10 p-6 rounded-none">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Sedes Físicas Totales</span>
              <Building2 className="text-white w-5 h-5" />
            </div>
            <div className="text-3xl font-black">{metrics.totalLocations}</div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-red-600" /> Directorio de Inquilinos y Suscripciones
        </h2>
        <div className="bg-black border-2 border-white/10 rounded-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white/5 border-b-2 border-white/10">
                <tr>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px] text-gray-400">ID / Razón Social</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px] text-gray-400">Estado SaaS</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px] text-gray-400">Vencimiento</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px] text-gray-400 text-right">Acciones Financieras</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => {
                  const isExpired = !b.subscription_end_date || new Date(b.subscription_end_date) < new Date() || b.subscription_status !== 'active';
                  
                  return (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                       <p className="font-black text-sm">{b.name}</p>
                       <p className="font-mono text-[10px] text-gray-500">{b.id}</p>
                    </td>
                    <td className="p-4">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20"><Ban className="w-3 h-3" /> Expirado / Suspendido</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20"><Activity className="w-3 h-3" /> Activo (Plan 15K)</span>
                      )}
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
                         <Calendar className="w-4 h-4 text-gray-500" />
                         {b.subscription_end_date ? new Date(b.subscription_end_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Sin Fecha'}
                       </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleExtendSubscription(b.id, b.name)}
                          className="text-[10px] bg-[#2563eb]/10 text-[#2563eb] font-black uppercase tracking-widest px-3 py-2 border border-[#2563eb]/20 hover:bg-[#2563eb] hover:text-white transition-colors flex items-center gap-2"
                        >
                          <CalendarPlus className="w-3 h-3" /> +30 Días
                        </button>
                        <button 
                          onClick={() => handleSuspendSubscription(b.id, b.name)}
                          className="text-[10px] bg-red-500/10 text-red-500 font-black uppercase tracking-widest px-3 py-2 border border-red-500/20 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <Ban className="w-3 h-3" /> Suspender
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-2"></div>
                        <button 
                          onClick={() => handleImpersonate(b.id, b.name)}
                          className="text-[10px] bg-white text-black font-black uppercase tracking-widest px-4 py-2 hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          Control <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
