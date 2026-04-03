import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, ChefHat, 
  Scale, Info, Package, ChevronRight, Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { useStaff } from '@/context/StaffContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Recetas() {
  const { user } = useAuth();
  const { staff } = useStaff();
  const navigate = useNavigate();
  const { products, recipes, addRecipe } = useInventory();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';
  const hasAccess = isOwnerOrAdmin || currentStaff?.permissions?.includes('inventory' as any);

  useEffect(() => {
    if (staff.length > 0 && !hasAccess) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido al Módulo de Recetas', { id: 'security-block-recipes' });
    }
  }, [staff, hasAccess, navigate]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [yieldQuantity, setYieldQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<{ ingredientProductId: string; quantityRequired: number }[]>([]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      const product = products.find(p => p.id === r.finalProductId);
      return product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [recipes, products, searchTerm]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { ingredientProductId: '', quantityRequired: 0 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedProductId || ingredients.length === 0) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const result = await addRecipe({
      finalProductId: selectedProductId,
      yieldQuantity,
      notes,
      ingredients
    });

    if (result.success) {
      toast.success('Receta guardada exitosamente');
      setIsModalOpen(false);
      resetForm();
    } else {
      toast.error(result.message);
    }
  };

  const resetForm = () => {
    setSelectedProductId('');
    setYieldQuantity(1);
    setNotes('');
    setIngredients([]);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Biblioteca de Fórmulas</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">RECETARIO TÉCNICO Y COSTOS DE PRODUCCIÓN</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800 h-11 px-8 rounded-none shadow-xl transition-all text-xs font-bold uppercase tracking-widest border-none border-glow-light dark:border-glow">
          <Wrench className="w-4 h-4 mr-2" />
          Nueva Fórmula
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 stroke-[1.5] group-focus-within:text-zinc-900 transition-colors" />
        <Input 
          placeholder="BUSCAR POR PRODUCTO FINAL..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-12 h-14 rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest placeholder:text-zinc-400 font-medium" 
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => {
          const mainProduct = products.find(p => p.id === recipe.finalProductId);
          return (
            <div key={recipe.id} className="group bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 p-6 space-y-6 relative overflow-hidden transition-all hover:border-zinc-900 dark:hover:border-zinc-100 glass-light dark:glass-dark border-glow-light dark:border-glow">
              <div className="flex items-start justify-between relative z-10">
                <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-zinc-900 dark:text-zinc-100 stroke-[1.2]" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-1 relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 truncate">{mainProduct?.name}</h3>
                <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Rendimiento: {recipe.yieldQuantity} Unidades</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-zinc-100 dark:border-zinc-900 relative z-10">
                <label className="text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">Composición de Materia Prima</label>
                <div className="space-y-2">
                  {recipe.ingredients.slice(0, 3).map((ing, i) => {
                    const ingProd = products.find(p => p.id === ing.ingredientProductId);
                    return (
                      <div key={i} className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                        <span>{ingProd?.name}</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100">{ing.quantityRequired} {ingProd?.unit || 'un'}</span>
                      </div>
                    );
                  })}
                  {recipe.ingredients.length > 3 && (
                    <p className="text-[10px] text-zinc-400 italic font-medium pt-1">+{recipe.ingredients.length - 3} ingredientes más...</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between relative z-10">
                <div className="px-3 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-900 dark:text-zinc-100 tracking-widest uppercase">
                  Fórmula Activa
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl p-0 overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
              <Plus className="w-4 h-4" />
              Nueva Definición de Fórmula
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
            <div className="grid md:grid-cols-2 gap-10">
               <div className="space-y-6">
                 <div>
                   <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Producto Final</label>
                   <select 
                     className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-zinc-900 transition-colors"
                     value={selectedProductId}
                     onChange={(e) => setSelectedProductId(e.target.value)}
                   >
                     <option value="">Seleccionar Producto...</option>
                     {products.filter(p => !p.isIngredient).map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Rendimiento Estimado (Lote)</label>
                   <Input 
                     type="number" 
                     value={yieldQuantity} 
                     onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 0)}
                     className="h-12 border-zinc-200 dark:border-zinc-800 rounded-none bg-zinc-50 dark:bg-zinc-900"
                   />
                 </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Instrucciones / Notas Técnicas</label>
                  <textarea 
                    className="w-full h-[152px] p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-xs uppercase tracking-widest focus:outline-none focus:border-zinc-900 transition-colors resize-none"
                    placeholder="TEMPERATURA DE HORNEO, REQUERIMIENTOS ESPECIALES..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                   <Package className="w-4 h-4" />
                   Estructura de Insumos (Materia Prima)
                 </h4>
                 <Button variant="outline" size="sm" onClick={handleAddIngredient} className="text-[9px] uppercase font-bold tracking-widest rounded-none border-zinc-200 dark:border-zinc-800 h-8">
                   <Plus className="w-3 h-3 mr-1" /> Añadir Insumo
                 </Button>
               </div>

               <div className="space-y-3">
                 {ingredients.map((ing, idx) => (
                   <div key={idx} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-2 duration-300 bg-zinc-50 dark:bg-zinc-900 p-3 border border-zinc-100 dark:border-zinc-800">
                      <select 
                        className="flex-1 bg-white dark:bg-zinc-950 px-4 h-10 border border-zinc-200 dark:border-zinc-800 rounded-none text-[10px] font-bold uppercase tracking-widest outline-none focus:border-zinc-900"
                        value={ing.ingredientProductId}
                        onChange={(e) => {
                          const newIngs = [...ingredients];
                          newIngs[idx].ingredientProductId = e.target.value;
                          setIngredients(newIngs);
                        }}
                      >
                        <option value="">Insumo...</option>
                        {products.filter(p => p.isIngredient).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.unit || 'un'})</option>
                        ))}
                      </select>
                      <div className="w-32 relative">
                        <Input 
                          type="number"
                          placeholder="CANT."
                          className="h-10 pl-8 rounded-none border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-xs"
                          value={ing.quantityRequired}
                          onChange={(e) => {
                            const newIngs = [...ingredients];
                            newIngs[idx].quantityRequired = parseFloat(e.target.value) || 0;
                            setIngredients(newIngs);
                          }}
                        />
                        <Scale className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <button onClick={() => handleRemoveIngredient(idx)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 ))}
                 {ingredients.length === 0 && (
                   <div className="py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-900 flex flex-col items-center justify-center text-zinc-400 space-y-3">
                     <Info className="w-5 h-5 opacity-50" />
                     <p className="text-[10px] uppercase font-bold tracking-widest">No hay insumos vinculados a esta fórmula</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-3 shrink-0">
             <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-none border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest px-8 h-12">Cancelar</Button>
             <Button onClick={handleSave} className="rounded-none bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 border-glow-light dark:border-glow text-[10px] font-bold uppercase tracking-widest px-12 h-12">Guardar Fórmula</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
