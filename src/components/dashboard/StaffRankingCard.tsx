import { Trophy, Star } from 'lucide-react';

interface StaffRankingProps {
  topStaff: any[];
  formatCurrency: (amount: number) => string;
}

export function StaffRankingCard({ topStaff, formatCurrency }: StaffRankingProps) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 p-8 glass-light dark:glass-dark group hover:border-zinc-900 transition-all">
      <h3 className="font-black uppercase tracking-widest text-[10px] text-zinc-900 dark:text-zinc-100 flex items-center gap-3 mb-8">
        <Trophy className="w-4 h-4 text-amber-500 fill-amber-500/20 stroke-[1.5]" /> 
        Ranking Elite (Ventas Mes)
      </h3>
      <div className="space-y-6">
        {topStaff.map((staff, i) => (
          <div key={staff.id} className="flex items-center justify-between group/item p-3 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-10 h-10 ${i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500'} flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-zinc-100 dark:ring-zinc-800`}>
                  {staff.name.charAt(0)}
                </div>
                {i === 0 && <Star className="w-3 h-3 text-amber-500 fill-amber-500 absolute -top-1 -right-1" />}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{staff.name}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{staff.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-light tracking-tight text-zinc-900 dark:text-zinc-100">{formatCurrency(staff.monthlySales)}</p>
              <div className="flex justify-end gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-2 h-2 ${s <= 4 ? 'text-amber-500 fill-amber-500' : 'text-zinc-200 dark:text-zinc-800'}`} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
