import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Trash2, Edit2, Package, AlertTriangle, TrendingUp, Camera, X, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInventory } from '@/context/InventoryContext';
import { useStaff } from '@/context/StaffContext';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { useSecurity } from '@/context/SecurityContext';
import { useSecurityGate } from '@/hooks/useSecurityGate';
import TrackingScanner from '@/components/scanner/TrackingScanner';
import MermasDialog from '@/components/inventory/MermasDialog';

const BAKERY_CATEGORIES = ['Panadería', 'Repostería', 'Bebidas', 'Lácteos', 'Carnes', 'Verduras', 'Otros'];
const DEFAULT_BEAUTY_CATEGORIES = ['Peluquería', 'Barbería', 'Manicure', 'Pedicure', 'Estética Facial', 'Masajes', 'Makeup', 'Otros'];

export default function Inventario() {
  useSecurityGate({ requiredPermission: 'inventory', toastId: 'security-block-inv', toastMessage: 'Acceso Restringido al Módulo de Inventario' });
  const { products, addProduct, updateProduct, deleteProduct } = useInventory();
  const { verifyOwnerPin, hasPermission } = useStaff();
  const { logAudit } = useSecurity();
  const { user: authUser } = useAuth();
  const { businessInfo } = useBusiness();

  const isBakery = businessInfo?.vertical === 'bakery';
  const isBeauty = businessInfo?.vertical === 'beauty';
  const categories = isBeauty 
    ? (businessInfo?.settings?.beauty?.categories || DEFAULT_BEAUTY_CATEGORIES) 
    : BAKERY_CATEGORIES;

  const [activeFilter, setActiveFilter] = useState<'all' | 'products' | 'services' | 'supplies'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    category: categories[0],
    minStock: '5',
    imageUrl: '',
    barcode: '',
    isService: false,
    duration: '',
    usageType: 'retail' as 'retail' | 'professional',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isScanningCode, setIsScanningCode] = useState(false);
  const [isMermasOpen, setIsMermasOpen] = useState(false);

  const canManageInventory = hasPermission('inventory.create') || hasPermission('inventory.edit');
  const canDeleteInventory = hasPermission('inventory.delete');

  const lowStockProducts = useMemo(() => products.filter(p => !p.isService && p.stock <= p.minStock), [products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageInventory) {
      toast.error('No tienes permisos para gestionar el inventario');
      return;
    }
    if (!newProduct.name || !newProduct.price) return;

    let imageUrl = newProduct.imageUrl;

    if (imageFile && authUser) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const path = `${authUser.id}/${fileName}`;
      const uploadedUrl = await uploadFile('products', path, imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        toast.error('Error al subir la imagen');
      }
    }

    let result;
    if (editingProduct) {
      result = await updateProduct(editingProduct, {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost) || 0,
        stock: parseInt(newProduct.stock) || 0,
        category: newProduct.category,
        minStock: parseInt(newProduct.minStock) || 5,
        imageUrl,
        barcode: newProduct.barcode || undefined,
        isService: newProduct.isService,
        usageType: newProduct.usageType,
        duration: newProduct.isService ? parseInt(newProduct.duration) : undefined
      });
      if (result.success) {
        toast.success('Producto actualizado');
        setEditingProduct(null);
      } else {
        toast.error(result.message);
        return;
      }
    } else {
      result = await addProduct({
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost) || 0,
        stock: parseInt(newProduct.stock) || 0,
        category: newProduct.category,
        minStock: parseInt(newProduct.minStock) || 5,
        imageUrl,
        barcode: newProduct.barcode || undefined,
        unit: 'un',
        isService: newProduct.isService,
        usageType: newProduct.usageType,
        duration: newProduct.isService ? parseInt(newProduct.duration) : undefined
      });
      if (result.success) {
        toast.success('Producto creado');
      } else {
        toast.error(result.message);
        return;
      }
    }

    setNewProduct({
      name: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      category: categories[0],
      minStock: '5',
      imageUrl: '',
      barcode: '',
      isService: false,
      duration: '',
      usageType: 'retail',
    });
    setImageFile(null);
    setIsNewProductOpen(false);
  };

  const startEdit = (product: any) => {
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      category: product.category,
      minStock: product.minStock.toString(),
      imageUrl: product.imageUrl || '',
      barcode: product.barcode || '',
      isService: !!product.isService,
      duration: product.duration?.toString() || '',
      usageType: product.usageType || 'retail',
    });
    setImageFile(null);
    setIsNewProductOpen(true);
  };

  const handleScanCode = useCallback((decodedText: string) => {
    setNewProduct(prev => ({ ...prev, barcode: decodedText }));
    setIsScanningCode(false);
    toast.success('Código vinculado a Inventario');
  }, []);

  const handleDelete = async (productId: string) => {
    if (!canDeleteInventory) {
      toast.error('No tienes permisos para eliminar productos');
      return;
    }
    const pin = prompt('Ingrese su PIN de propietario para confirmar la eliminación:');
    if (pin) {
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        const result = await deleteProduct(productId);
        if (result.success) {
          toast.success('Producto eliminado del inventario');
          
          logAudit({
            action: 'INVENTORY_DELETE',
            entityType: 'product',
            entityId: productId,
            description: `Producto eliminado del catálogo comercial (PIN verificado)`,
            severity: 'critical',
            requiresPin: true,
            pinVerified: true
          });
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('PIN incorrecto');
      }
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-CO')}`;

  const totalInventoryValue = useMemo(() => products.reduce((sum, p) => sum + (p.isService ? 0 : (p.cost * p.stock)), 0), [products]);
  const totalProducts = products.length;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()));
      const isService = !!p.isService;
      
      if (activeFilter === 'products') return matchesSearch && !isService && p.usageType !== 'professional';
      if (activeFilter === 'services') return matchesSearch && isService;
      if (activeFilter === 'supplies') return matchesSearch && p.usageType === 'professional';
      return matchesSearch;
    });
  }, [products, searchTerm, activeFilter]);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-8 border-b border-zinc-100 dark:border-zinc-900 pb-8">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">{isBakery ? 'Gestión de Existencias & Producción' : 'Inventario Maestro'}</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-[0.1em] font-bold mt-2">Control de activos y rotación de stock</p>
        </div>

        <div className="flex items-center gap-4">
          {isBakery && (
            <Button onClick={() => setIsMermasOpen(true)} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 font-bold text-sm uppercase tracking-wider h-11 rounded-none shadow-none px-6">
              REGISTRAR MERMA
            </Button>
          )}

          <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-none h-11 px-8 text-sm font-bold uppercase tracking-wider shadow-none transition-all">
                <Plus className="w-4 h-4 mr-3 stroke-[1.5]" />
                NUEVO ÍTEM
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none border-zinc-200 dark:border-zinc-800 p-8 md:p-12 w-[95vw] max-w-2xl bg-white dark:bg-zinc-950 focus-visible:outline-none shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
              <DialogHeader><DialogTitle className="text-xl font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 mb-8 border-b border-zinc-50 pb-6">{editingProduct ? 'Modificar Registro' : 'Alta de Producto'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-8 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6 md:col-span-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Identificación del Producto</label>
                      <Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="NOMBRE COMERCIAL" className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs font-medium uppercase tracking-widest placeholder:text-zinc-200" required />
                    </div>
                    <div>
                      <Input value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="ESPECIFICACIONES TÉCNICAS (OPCIONAL)" className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-sm font-medium uppercase tracking-widest placeholder:text-zinc-200" />
                    </div>
                    <div className="flex items-center gap-4 pt-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div 
                          onClick={() => setNewProduct({...newProduct, isService: !newProduct.isService})}
                          className={`w-12 h-6 border transition-all p-1 ${newProduct.isService ? 'bg-zinc-900 border-zinc-900' : 'bg-transparent border-zinc-200 dark:border-zinc-800'}`}
                        >
                          <div className={`w-3 h-3 bg-white transition-all ${newProduct.isService ? 'translate-x-6' : 'translate-x-0 bg-zinc-200'}`} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">¿Es un Servicio?</span>
                      </label>

                      {!newProduct.isService && (
                        <label className="flex items-center gap-3 cursor-pointer group border-l border-zinc-100 pl-6 h-6">
                           <div 
                            onClick={() => setNewProduct({...newProduct, usageType: newProduct.usageType === 'retail' ? 'professional' : 'retail'})}
                            className={`w-12 h-6 border transition-all p-1 ${newProduct.usageType === 'professional' ? 'bg-amber-600 border-amber-600 shadow-lg shadow-amber-600/20' : 'bg-transparent border-zinc-200 dark:border-zinc-800'}`}
                          >
                            <div className={`w-3 h-3 bg-white transition-all ${newProduct.usageType === 'professional' ? 'translate-x-6' : 'translate-x-0 bg-zinc-200'}`} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">¿Insumo Profesional?</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Liquidación (Venta)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 font-mono text-xs">$</span>
                        <Input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0" className="h-12 pl-8 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs" required />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">{newProduct.isService ? 'Remuneración de Especialista (Pago)' : 'Adquisición (Costo)'}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 font-mono text-xs">$</span>
                        <Input type="number" value={newProduct.cost} onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })} placeholder="0" className="h-12 pl-8 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs" />
                      </div>
                    </div>
                  </div>

                  {newProduct.isService ? (
                    <div className="md:col-span-2">
                       <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Tiempo de Atención (Minutos)</label>
                       <div className="flex items-center gap-4">
                          <Input type="number" value={newProduct.duration || ''} onChange={(e) => setNewProduct({ ...newProduct, duration: e.target.value })} placeholder="60" className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs w-32" required />
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Protocolo de Tiempo Sugerido</span>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Existencia en Vitrina</label>
                        <Input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="0" className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs" required />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Alerta de Reposición (Mínimo)</label>
                        <Input type="number" value={newProduct.minStock} onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })} placeholder="5" className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs text-red-600" />
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 space-y-8 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Clasificación</label>
                        <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full h-12 px-4 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-none text-sm font-bold uppercase tracking-wider focus:border-zinc-900 outline-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-colors">
                          {categories.map(cat => (<option key={cat} value={cat}>{cat.toUpperCase()}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Codificación Universal</label>
                        <div className="flex gap-1 border border-zinc-200 dark:border-zinc-800 h-12 p-1 focus-within:border-zinc-900 transition-colors">
                          <Input value={newProduct.barcode} onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })} placeholder="SCAN / INPUT" className="flex-1 border-none focus-visible:ring-0 font-mono text-sm tracking-widest uppercase bg-transparent" />
                          <Button type="button" onClick={() => setIsScanningCode(!isScanningCode)} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-4 rounded-none shadow-none border-l border-zinc-100 dark:border-zinc-900"><ScanBarcode className="w-4 h-4 stroke-[1.5]" /></Button>
                        </div>
                      </div>
                    </div>
                    
                    {isScanningCode && (
                      <div className="relative bg-zinc-900 overflow-hidden h-64 border border-zinc-900">
                         <TrackingScanner onScan={handleScanCode} />
                         <button type="button" onClick={(e) => { e.preventDefault(); setIsScanningCode(false); }} className="absolute top-4 right-4 p-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 z-20 hover:bg-zinc-100 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 block">Identidad Visual</label>
                      <div className="flex items-center gap-6">
                        {(imageFile || newProduct.imageUrl) ? (
                          <div className="relative w-32 h-32 border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center p-2 group transition-all hover:bg-white dark:bg-zinc-950 hover:border-zinc-300">
                            <img src={imageFile ? URL.createObjectURL(imageFile) : newProduct.imageUrl} alt="Preview" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                            <button type="button" onClick={() => { setImageFile(null); setNewProduct({ ...newProduct, imageUrl: '' }); }} className="absolute -top-3 -right-3 p-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"><X className="w-3.5 h-3.5 stroke-[1.5]" /></button>
                          </div>
                        ) : (
                          <label className="w-32 h-32 border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-all group">
                            <Camera className="w-6 h-6 text-zinc-300 mb-3 stroke-[1.5] group-hover:text-zinc-900 dark:text-zinc-100" />
                            <span className="text-[11px] text-zinc-500 font-bold tracking-wider uppercase group-hover:text-zinc-900 dark:text-zinc-100">Subir Activo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setImageFile(file); }} />
                          </label>
                        )}
                        <div className="flex-1 text-sm text-zinc-500 tracking-widest leading-relaxed uppercase">La imagen debe proyectar calidad y minimalismo. Formato sugerido: PNG transparente.</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-6 pt-12 border-t border-zinc-50">
                  <Button type="button" variant="outline" onClick={() => setIsNewProductOpen(false)} className="h-12 border-zinc-200 dark:border-zinc-800 text-sm font-bold uppercase tracking-wider w-40 rounded-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 hover:border-zinc-900 transition-all">Anular Operación</Button>
                  <Button type="submit" className="h-12 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold uppercase tracking-wider w-48 rounded-none shadow-none transition-all">Validar & Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-8">
        {[
          { label: 'CATÁLOGO TOTAL', value: totalProducts, icon: Package, context: isBeauty ? 'SERVICIOS Y PRODUCTOS' : 'PRODUCTOS ACTIVOS' },
          { label: isBeauty ? 'REPOSICIÓN RETAIL' : 'CRÍTICOS STOCK', value: lowStockProducts.length, icon: AlertTriangle, context: 'REQUIEREN PEDIDO', highlight: lowStockProducts.length > 0 },
          { label: 'VALUACIÓN TOTAL', value: formatCurrency(totalInventoryValue), icon: TrendingUp, context: isBeauty ? 'INVERSIONES Y PAGOS' : 'PRECIO COSTO' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-8 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 transition-all transition-colors group shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 ${stat.highlight ? 'bg-zinc-900 text-white' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500'} border border-zinc-100 dark:border-zinc-900 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all`}><stat.icon className="w-5 h-5 stroke-[1.5]" /></div>
              <span className="text-[11px] font-bold text-zinc-300 tracking-[0.1em] uppercase">{stat.context}</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{stat.label}</p>
            <p className="text-3xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-zinc-900 p-8 flex items-center gap-8 overflow-x-auto no-scrollbar border border-zinc-900">
          <span className="text-xs font-bold text-white uppercase tracking-[0.1em] whitespace-nowrap border-r border-zinc-800 pr-8">Alertas de Reposición</span>
          <div className="flex gap-4">
            {lowStockProducts.map(p => (
              <span key={p.id} className="px-4 py-2 bg-zinc-800 text-zinc-500 text-[11px] uppercase font-bold tracking-wider border border-zinc-700 whitespace-nowrap">
                {p.name} <span className="text-white ml-2">[{p.stock}]</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-within:text-zinc-900 dark:text-zinc-100 transition-colors stroke-[1.5]" />
          <Input 
            placeholder="BUSCAR EN EL CATÁLOGO MAESTRO..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-16 h-16 rounded-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 bg-white dark:bg-zinc-950 text-sm font-bold uppercase tracking-[0.1em] placeholder:text-zinc-200 placeholder:font-bold transition-all" 
          />
        </div>

        <div className="flex bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-none border border-zinc-100 dark:border-white/5 shadow-inner shrink-0">
          {[
            { id: 'all', label: 'TODO' },
            { id: 'products', label: 'RETAIL' },
            { id: 'supplies', label: 'INSUMOS' },
            { id: 'services', label: 'SERVICIOS' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-8 py-2.5 rounded-none text-[9px] font-bold tracking-[0.2em] transition-all ${activeFilter === f.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl' : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <div key={product.id} className={`bg-white dark:bg-zinc-950 border transition-all p-0 overflow-hidden group relative glass-light dark:glass-dark border-glow-light dark:border-glow ${product.stock <= product.minStock ? 'border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white ring-offset-4 ring-offset-white dark:ring-offset-black' : 'border-zinc-200/50 dark:border-white/5 hover:border-zinc-900 dark:hover:border-white shadow-sm hover:shadow-2xl'}`}>
            <div className="aspect-square bg-zinc-50 dark:bg-zinc-900/50 relative overflow-hidden flex items-center justify-center p-8 group-hover:bg-white dark:group-hover:bg-zinc-900 transition-all duration-500">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <Package className="w-12 h-12 text-zinc-200 dark:text-zinc-800 stroke-[1]" />
              )}
               <div className="absolute top-6 left-6 flex flex-col gap-2">
                 <span className="px-3 py-1 bg-white dark:bg-zinc-950/90 backdrop-blur-sm text-zinc-900 dark:text-zinc-100 text-[11px] font-bold tracking-wider uppercase border border-zinc-100 dark:border-zinc-900">{product.category}</span>
                 {product.isService && <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold tracking-wider uppercase">Servicio</span>}
                 {!product.isService && product.stock <= product.minStock && <span className="px-3 py-1 bg-zinc-900 text-white text-[11px] font-bold tracking-wider uppercase">Low Stock</span>}
              </div>
              <div className="absolute bottom-6 right-6 flex gap-2 translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                <button onClick={(e) => { e.stopPropagation(); startEdit(product); }} className="w-10 h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:border-zinc-900 flex items-center justify-center transition-all shadow-xl"><Edit2 className="w-4 h-4 stroke-[1.5]" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} className="w-10 h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-600 hover:border-red-600 flex items-center justify-center transition-all shadow-xl"><Trash2 className="w-4 h-4 stroke-[1.5]" /></button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest leading-snug line-clamp-1">{product.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {product.barcode && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-mono tracking-widest border border-zinc-200 dark:border-zinc-700">{product.barcode}</span>}
                  <p className="text-xs text-zinc-500 uppercase tracking-wider line-clamp-1 leading-relaxed">{product.description || 'SIN ESPECIFICACIONES'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-6 border-y border-zinc-100/50 dark:border-white/5">
                <div>
                  <label className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.2em] mb-2 block">Liquidación</label>
                  <p className="text-xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter">{formatCurrency(product.price)}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.2em] mb-2 block text-right">
                    {product.isService ? 'Duración' : 'Existencia'}
                  </label>
                  <p className={`text-xl font-light text-right tracking-tighter ${!product.isService && product.stock <= product.minStock ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {product.isService ? `${product.duration || 0}'` : product.stock}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 tracking-[0.2em] uppercase">Margen: {product.price > 0 ? Math.round(((product.price - product.cost) / product.price) * 100) : 0}%</span>
                <div className="px-3 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100/50 dark:border-white/5 text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
                  {product.isService ? 'PAGO COLAB:' : 'COSTO:'} {formatCurrency(product.cost)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isMermasOpen && (
        <MermasDialog isOpen={isMermasOpen} onClose={() => setIsMermasOpen(false)} />
      )}
    </div>
  );
}
