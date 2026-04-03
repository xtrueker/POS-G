import { useState, useMemo, useEffect } from 'react';
import { 
  Search, ChefHat, 
  Activity, PackageCheck, 
  ArrowRight, CheckCircle, AlertTriangle, TrendingUp,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInventory } from '@/context/InventoryContext';
import { useLocation } from '@/context/LocationContext';
import { useStaff } from '@/context/StaffContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForecastEngine } from '@/hooks/useForecastEngine';

export default function Produccion() {
  const navigate = useNavigate();
  const { products, recipes, produceBatch } = useInventory();
  const { currentLocation } = useLocation();
  const { staff } = useStaff();
  const { user: authUser } = useAuth();
  const engine = useForecastEngine();

  // Security gate
  const isSuperAdmin = authUser?.email === 'andresguillen1128@gmail.com' || (authUser as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === authUser?.id), [staff, authUser]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';
  const hasAccess = isOwnerOrAdmin || currentStaff?.permissions?.includes('inventory' as any);

  useEffect(() => {
    if (staff.length > 0 && !hasAccess) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido al Centro de Producción', { id: 'security-block-prod' });
    }
  }, [staff, hasAccess, navigate]);
  useMemo(() => staff?.find(s => s.id === authUser?.id), [staff, authUser]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [batches, setBatches] = useState(1);
  const [isProducing, setIsProducing] = useState(false);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const product = products.find(p => p.id === r.finalProductId);
      return product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [recipes, products, searchTerm]);

  const handleProduce = async () => {
    if (!selectedRecipeId || !currentLocation || !authUser) {
      toast.error('Sesión o ubicación no válida');
      return;
    }

    setIsProducing(true);
    const result = await produceBatch(selectedRecipeId, batches, currentLocation.id, authUser?.id || '');
    setIsProducing(false);

    if (result.success) {
      toast.success(`Producción de ${batches} lote(s) completada`);
      setIsModalOpen(false);
      setSelectedRecipeId(null);
      setBatches(1);
    } else {
      toast.error(result.message);
    }
  };

  const selectedRecipe = useMemo(() => 
    recipes.find(r => r.id === selectedRecipeId),
  [recipes, selectedRecipeId]);

  const finalProduct = useMemo(() => 
    products.find(p => p.id === selectedRecipe?.finalProductId),
  [products, selectedRecipe]);

  const canProduce = useMemo(() => {
    if (!selectedRecipe) return false;
    return selectedRecipe.ingredients.every(ing => {
      const p = products.find(prod => prod.id === ing.ingredientProductId);
      return p && p.stock >= (ing.quantityRequired * batches);
    });
  }, [selectedRecipe, products, batches]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-900">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Control de Producción</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">TRANSFORMACIÓN DE MATERIA PRIMA A PRODUCTO FINAL</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-none items-center gap-2">
             <Activity className="w-3 h-3 text-zinc-400" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sede: {currentLocation?.name || 'Glob.'}</span>
           </div>
           <Button variant="outline" className="border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest rounded-none h-11 px-6 shadow-none">
             Ver Historial
           </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 stroke-[1.5] group-focus-within:text-zinc-900 transition-colors" />
            <Input 
              placeholder="BUSCAR FÓRMULA PARA PRODUCIR..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-12 h-14 rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest placeholder:text-zinc-400 font-medium" 
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {filteredRecipes.map((recipe) => {
              const mainProduct = products.find(p => p.id === recipe.finalProductId);
              return (
                <button 
                  key={recipe.id}
                  onClick={() => {
                    setSelectedRecipeId(recipe.id);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-between p-5 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 text-left group transition-all hover:border-zinc-900 dark:hover:border-zinc-100 glass-light dark:glass-dark border-glow-light dark:border-glow"
                >
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{mainProduct?.name}</h3>
                    <p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">Yield: {recipe.yieldQuantity} p/lote</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-200 transform group-hover:translate-x-1 transition-transform" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-zinc-900 dark:bg-zinc-100 p-8 rounded-none shadow-2xl relative overflow-hidden">
             <div className="relative z-10 space-y-4">
               <h3 className="text-white dark:text-zinc-900 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">KPI de Producción Hoy</h3>
               <div className="flex items-end justify-between">
                 <span className="text-4xl font-light text-white dark:text-zinc-900 tracking-tighter">142</span>
                 <TrendingUp className="text-green-400 w-6 h-6 mb-2" />
               </div>
               <p className="text-white/40 dark:text-black/40 text-[9px] font-bold uppercase tracking-widest">Unidades horneadas con éxito</p>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <ChefHat className="w-24 h-24 text-white dark:text-black" />
             </div>
           </div>

           <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 p-8 glass-light dark:glass-dark border-glow-light dark:border-glow space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 dark:text-zinc-100">Alertas de Forecast</h3>
              <div className="space-y-4">
                 {engine.actions.filter(a => a.type === 'increase_production' || a.type === 'reduce_production').length === 0 ? (
                   <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">NO HAY DESVIACIONES ACTUALES</p>
                 ) : (
                   engine.actions.filter(a => a.type === 'increase_production' || a.type === 'reduce_production').map(a => (
                     <div key={a.id} className="flex gap-4 items-start">
                       <div className={`w-1.5 h-1.5 rounded-none mt-1.5 ${a.type === 'increase_production' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                       <div className="space-y-1">
                         <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{a.productName} {a.suggestedValue ? `(${a.suggestedValue})` : ''}</p>
                         <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">{a.reason}</p>
                       </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
              <Activity className="w-4 h-4" />
              Ejecutar Orden de Producción
            </DialogTitle>
          </DialogHeader>

          <div className="p-10 space-y-8">
             <div className="flex items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-900">
               <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0">
                 <PackageCheck className="w-6 h-6 text-zinc-900 dark:text-zinc-100 stroke-[1.2]" />
               </div>
               <div className="space-y-1">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{finalProduct?.name}</h3>
                 <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Formula Base Vol: {selectedRecipe?.yieldQuantity} p/lote</p>
               </div>
             </div>

             <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4 block text-center">Cantidad de Lotes a Producir</label>
                  <div className="flex items-center justify-center gap-6">
                    <button onClick={() => setBatches(Math.max(1, batches - 1))} className="w-12 h-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xl hover:bg-zinc-50 transition-colors">-</button>
                    <span className="text-4xl font-light tracking-tighter w-16 text-center">{batches}</span>
                    <button onClick={() => setBatches(batches + 1)} className="w-12 h-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xl hover:bg-zinc-50 transition-colors">+</button>
                  </div>
               </div>

               <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border border-zinc-100 dark:border-zinc-800 space-y-4">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Verificación de Materia Prima</h4>
                  <div className="space-y-3">
                    {selectedRecipe?.ingredients.map((ing, i) => {
                      const p = products.find(prod => prod.id === ing.ingredientProductId);
                      const required = ing.quantityRequired * batches;
                      const hasStock = p && p.stock >= required;
                      return (
                        <div key={i} className="flex items-center justify-between text-[11px] font-medium uppercase tracking-widest">
                           <span className="text-zinc-500">{p?.name}</span>
                           <div className="flex items-center gap-3">
                             <span className="font-mono text-zinc-400">-{required} {p?.unit || 'un'}</span>
                             {hasStock ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
             </div>
          </div>

          <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-3 shrink-0">
             <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-none border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest px-8 h-12">Cancelar</Button>
             <Button 
               onClick={handleProduce} 
               disabled={!canProduce || isProducing}
               className="rounded-none bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 border-glow-light dark:border-glow text-[10px] font-bold uppercase tracking-widest px-12 h-12 flex items-center justify-center gap-3"
             >
               {isProducing ? 'Horneando...' : 'Iniciar Producción'}
               {!isProducing && <ArrowRight className="w-4 h-4" />}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
