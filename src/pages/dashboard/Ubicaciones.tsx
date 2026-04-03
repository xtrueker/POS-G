import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, X, Store, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/context/LocationContext';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { useStaff } from '@/context/StaffContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface LocationFormData {
  name: string;
  address: string;
  phone: string;
}

export default function Ubicaciones() {
  const { user } = useAuth();
  const { staff } = useStaff();
  const navigate = useNavigate();
  const { locations, addLocation, updateLocation, deleteLocation, setCurrentLocation, currentLocation } = useLocation();
  const { products, updateProduct } = useInventory();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';
  const hasAccess = isOwnerOrAdmin || currentStaff?.permissions?.includes('locations' as any);

  useEffect(() => {
    if (staff.length > 0 && !hasAccess) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido al Módulo de Sedes', { id: 'security-block-locations' });
    }
  }, [staff, hasAccess, navigate]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    address: '',
    phone: '',
  });
  const [transferData, setTransferData] = useState({
    productId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: 1,
  });

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let result;
    if (editingLocation) {
      result = await updateLocation(editingLocation, formData);
    } else {
      result = await addLocation({ ...formData, isActive: true });
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
    setFormData({ name: '', address: '', phone: '' });
    setEditingLocation(null);
  };

  const handleEdit = (loc: any) => {
    setFormData({
      name: loc.name,
      address: loc.address,
      phone: loc.phone || '',
    });
    setEditingLocation(loc.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (locations.length <= 1) {
      toast.error('Debes tener al menos una ubicación');
      return;
    }
    if (confirm('¿Estás seguro de eliminar esta ubicación?')) {
      const result = await deleteLocation(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleSetCurrent = (loc: any) => {
    setCurrentLocation(loc);
    toast.success(`Ubicación cambiada a ${loc.name}`);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const product = products.find(p => p.id === transferData.productId);
    if (!product) {
      toast.error('Producto no encontrado');
      return;
    }

    if (product.stock < transferData.quantity) {
      toast.error('Stock insuficiente');
      return;
    }

    const result = await updateProduct(product.id, { stock: product.stock - transferData.quantity });
    
    if (result.success) {
      toast.success(`Transferencia de ${transferData.quantity} ${product.name} programada`);
      setShowTransferModal(false);
      setTransferData({ productId: '', fromLocationId: '', toLocationId: '', quantity: 1 });
    } else {
      toast.error('Error al realizar transferencia');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-8 border-b border-zinc-100 dark:border-zinc-900 pb-8">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Gestión de Sedes</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-[0.1em] font-bold mt-2">Logística de expansión y control geográfico</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setShowTransferModal(true)} variant="outline" className="rounded-none border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider h-12 px-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-all">
            <ArrowRightLeft className="w-4 h-4 mr-3 stroke-[1.5]" />
            TRANSFERIR ACTIVOS
          </Button>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-zinc-900 text-white rounded-none h-12 px-8 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 shadow-none transition-all">
            <Plus className="w-4 h-4 mr-3 stroke-[1.5]" />
            REGISTRAR UBICACIÓN
          </Button>
        </div>
      </div>

      {currentLocation && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 rounded-none p-10 flex flex-col md:flex-row items-center justify-between gap-8 glass-light dark:glass-dark border-glow-light dark:border-glow relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-zinc-50 dark:bg-white/5 -mr-16 -mt-16 rotate-45"></div>
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-2xl">
              <Store className="w-10 h-10 stroke-[1]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-2">TERMINAL OPERATIVA ACTIVA</p>
              <h2 className="text-3xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase">{currentLocation.name}</h2>
            </div>
          </div>
          <div className="md:text-right border-t md:border-t-0 md:border-l border-zinc-100/50 dark:border-white/5 pt-8 md:pt-0 md:pl-12 relative z-10">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.15em] leading-relaxed">{currentLocation.address}</p>
            {currentLocation.phone && <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-2 font-bold italic">NÚCLEO DE CONTACTO: {currentLocation.phone}</p>}
          </div>
        </div>
      )}

      <div className="flex gap-4 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 dark:text-zinc-600 stroke-[2.5]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="RASTREAR REGISTRO GEOGRÁFICO..."
            className="w-full pl-12 pr-6 py-4 bg-transparent border-none focus:outline-none text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-100 dark:placeholder:text-zinc-900 transition-colors"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredLocations.map((location) => (
          <div key={location.id} className={`bg-white dark:bg-zinc-950 rounded-none border p-8 transition-all group glass-light dark:glass-dark border-glow-light dark:border-glow ${currentLocation?.id === location.id ? 'border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white scale-[1.02] shadow-2xl' : 'border-zinc-100 dark:border-white/5 hover:border-zinc-900 dark:hover:border-white'}`}>
            <div className="flex items-start justify-between mb-8">
              <div className={`w-16 h-16 flex items-center justify-center transition-all shadow-xl ${currentLocation?.id === location.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600'}`}>
                <MapPin className="w-8 h-8 stroke-[1.25]" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(location)} className="p-3 text-zinc-300 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"><Edit2 className="w-4 h-4 stroke-[1.5]" /></button>
                <button onClick={() => handleDelete(location.id)} className="p-3 text-zinc-300 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4 stroke-[1.5]" /></button>
              </div>
            </div>
            
            <div className="space-y-3">
               <h3 className="font-light text-zinc-900 dark:text-zinc-100 text-3xl tracking-tighter uppercase leading-none">{location.name}</h3>
               <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] leading-relaxed font-bold">{location.address}</p>
            </div>

            {location.phone && (
              <div className="flex items-center gap-3 mt-8 text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] font-extrabold italic">
                <Phone className="w-4 h-4 stroke-[1.5]" />
                {location.phone}
              </div>
            )}

            <div className="mt-10 pt-10 border-t border-zinc-100/50 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-none animate-pulse ${location.isActive ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200'}`}></div>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">{location.isActive ? 'NODO OPERATIVO' : 'FUERA DE SERVICIO'}</span>
              </div>
              
              {currentLocation?.id !== location.id ? (
                <button onClick={() => handleSetCurrent(location)} className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em] hover:tracking-[0.25em] transition-all border-b border-zinc-900 dark:border-white pb-1">DESPLEGAR →</button>
              ) : (
                <span className="text-[9px] font-extrabold text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em]">SINCRONIZADA</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center z-[60] p-8">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 rounded-none max-w-xl w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-300 overflow-hidden glass-light dark:glass-dark">
            <div className="p-12 border-b border-zinc-100/50 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="space-y-2">
                <h2 className="text-2xl font-light uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">{editingLocation ? 'RECTIFICAR SEDE' : 'APERTURA DE NODO'}</h2>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Configuración de Activos Geográficos</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-900 dark:hover:border-white"><X className="w-6 h-6 stroke-[1.5]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-12 space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">DENOMINACIÓN DE SEDE</label>
                <Input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-16 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent" placeholder="EJ: NODO CENTRAL - BOGOTÁ" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">LOCALIZACIÓN FÍSICA</label>
                <Input type="text" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-16 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent" placeholder="DIRECCIÓN CARTOGRÁFICA" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">CANAL DE TELECOMUNICACIÓN</label>
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-16 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold tracking-[0.2em] bg-transparent font-mono" placeholder="+57 601 000 0000" />
              </div>
              <div className="flex gap-6 pt-10">
                <Button type="button" onClick={() => setShowModal(false)} variant="outline" className="flex-1 h-20 rounded-none border-zinc-200 dark:border-white/10 text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-all shadow-none glass-light dark:glass-dark">DESCARTAR</Button>
                <Button type="submit" className="flex-1 h-20 rounded-none bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all">CONSOLIDAR NODO</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none max-w-2xl w-full shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-10 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-900 text-white">
              <div className="space-y-1">
                <h2 className="text-xl font-light uppercase tracking-[0.1em]">Logística Interna</h2>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Transferencia de inventario entre sedes habilitadas</p>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-3 hover:bg-white dark:bg-zinc-950/10 text-zinc-500 hover:text-white transition-all"><X className="w-5 h-5 stroke-[1.5]" /></button>
            </div>
            <form onSubmit={handleTransfer} className="p-12 space-y-10">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Activo a Transferir</label>
                <select 
                   required 
                   value={transferData.productId} 
                   onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })} 
                   className="w-full h-14 px-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none outline-none text-sm uppercase tracking-wider font-bold focus:border-zinc-900 transition-colors"
                >
                  <option value="">Seleccionar activo del catálogo</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (DISPONIBLE: {p.stock})</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Sede Origen</label>
                  <select required value={transferData.fromLocationId} onChange={(e) => setTransferData({ ...transferData, fromLocationId: e.target.value })} className="w-full h-14 px-4 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-none outline-none text-sm uppercase tracking-wider font-medium focus:border-zinc-900 transition-colors">{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Sede Destino</label>
                  <select required value={transferData.toLocationId} onChange={(e) => setTransferData({ ...transferData, toLocationId: e.target.value })} className="w-full h-14 px-4 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-none outline-none text-sm uppercase tracking-wider font-medium focus:border-zinc-900 transition-colors">{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Unidades a Desplazar</label>
                <input type="number" min="1" required value={transferData.quantity} onChange={(e) => setTransferData({ ...transferData, quantity: parseInt(e.target.value) || 1 })} className="w-full h-14 px-6 bg-zinc-100 border border-zinc-100 dark:border-zinc-900 rounded-none outline-none text-xl font-light tracking-[0.1em] font-mono text-center focus:border-zinc-900 transition-all" />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={() => setShowTransferModal(false)} variant="outline" className="flex-1 h-16 rounded-none border-zinc-200 dark:border-zinc-800 text-sm font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 shadow-none transition-all font-bold">Abortar</Button>
                <Button type="submit" className="flex-1 h-16 rounded-none bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm uppercase tracking-wider shadow-none transition-all">Ejecutar Movimiento</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


