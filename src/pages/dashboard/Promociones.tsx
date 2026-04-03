import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, Percent, Gift, Calendar, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePromotion } from '@/context/PromotionContext';
import { useAuth } from '@/context/AuthContext';
import { useStaff } from '@/context/StaffContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PromotionFormData {
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  code: string;
  usageLimit?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
}

const CATEGORIES = ['Panadería', 'Bebidas', 'Repostería', 'Lácteos', 'Snacks'];

export default function Promociones() {
  const { user } = useAuth();
  const { staff } = useStaff();
  const navigate = useNavigate();
  const { promotions, addPromotion, updatePromotion, deletePromotion } = usePromotion();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';

  useEffect(() => {
    if (staff.length > 0 && !isOwnerOrAdmin) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido: Solo personal administrativo puede gestionar promociones', { id: 'security-block-promo' });
    }
  }, [staff, isOwnerOrAdmin, navigate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    name: '',
    type: 'percentage',
    value: 10,
    minPurchase: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    code: '',
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filteredPromotions = promotions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePromotionsCount = promotions.filter(p => 
    p.isActive && new Date(p.endDate) > new Date()
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const promotionData = {
      ...formData,
      applicableCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
    };
    
    let result;
    if (editingPromotion) {
      result = await updatePromotion(editingPromotion, { ...promotionData, requiresPin: false });
    } else {
      result = await addPromotion({ ...promotionData, isActive: true, requiresPin: false });
    }
    
    if (result.success) {
      toast.success(result.message);
      resetForm();
      setShowModal(false);
    } else {
      toast.error(result.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      code: '',
    });
    setSelectedCategories([]);
    setEditingPromotion(null);
  };

  const handleEdit = (promo: any) => {
    setFormData({
      name: promo.name,
      type: promo.type,
      value: promo.value,
      minPurchase: promo.minPurchase,
      maxDiscount: promo.maxDiscount,
      startDate: promo.startDate.split('T')[0],
      endDate: promo.endDate.split('T')[0],
      code: promo.code,
      usageLimit: promo.usageLimit,
    });
    setSelectedCategories(promo.applicableCategories || []);
    setEditingPromotion(promo.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const pin = prompt('Ingrese su PIN para eliminar esta promoción:');
    if (pin) {
      const result = await deletePromotion(id, pin);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles');
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Promociones</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mt-1">OFERTAS Y CUPONES DE DESCUENTO</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-none h-10 px-6 text-sm font-semibold uppercase tracking-wider shadow-none">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Promoción
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
           <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center"><Tag className="w-4 h-4 text-zinc-900 dark:text-zinc-100 stroke-[1.5]" /></div>
           <div><p className="text-sm uppercase font-semibold tracking-widest text-zinc-500">Activas</p><p className="text-2xl font-light text-zinc-900 dark:text-zinc-100">{activePromotionsCount}</p></div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
           <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center"><Gift className="w-4 h-4 text-zinc-900 dark:text-zinc-100 stroke-[1.5]" /></div>
           <div><p className="text-sm uppercase font-semibold tracking-widest text-zinc-500">Total</p><p className="text-2xl font-light text-zinc-900 dark:text-zinc-100">{promotions.length}</p></div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
           <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center"><Percent className="w-4 h-4 text-zinc-900 dark:text-zinc-100 stroke-[1.5]" /></div>
           <div><p className="text-sm uppercase font-semibold tracking-widest text-zinc-500">Usos</p><p className="text-2xl font-light text-zinc-900 dark:text-zinc-100">{promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0)}</p></div>
        </div>
      </div>

      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.5]" /><Input placeholder="BUSCAR PROMOCIONES..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 rounded-none border border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest placeholder:text-zinc-500" /></div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromotions.map((promo) => (
          <div key={promo.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 group transition-colors hover:border-zinc-400">
            <div className="flex items-start justify-between mb-4">
              <span className={`px-2 py-1 text-xs font-semibold tracking-widest uppercase ${promo.isActive && new Date(promo.endDate) > new Date() ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>{promo.isActive && new Date(promo.endDate) > new Date() ? 'ACTIVA' : 'INACTIVA'}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(promo)} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 transition-colors"><Edit2 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
                <button onClick={() => handleDelete(promo.id)} className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
              </div>
            </div>
            
            <div className="mb-4">
               <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 tracking-wide truncate">{promo.name}</h3>
               <p className="text-sm text-zinc-500 mt-1 uppercase tracking-widest">{promo.type === 'percentage' ? 'Porcentaje' : 'Valor fijo'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <div>
                 <p className="text-xs text-zinc-500 uppercase font-semibold tracking-widest">Descuento</p>
                 <p className="font-mono mt-0.5 text-zinc-900 dark:text-zinc-100">{promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value.toLocaleString()}`}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs text-zinc-500 uppercase font-semibold tracking-widest">Usos</p>
                 <p className="font-mono mt-0.5 text-zinc-600">{promo.usageCount || 0} {promo.usageLimit ? `/ ${promo.usageLimit}` : ''}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900">
              <div>
                 <p className="text-xs text-zinc-500 uppercase font-semibold tracking-widest">CÓDIGO</p>
                 <p className="font-mono font-medium text-sm text-zinc-900 dark:text-zinc-100 tracking-widest">{promo.code}</p>
              </div>
              <button onClick={() => copyCode(promo.code)} className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-colors"><Copy className="w-3.5 h-3.5 stroke-[1.5]" /></button>
            </div>
            
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 text-xs text-zinc-500 uppercase tracking-widest font-semibold flex items-center justify-between">
               <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 stroke-[1.5]" />VALIDEZ</span>
               <span>{new Date(promo.startDate).toLocaleDateString('es-CO')} - {new Date(promo.endDate).toLocaleDateString('es-CO')}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between"><h2 className="text-lg font-light tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{editingPromotion ? 'EDITAR PROMOCIÓN' : 'NUEVA PROMOCIÓN'}</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-900 dark:text-zinc-100"><X className="w-5 h-5 stroke-[1.5]" /></button></div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Nombre</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:outline-none text-xs uppercase" placeholder="DESCUENTO DE VERANO" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Tipo</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:outline-none text-xs uppercase"><option value="percentage">Porcentaje</option><option value="fixed">Valor fijo</option></select></div>
                <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Valor</label><input type="number" min="0" required value={formData.value} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })} className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:outline-none font-mono" /></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Fecha inicio</label><input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:outline-none font-mono text-xs text-zinc-600" /></div>
                <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Fecha fin</label><input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:outline-none font-mono text-xs text-zinc-600" /></div>
              </div>
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Código</label><input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:outline-none font-mono tracking-widest" placeholder="VERANO2024" /></div>
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4 block">Categorías aplicables</label><div className="flex flex-wrap gap-2">{CATEGORIES.map(cat => (<button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-4 py-2 border text-xs font-semibold tracking-widest uppercase transition-colors ${selectedCategories.includes(cat) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white dark:bg-zinc-950 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}>{cat}</button>))}</div></div>
              <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                 <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="rounded-none border-zinc-200 dark:border-zinc-800 text-sm font-semibold uppercase tracking-widest w-32 shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 text-zinc-600">Cancelar</Button>
                 <Button type="submit" className="rounded-none bg-zinc-900 hover:bg-zinc-800 text-white text-sm uppercase tracking-widest font-semibold w-40 shadow-none">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


