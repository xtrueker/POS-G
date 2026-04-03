import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/context/BusinessContext';
import { useLocation } from '@/context/LocationContext';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';
import { ChefHat, Plus, Activity, PackageCheck, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function ProduccionBakery() {
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const { currentLocation } = useLocation();
  const { products } = useInventory();
  
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formularios
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [yieldQuantity, setYieldQuantity] = useState('1');
  const [ingredients, setIngredients] = useState<{ id: string, product_id: string, qty: string }[]>([]);

  // Batch
  const [isProducing, setIsProducing] = useState<string | null>(null);
  const [batchCount, setBatchCount] = useState('1');

  useEffect(() => {
    if (businessId) fetchRecipes();
  }, [businessId]);

  const fetchRecipes = async () => {
    if (!businessId) return;
    try {
      const supabaseApi = supabase as any;
      const { data, error } = await supabaseApi
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (*)
        `)
        .eq('business_id', businessId);
      
      if (error) throw error;
      setRecipes(data || []);
    } catch (e: any) {
      toast.error('Error cargando recetas: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
      if (!selectedProduct || !yieldQuantity || ingredients.length === 0) {
        return toast.error('Completa el producto final, cantidad y añade al menos un ingrediente.');
      }
      if (!businessId) return toast.error('Error de sesión: No hay negocio actual.');
      
      const supabaseApi = supabase as any;
      
      try {
        // 1. Crear receta
        const { data: recipeData, error: recipeError } = await supabaseApi.from('recipes').insert({
        business_id: businessId,
        final_product_id: selectedProduct,
        yield_quantity: parseFloat(yieldQuantity)
      }).select().single();

      if (recipeError) throw recipeError;
      if (!recipeData) throw new Error("No se devolvió ID de la receta creada");

      // 2. Insertar ingredientes
      const payloadStats = ingredients.map(ing => ({
        recipe_id: recipeData.id,
        ingredient_product_id: ing.product_id,
        quantity_required: parseFloat(ing.qty)
      }));

      const { error: ingError } = await supabaseApi.from('recipe_ingredients').insert(payloadStats);
      if (ingError) throw ingError;

      toast.success('Receta guardada exitosamente 🥖');
      setIsCreatingRecipe(false);
      fetchRecipes();
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message);
    }
  };

  const addIngredientRow = () => {
    setIngredients([...ingredients, { id: Math.random().toString(), product_id: '', qty: '' }]);
  };

  const handleProduceBatch = async (recipeId: string) => {
    if (!batchCount || isNaN(Number(batchCount))) return toast.error('Ingresa una cantidad válida de lotes');
    if (!currentLocation?.id) return toast.error('Debes pertenecer a una Sede para Hornaer');
    if (!user?.id) return toast.error('Sesión inválida.');
    
    try {
      toast.loading('Produciendo lote... Descontando materia prima y sumando producto...', { id: 'produce' });
      const supabaseApi = supabase as any;
      const { error } = await supabaseApi.rpc('produce_batch', {
        p_recipe_id: recipeId,
        p_batches: parseFloat(batchCount),
        p_location_id: currentLocation.id,
        p_staff_id: user.id
      });

      if (error) throw error;
      toast.success(`Producción de ${batchCount} lote(s) registrada con éxito.`, { id: 'produce' });
      setIsProducing(null);
      setBatchCount('1');
    } catch (e: any) {
      toast.error('Operación cancelada: ' + e.message, { id: 'produce' });
    }
  };

  if (loading) return <div>Cargando Producción...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><ChefHat className="text-orange-500"/> Fórmulas de Producción</h2>
          <p className="text-sm text-gray-500">Crea recetas para descontar insumos automáticamente al producir.</p>
        </div>
        <Button onClick={() => setIsCreatingRecipe(!isCreatingRecipe)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
          <Wrench className="w-4 h-4 mr-2" /> Nueva Receta
        </Button>
      </div>

      {isCreatingRecipe && (
        <form onSubmit={handleCreateRecipe} className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 shadow-inner space-y-4">
          <h3 className="font-bold text-orange-900 mb-4 text-sm uppercase tracking-widest">Detalles de la Receta</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold block mb-2">Producto Final a Producir</label>
              <select className="w-full h-10 px-3 rounded-lg border bg-white dark:bg-zinc-950" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
                <option value="">-- Selecciona el Pan/Postre --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold block mb-2">Cantidad a Producir por Lote</label>
              <Input type="number" step="0.01" value={yieldQuantity} onChange={e => setYieldQuantity(e.target.value)} min="0.01" required />
            </div>
          </div>

          <div className="pt-4 border-t border-orange-200">
            <h4 className="text-sm font-bold mb-3">Materia Prima (Lo que se descuenta del inventario)</h4>
            {ingredients.map((ing, idx) => (
              <div key={ing.id} className="flex gap-2 mb-2 items-center">
                <select className="flex-1 h-10 px-3 rounded-lg border bg-white dark:bg-zinc-950" value={ing.product_id} onChange={e => {
                  const newIngs = [...ingredients];
                  newIngs[idx].product_id = e.target.value;
                  setIngredients(newIngs);
                }} required>
                  <option value="">-- Insumo --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
                <Input type="number" step="0.01" placeholder="Ej: 0.5 (Kg o Unidades)" value={ing.qty} onChange={e => {
                  const newIngs = [...ingredients];
                  newIngs[idx].qty = e.target.value;
                  setIngredients(newIngs);
                }} required className="w-40" />
                <Button type="button" variant="destructive" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}><X className="w-4 h-4"/></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addIngredientRow} className="mt-2 text-sm border-dashed border-2 border-orange-300 text-orange-600 font-bold bg-white dark:bg-zinc-950">
              <Plus className="w-4 h-4 mr-2" /> Añadir Insumo
            </Button>
          </div>
          <div className="mt-4"><Button type="submit" className="w-full bg-black text-white font-bold h-12 rounded-xl">Guardar Receta</Button></div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map(recipe => {
          const finalProd = products.find(p => p.id === recipe.final_product_id);
          return (
            <div key={recipe.id} className="border border-gray-200 rounded-3xl p-5 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
               <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center opacity-50"><ChefHat className="text-orange-300 w-8 h-8 ml-2 mt-2" /></div>
               <h3 className="font-black text-lg text-gray-800 mb-1">{finalProd?.name || 'Producto Borrado'}</h3>
               <p className="text-xs text-green-600 font-bold uppercase mb-4 flex items-center gap-1"><PackageCheck className="w-3 h-3"/> Rinde: {recipe.yield_quantity} Unidades por Lote</p>
               
               <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b pb-1">Ingredientes Consumidos por Lote:</p>
                 <ul className="text-sm space-y-1">
                   {recipe.recipe_ingredients.map((ing: any) => {
                     const p = products.find(prod => prod.id === ing.ingredient_product_id);
                     return <li key={ing.id} className="text-gray-600 flex justify-between"><span>• {p?.name || '???'}</span><span className="font-medium text-red-500">- {ing.quantity_required}</span></li>
                   })}
                 </ul>
               </div>

               {isProducing === recipe.id ? (
                 <div className="flex gap-2">
                   <Input type="number" placeholder="Cantidad de Lotes" value={batchCount} onChange={e => setBatchCount(e.target.value)} className="font-bold border-2 border-orange-500" />
                   <Button onClick={() => handleProduceBatch(recipe.id)} className="bg-orange-500 hover:bg-orange-600 text-white font-black"><Activity className="w-4 h-4 mr-2"/> PRODUCIR</Button>
                   <Button variant="ghost" onClick={() => setIsProducing(null)}><X className="w-4 h-4"/></Button>
                 </div>
               ) : (
                 <Button onClick={() => { setIsProducing(recipe.id); setBatchCount('1'); }} className="w-full bg-slate-900 hover:bg-black text-white font-bold rounded-xl h-10">Producir Lote</Button>
               )}
            </div>
          )
        })}
      </div>
    </div>
  );
}

