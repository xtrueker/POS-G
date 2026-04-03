import { Target, TrendingUp, RotateCcw, Heart, Trash2 } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface KpiLayerProps {
  isBeauty: boolean;
  beautyMetrics: { fulfillment: number; totalToday: number; loyaltyRate: number };
  engine: { globalMetrics: { forecastFulfillment: number; globalDeviation: number; globalRotation: number } };
}

export function KpiLayer({ isBeauty, beautyMetrics, engine }: KpiLayerProps) {
  const { isAdmin } = useRoleAccess();

  const kpis = [
    { 
      label: isBeauty ? 'EFICIENCIA DE AGENDA' : 'META DE HOY (VENDIDO)', 
      value: isBeauty ? `${beautyMetrics.fulfillment.toFixed(1)}%` : `${engine.globalMetrics.forecastFulfillment.toFixed(1)}%`, 
      sub: isBeauty ? `${beautyMetrics.totalToday} CITAS HOY` : 'Vendido vs Meta esperada', 
      icon: Target, 
      alert: isBeauty ? beautyMetrics.fulfillment < 50 : engine.globalMetrics.forecastFulfillment < 90,
      adminOnly: true
    },
    { 
      label: isBeauty ? 'DENSIDAD DE SERVICIOS' : 'RITMO DE VENTAS', 
      value: `${engine.globalMetrics.globalDeviation > 0 ? '+' : ''}${engine.globalMetrics.globalDeviation.toFixed(1)}%`, 
      sub: isBeauty ? 'Ocupación de especialistas' : 'Velocidad de venta actual', 
      icon: TrendingUp, 
      alert: Math.abs(engine.globalMetrics.globalDeviation) > 20,
      adminOnly: true
    },
    { 
      label: isBeauty ? 'VENTAS RETAIL' : 'EFICIENCIA DE STOCK', 
      value: `${engine.globalMetrics.globalRotation.toFixed(1)}%`, 
      sub: isBeauty ? 'Venta cruzada post-servicio' : 'Rotación de inventario', 
      icon: RotateCcw, 
      alert: engine.globalMetrics.globalRotation < 30,
      adminOnly: false
    },
    { 
      label: isBeauty ? 'RETENCIÓN' : 'CONTROL DE MERMA', 
      value: isBeauty ? `${beautyMetrics.loyaltyRate.toFixed(1)}%` : 'ÓPTIMO', 
      sub: isBeauty ? 'Clientes que regresan' : 'Detección de desperdicios', 
      icon: isBeauty ? Heart : Trash2, 
      alert: isBeauty ? beautyMetrics.loyaltyRate < 40 : false,
      adminOnly: false
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.filter(stat => isAdmin || !stat.adminOnly).map((stat, i) => (
        <div key={i} className={`p-8 border transition-all duration-500 ${stat.alert ? 'bg-zinc-900 text-white border-zinc-900 shadow-[0_10px_40px_rgba(0,0,0,0.15)] ring-1 ring-zinc-800' : 'bg-white dark:bg-zinc-950 border-zinc-200/50 dark:border-white/5 hover:border-zinc-900 dark:hover:border-zinc-100'}`}>
          <div className="flex items-center justify-between mb-6">
            <stat.icon className={`w-5 h-5 stroke-[1.5] ${stat.alert ? 'text-zinc-400' : 'text-zinc-500'}`} />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400">{stat.sub}</span>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${stat.alert ? 'text-zinc-500' : 'text-zinc-400'}`}>{stat.label}</p>
          <p className={`text-4xl font-light tracking-tight ${stat.alert ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
