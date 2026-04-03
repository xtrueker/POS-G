import { useState, useMemo, useEffect } from 'react';
import { Target, Zap, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { useSales } from '@/context/SalesContext';
import { useStaff } from '@/context/StaffContext';
import { useAppointments } from '@/context/AppointmentContext';
import { useForecastEngine } from '@/hooks/useForecastEngine';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { KpiLayer } from '@/components/dashboard/KpiLayer';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { StaffRankingCard } from '@/components/dashboard/StaffRankingCard';
import { toast } from 'sonner';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value?: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 p-3 shadow-xl border border-zinc-800">
        <p className="text-sm uppercase tracking-widest font-bold text-zinc-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[10px] font-black text-white uppercase tracking-wider">
            {entry.name}: {entry.name.includes('REAL') ? '$' : ''}{entry.value?.toLocaleString('es-CO')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { isAdmin, businessInfo } = useRoleAccess();
  const { locations, currentLocation, setCurrentLocation } = useLocation();
  const { sales } = useSales();
  const { staff } = useStaff();
  const { appointments } = useAppointments();
  const engine = useForecastEngine();

  const [currentTime, setCurrentTime] = useState(new Date());
  const isBeauty = businessInfo?.vertical === 'beauty';

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const beautyMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayApts = appointments.filter(a => a.date === today);
    const completed = todayApts.filter(a => a.status === 'completed').length;
    const total = todayApts.length;
    const fulfillment = total > 0 ? (completed / total) * 100 : 0;

    const appointmentsByCustomer = appointments.reduce((acc: any, curr) => {
      if (curr.status === 'completed' && curr.customerId) {
        acc[curr.customerId] = (acc[curr.customerId] || 0) + 1;
      }
      return acc;
    }, {});
    
    const totalWithApts = Object.keys(appointmentsByCustomer).length;
    const recurring = Object.values(appointmentsByCustomer).filter((count: any) => count > 1).length;
    const loyalty = totalWithApts > 0 ? (recurring / totalWithApts) * 100 : 0;

    return { fulfillment, totalToday: total, loyaltyRate: loyalty };
  }, [appointments]);

  const topStaff = useMemo(() => {
    const staffMap = new Map<string, { id: string; name: string; revenue: number; services: number; role?: string; monthlySales: number }>();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    sales.forEach(sale => {
      const saleDate = new Date(sale.id.startsWith('sale_') ? parseInt(sale.id.split('_')[1]) : Date.now());
      if (saleDate.getMonth() !== currentMonth || saleDate.getFullYear() !== currentYear) return;

      sale.products.forEach(item => {
        if (item.staffId) {
          const staffMember = staff.find(s => s.id === item.staffId);
          const current = staffMap.get(item.staffId) || { id: item.staffId, name: item.staffName || 'ANÓNIMO', revenue: 0, services: 0, role: staffMember?.role, monthlySales: 0 };
          current.revenue += item.price * item.quantity;
          current.services += item.quantity;
          current.monthlySales = current.revenue;
          staffMap.set(item.staffId, current);
        }
      });
    });

    return Array.from(staffMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales, staff]);

  const chartData = useMemo(() => [
    { name: '08:00', real: engine.globalMetrics.totalActualNow * 0.2, forecast: engine.globalMetrics.totalExpectedNow * 0.25 },
    { name: '10:00', real: engine.globalMetrics.totalActualNow * 0.5, forecast: engine.globalMetrics.totalExpectedNow * 0.5 },
    { name: '12:00', real: engine.globalMetrics.totalActualNow * 0.8, forecast: engine.globalMetrics.totalExpectedNow * 0.7 },
    { name: '14:00', real: engine.globalMetrics.totalActualNow, forecast: engine.globalMetrics.totalExpectedNow },
    { name: '16:00', real: null, forecast: engine.globalMetrics.totalExpectedNow * 1.2 },
    { name: '18:00', real: null, forecast: engine.globalMetrics.totalExpectedNow * 1.5 },
    { name: '20:00', real: null, forecast: engine.globalMetrics.totalExpectedNow * 1.8 },
  ], [engine.globalMetrics.totalActualNow, engine.globalMetrics.totalExpectedNow]);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-CO')}`;

  return (
    <div className="space-y-12">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-8 border-b border-zinc-100 dark:border-zinc-900 pb-12">
        <div>
          <h1 className="text-3xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase flex items-center gap-4">
            <Target className="w-6 h-6 text-zinc-500 stroke-[1]" /> Intelligence HUB
          </h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mt-4 border-l-2 border-zinc-900 dark:border-white pl-4">
            {currentTime.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — EN VIVO
          </p>
        </div>
        <div className="flex items-center gap-6">
           <select
            value={currentLocation?.id || ''}
            onChange={e => { const loc = locations.find(l => l.id === e.target.value); setCurrentLocation(loc || null); }}
            className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-[10px] font-black tracking-widest uppercase focus:border-zinc-900 outline-none transition-all disabled:opacity-50 shadow-sm"
            disabled={!isAdmin}
          >
            {isAdmin && <option value="">TODAS LAS SEDES (GLOBAL)</option>}
            {(isAdmin ? locations : locations.filter(l => l.id === currentLocation?.id)).map(loc => 
              <option key={loc.id} value={loc.id}>{loc.name.toUpperCase()}</option>
            )}
          </select>
        </div>
      </div>

      {/* KPI LAYER MODULAR */}
      <KpiLayer isBeauty={isBeauty} beautyMetrics={beautyMetrics} engine={engine} />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* CHART LAYER MODULAR */}
        {isAdmin && <PerformanceChart chartData={chartData} CustomTooltip={CustomTooltip} />}

        {/* SUGGESTIONS & STAFF RANKING */}
        <div className={`flex flex-col gap-8 ${isAdmin ? '' : 'lg:col-span-3'}`}>
          {/* SUGGESTIONS */}
          <div className="flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-[10px] text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                <Zap className="w-4 h-4 text-zinc-900 dark:text-white fill-zinc-900 dark:fill-white stroke-[1.5]" />
                Asistente Predictivo
              </h3>
              <span className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-black px-3 py-1 uppercase tracking-tighter">{engine.actions.length} ALERTAS</span>
            </div>
            <div className="p-0 max-h-[400px] overflow-y-auto no-scrollbar divide-y divide-zinc-100 dark:divide-zinc-900">
              {engine.actions.length === 0 ? (
                <div className="p-12 text-center text-zinc-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-4 stroke-[1] text-zinc-200" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sin acciones requeridas</p>
                </div>
              ) : (
                engine.actions.map((action, i) => (
                  <div key={i} className="p-8 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-2 h-2 rounded-full ${action.priority === 'high' ? 'bg-zinc-900 dark:bg-white animate-pulse' : 'bg-zinc-200'}`} />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{action.type}</p>
                    </div>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-loose mb-2 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{action.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* STAFF RANKING MODULAR */}
          <StaffRankingCard topStaff={topStaff} formatCurrency={formatCurrency} />
        </div>
      </div>
    </div>
  );
}
