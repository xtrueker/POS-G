import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Truck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupplier } from '@/context/SupplierContext';
import { useStaff } from '@/context/StaffContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Proveedores() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSupplier();
  const { verifyOwnerPin, hasPermission, staff } = useStaff();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';

  useEffect(() => {
    if (staff.length > 0 && !isOwnerOrAdmin) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido: El directorio de proveedores es exclusivo para administradores', { id: 'security-block-suppliers' });
    }
  }, [staff, isOwnerOrAdmin, navigate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const canManageSuppliers = hasPermission('suppliers.edit');
  const canDeleteSuppliers = hasPermission('suppliers.delete');

  const filteredSuppliers = useMemo(() => suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.phone && supplier.phone.includes(searchTerm))
  ), [suppliers, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSuppliers) {
      toast.error('No tienes permisos para gestionar proveedores');
      return;
    }
    if (!newSupplier.name) return;

    let result;
    if (editingSupplier) {
      result = await updateSupplier(editingSupplier, {
        name: newSupplier.name,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: newSupplier.address,
      });
      if (result.success) {
        setEditingSupplier(null);
        toast.success('Proveedor actualizado');
      } else {
        toast.error(result.message);
        return;
      }
    } else {
      result = await addSupplier({
        name: newSupplier.name,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: newSupplier.address,
      });
      if (result.success) {
        toast.success('Proveedor creado');
      } else {
        toast.error(result.message);
        return;
      }
    }

    setNewSupplier({ name: '', email: '', phone: '', address: '' });
    setIsNewSupplierOpen(false);
  };

  const startEdit = (supplier: any) => {
    setEditingSupplier(supplier.id);
    setNewSupplier({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setIsNewSupplierOpen(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (!canDeleteSuppliers) {
      toast.error('No tienes permisos para eliminar proveedores');
      return;
    }
    const pin = prompt('Ingrese su PIN de propietario para confirmar la eliminación:');
    if (pin) {
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        const result = await deleteSupplier(supplierId);
        if (result.success) {
          toast.success('Proveedor eliminado');
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('PIN incorrecto');
      }
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-CO')}`;

  const totalSuppliers = suppliers.length;
  const totalBalance = useMemo(() => suppliers.reduce((sum, s) => sum + (s.balance || 0), 0), [suppliers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Proveedores</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mt-1">DIRECTORIO DE ABASTECIMIENTO</p>
        </div>
        <Dialog open={isNewSupplierOpen} onOpenChange={setIsNewSupplierOpen}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800 dark:hover:bg-white rounded-none h-10 px-6 text-xs font-bold uppercase tracking-widest shadow-lg transition-all border-none">
              <Plus className="w-4 h-4 mr-2 stroke-[2]" />
              Nuevo proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-950 focus-visible:outline-none">
            <DialogHeader><DialogTitle className="text-lg font-light tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{editingSupplier ? 'EDITAR PROVEEDOR' : 'NUEVO PROVEEDOR'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Nombre *</label><Input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} placeholder="NOMBRE DEL PROVEEDOR" className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs uppercase" required /></div>
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Correo electrónico</label><Input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} placeholder="PROVEEDOR@EMAIL.COM" className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs uppercase" /></div>
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Teléfono</label><Input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} placeholder="300 123 4567" className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 font-mono" /></div>
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Dirección</label><Input value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} placeholder="DIRECCIÓN OPCIONAL" className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs uppercase" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <Button type="button" variant="outline" onClick={() => setIsNewSupplierOpen(false)} className="rounded-none border-zinc-200 dark:border-zinc-800 text-sm font-semibold uppercase tracking-widest w-32 shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 text-zinc-600">Cancelar</Button>
                <Button type="submit" className="rounded-none bg-zinc-900 hover:bg-zinc-800 text-white text-sm uppercase tracking-widest font-semibold w-40 shadow-none">{editingSupplier ? 'GUARDAR' : 'CREAR'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total proveedores', value: totalSuppliers, icon: Truck },
          { label: 'Deuda total', value: formatCurrency(totalBalance), icon: Package },
          { label: 'Compras totales', value: suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0), icon: Package }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200/50 dark:border-white/5 flex items-center gap-4 glass-light dark:glass-dark border-glow-light dark:border-glow group hover:border-zinc-900 dark:hover:border-white transition-all">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 flex items-center justify-center group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-500 shadow-sm"><stat.icon className="w-5 h-5 stroke-[1.5]" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.5]" /><Input placeholder="BUSCAR PROVEEDORES..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 rounded-none border border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest placeholder:text-zinc-500" /></div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 overflow-hidden glass-light dark:glass-dark border-glow-light dark:border-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">PROVEEDOR</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">CONTACTO</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">COMPRAS</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">DEUDA</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                  <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-white/5 flex items-center justify-center font-bold text-zinc-900 dark:text-zinc-100">{supplier.name.charAt(0)}</div><div><p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 tracking-widest uppercase">{supplier.name}</p><p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mt-1 font-bold">{supplier.address || 'SIN DIRECCIÓN'}</p></div></div></td>
                  <td className="px-6 py-4"><div className="space-y-1"><p className="text-[10px] font-bold tracking-[0.1em] text-zinc-900 dark:text-zinc-400 uppercase">{supplier.email || '---'}</p><p className="text-[10px] tracking-widest text-zinc-500 dark:text-zinc-600 font-mono font-bold">{supplier.phone || '---'}</p></div></td>
                  <td className="px-6 py-4 text-center"><span className="text-xs font-mono font-bold text-zinc-600">{supplier.totalPurchases}</span></td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(supplier.balance || 0)}</td>
                  <td className="px-6 py-4"><div className="flex items-center justify-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(supplier)} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 transition-colors"><Edit2 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
                    <button onClick={() => handleDelete(supplier.id)} className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


