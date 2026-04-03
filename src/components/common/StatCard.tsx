import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ElementType;
  onClick?: () => void;
  color?: string;
}

export function StatCard({ title, value, change, isPositive, icon: Icon, onClick, color = 'bg-zinc-50 dark:bg-zinc-900' }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 hover:border-zinc-900 transition-all group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 group-hover:text-zinc-900 dark:text-zinc-100 transition-colors">{title}</p>
          <p className="text-3xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
          <div className={`flex items-center gap-2 mt-5 text-[11px] font-bold uppercase tracking-[0.1em] ${isPositive ? 'text-zinc-500' : 'text-zinc-500'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3 stroke-[1.5]" /> : <TrendingDown className="w-3 h-3 stroke-[1.5]" />}
            <span>{change}</span>
          </div>
        </div>
        <div className={`w-12 h-12 ${color} border border-zinc-100 dark:border-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all`}>
          <Icon className="w-5 h-5 stroke-[1.5]" />
        </div>
      </div>
    </div>
  );
}


