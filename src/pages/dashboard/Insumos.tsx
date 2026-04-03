import { useState, useMemo, useEffect } from 'react';
import { 
  Package, Search, AlertTriangle,  
  Plus, ArrowUpRight, Scale, Filter,
  Trash2, Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { useStaff } from '@/context/StaffContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Insumos() {
  const { user } = useAuth();
  const { staff } = useStaff();
  const navigate = useNavigate();
  const { products } = useInventory();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';
  const hasAccess = isOwnerOrAdmin || currentStaff?.permissions?.includes('inventory' as any);

  useEffect(() => {
    if (staff.length > 0 && !hasAccess) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido al Módulo de Insumos', { id: 'security-block-insumos' });
    }
  }, [staff, hasAccess, navigate]);
  const [searchTerm, setSearchTerm] = useState('');

  const ingredients = useMemo(() => {
    return products.filter(p => p.isIngredient && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const stats = {
    totalValue: ingredients.reduce((sum, p) => sum + (p.stock * p.cost), 0),
    alertsCount: ingredients.filter(p => p.stock <= p.minStock).length,
    totalStockItems: ingredients.length
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-CO')}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-900">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Materia Prima</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">GESTIÓN TÉCNICA DE INSUMOS E INGREDIENTES</p>
        </div>
        <div className="flex items-center gap-3">
           <Button className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-none h-11 px-8 text-xs font-bold uppercase tracking-widest border-glow-light dark:border-glow">
             <Plus className="w-4 h-4 mr-2" />
             Nuevo Insumo
           </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 glass-light dark:glass-dark border-glow-light dark:border-glow">
           <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0">
             <Scale className="w-5 h-5 text-zinc-900 dark:text-zinc-100 stroke-[1.2]" />
           </div>
           <div>
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Valor Inventario</p>
             <p className="text-xl font-light text-zinc-900 dark:text-zinc-100 mt-1">{formatCurrency(stats.totalValue)}</p>
           </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 glass-light dark:glass-dark border-glow-light dark:border-glow">
           <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0">
             <AlertTriangle className={`w-5 h-5 ${stats.alertsCount > 0 ? 'text-red-500' : 'text-zinc-400'} stroke-[1.2]`} />
           </div>
           <div>
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Stock Crítico</p>
             <p className="text-xl font-light text-zinc-900 dark:text-zinc-100 mt-1">{stats.alertsCount} <span className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1">ÍTEMS</span></p>
           </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 glass-light dark:glass-dark border-glow-light dark:border-glow">
           <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0">
             <Package className="w-5 h-5 text-zinc-900 dark:text-zinc-100 stroke-[1.2]" />
           </div>
           <div>
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Variedad Insumos</p>
             <p className="text-xl font-light text-zinc-900 dark:text-zinc-100 mt-1">{stats.totalStockItems}</p>
           </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 stroke-[1.5] group-focus-within:text-zinc-900 transition-colors" />
          <Input 
            placeholder="BUSCAR INSUMO O CATEGORÍA..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-12 h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-[11px] uppercase tracking-widest placeholder:text-zinc-400" 
          />
        </div>
        <Button variant="outline" className="rounded-none border-zinc-200 dark:border-zinc-800 h-12 px-6 text-[10px] font-bold uppercase tracking-widest">
           <Filter className="w-3.5 h-3.5 mr-2" />
           Filtros
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden glass-light dark:glass-dark border-glow-light dark:border-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="px-8 py-5 text-left text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">INSUMO</th>
                <th className="px-8 py-5 text-left text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">CATEGORÍA</th>
                <th className="px-8 py-5 text-center text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">STOCK ACTUAL</th>
                <th className="px-8 py-5 text-right text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">COSTO UNIT.</th>
                <th className="px-8 py-5 text-right text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">VALOR TOTAL</th>
                <th className="px-8 py-5 text-center text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">ESTADO</th>
                <th className="px-8 py-5 text-center text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
              {ingredients.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0">
                         {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover p-1" /> : <Package className="w-4 h-4 text-zinc-400" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{p.name}</p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{p.sku || 'SIN SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-[10px] uppercase tracking-widest text-zinc-500">{p.category}</td>
                  <td className="px-8 py-5 text-center">
                     <span className={`font-mono text-[13px] font-medium ${p.stock <= p.minStock ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                       {p.stock} {p.unit || 'un'}
                     </span>
                  </td>
                  <td className="px-8 py-5 text-right font-mono text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{formatCurrency(p.cost)}</td>
                  <td className="px-8 py-5 text-right font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(p.stock * p.cost)}</td>
                  <td className="px-8 py-5 text-center">
                    {p.stock <= p.minStock ? (
                      <span className="inline-flex px-2 py-0.5 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 text-[8px] font-black tracking-[0.2em] text-red-600 uppercase">REPONER</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-[8px] font-black tracking-[0.2em] text-zinc-500 uppercase">ÓPTIMO</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-2 text-zinc-400 hover:text-orange-500 transition-colors"><ArrowUpRight className="w-3.5 h-3.5" /></button>
                      <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
