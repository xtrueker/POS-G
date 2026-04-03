import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface ChartProps {
  chartData: any[];
  CustomTooltip: React.FC<any>;
}

export function PerformanceChart({ chartData, CustomTooltip }: ChartProps) {
  return (
    <div className="lg:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 p-8 glass-light dark:glass-dark group hover:border-zinc-900 transition-all">
      <h3 className="font-black uppercase tracking-widest text-[10px] text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-8">
        <BarChart3 className="w-4 h-4 text-zinc-500 stroke-[1.5]" /> 
        Rendimiento Histórico vs Objetivos
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(113, 113, 122, 0.2)" />
            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#71717a', fontWeight: 600, letterSpacing: '0.1em'}} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 10, fill: '#71717a', fontWeight: 600, letterSpacing: '0.1em'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.15em', paddingTop: '30px'}} />
            <Line type="monotone" name="REALIZADO" dataKey="real" stroke="#18181b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" name="OBJETIVO (META)" dataKey="forecast" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
