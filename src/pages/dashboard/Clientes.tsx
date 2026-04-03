import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit2, User, ShoppingBag, Scissors, AlertTriangle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomer } from '@/context/CustomerContext';
import { useStaff } from '@/context/StaffContext';
import { useSecurity } from '@/context/SecurityContext';
import { toast } from 'sonner';

export default function Clientes() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomer();
  const { verifyOwnerPin, hasPermission } = useStaff();
  const { logAudit } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    technicalNotes: '',
    hairHistory: '',
    allergies: '',
  });

  const canManageCustomers = hasPermission('customers.edit');
  const canDeleteCustomers = hasPermission('customers.delete');

  const filteredCustomers = useMemo(() => customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  ), [customers, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCustomers) {
      toast.error('No tienes permisos para gestionar clientes');
      return;
    }
    if (!newCustomer.name) return;

    let result;
    if (editingCustomer) {
      result = await updateCustomer(editingCustomer, {
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        technicalNotes: newCustomer.technicalNotes,
        hairHistory: newCustomer.hairHistory,
        allergies: newCustomer.allergies,
      });
      if (result.success) {
        setEditingCustomer(null);
        toast.success('Cliente actualizado');
      } else {
        toast.error(result.message);
        return;
      }
    } else {
      result = await addCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        technicalNotes: newCustomer.technicalNotes,
        hairHistory: newCustomer.hairHistory,
        allergies: newCustomer.allergies,
      });
      if (result.success) {
        toast.success('Cliente creado');
      } else {
        toast.error(result.message);
        return;
      }
    }

    setNewCustomer({ name: '', email: '', phone: '', address: '', technicalNotes: '', hairHistory: '', allergies: '' });
    setIsNewCustomerOpen(false);
  };

  const startEdit = (customer: any) => {
    setEditingCustomer(customer.id);
    setNewCustomer({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      technicalNotes: customer.technicalNotes || '',
      hairHistory: customer.hairHistory || '',
      allergies: customer.allergies || '',
    });
    setIsNewCustomerOpen(true);
  };

  const handleDelete = async (customerId: string) => {
    if (!canDeleteCustomers) {
      toast.error('No tienes permisos para eliminar clientes');
      return;
    }
    const pin = prompt('Ingrese su PIN de propietario para confirmar la eliminación:');
    if (pin) {
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        const result = await deleteCustomer(customerId);
        if (result.success) {
          toast.success('Cliente eliminado');
          
          // Registro en Auditoría
          logAudit({
            action: 'CUSTOMER_DELETE',
            entityType: 'customer',
            entityId: customerId,
            description: `Cliente eliminado del CRM (PIN verificado)`,
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

  const totalCustomers = customers.length;
  const totalBalance = useMemo(() => customers.reduce((sum, c) => sum + (c.balance || 0), 0), [customers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Clientes</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mt-1">BASE DE DATOS DE CLIENTES</p>
        </div>
        <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800 dark:hover:bg-white rounded-none h-10 px-6 text-xs font-bold uppercase tracking-widest shadow-lg transition-all border-none">
              <Plus className="w-4 h-4 mr-2 stroke-[2]" />
              Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-950 focus-visible:outline-none">
            <DialogHeader><DialogTitle className="text-lg font-light tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{editingCustomer ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Nombre *</label><Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="NOMBRE COMPLETO" className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs uppercase" required /></div>
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Correo electrónico</label><Input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="CLIENTE@EMAIL.COM" className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs uppercase" /></div>
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Teléfono</label><Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="300 123 4567" className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 font-mono" /></div>
              <div><label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Dirección</label><Input value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="DIRECCIÓN OPCIONAL" className="rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs uppercase" /></div>
              
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 space-y-6 border border-zinc-100 dark:border-zinc-900">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                    <Scissors className="w-3 h-3" /> Fórmulas y Notas Técnicas
                  </label>
                  <textarea 
                    value={newCustomer.technicalNotes} 
                    onChange={(e) => setNewCustomer({ ...newCustomer, technicalNotes: e.target.value })} 
                    placeholder="MEZCLAS DE TINTE, PRODUCTOS UTILIZADOS..." 
                    className="w-full h-24 p-4 rounded-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 outline-none bg-white dark:bg-zinc-950 text-xs font-mono uppercase tracking-widest transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Alergias y Contraindicaciones
                  </label>
                  <textarea 
                    value={newCustomer.allergies} 
                    onChange={(e) => setNewCustomer({ ...newCustomer, allergies: e.target.value })} 
                    placeholder="ALERGIAS A QUÍMICOS O REACCIONES..." 
                    className="w-full h-20 p-4 rounded-none border border-red-200 dark:border-red-900 focus:border-red-500 outline-none bg-red-50/10 text-xs font-bold uppercase tracking-widest placeholder:text-red-300 transition-all text-red-600 shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                    <History className="w-3 h-3" /> Historial de Químicos
                  </label>
                  <textarea 
                    value={newCustomer.hairHistory} 
                    onChange={(e) => setNewCustomer({ ...newCustomer, hairHistory: e.target.value })} 
                    placeholder="DECOLORACIONES, ALISADOS, TRATAMIENTOS PREVIOS..." 
                    className="w-full h-20 p-4 rounded-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 outline-none bg-white dark:bg-zinc-950 text-xs font-mono uppercase tracking-widest transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <Button type="button" variant="outline" onClick={() => { setIsNewCustomerOpen(false); setEditingCustomer(null); }} className="rounded-none border-zinc-200 dark:border-zinc-800 text-sm font-semibold uppercase tracking-widest w-32 shadow-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 text-zinc-600">Cancelar</Button>
                <Button type="submit" className="rounded-none bg-zinc-900 hover:bg-zinc-800 text-white text-sm uppercase tracking-widest font-semibold w-40 shadow-none">{editingCustomer ? 'GUARDAR' : 'CREAR'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total clientes', value: totalCustomers, icon: User },
          { label: 'Balance total', value: formatCurrency(totalBalance), icon: ShoppingBag },
          { label: 'Promedio compras', value: totalCustomers > 0 ? formatCurrency(Math.round(customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0) / totalCustomers)) : 0, icon: ShoppingBag }
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

      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.5]" /><Input placeholder="BUSCAR CLIENTES..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 rounded-none border border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest placeholder:text-zinc-500" /></div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 overflow-hidden glass-light dark:glass-dark border-glow-light dark:border-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">CLIENTE</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">CONTACTO</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">COMPRAS</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">BALANCE</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                  <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-white/5 flex items-center justify-center font-bold text-zinc-900 dark:text-zinc-100">{customer.name.charAt(0)}</div><div><p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 tracking-widest uppercase">{customer.name}</p><p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-600 mt-1 font-bold">{customer.address || 'SIN DIRECCIÓN'}</p></div></div></td>
                  <td className="px-6 py-4"><div className="space-y-1"><p className="text-[10px] font-bold tracking-[0.1em] text-zinc-900 dark:text-zinc-400 uppercase">{customer.email || '---'}</p><p className="text-[10px] tracking-widest text-zinc-500 dark:text-zinc-600 font-mono font-bold">{customer.phone || '---'}</p></div></td>
                  <td className="px-6 py-4 text-center"><span className="text-xs font-mono font-bold text-zinc-600">{customer.totalPurchases}</span></td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(customer.balance || 0)}</td>
                  <td className="px-6 py-4"><div className="flex items-center justify-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(customer)} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 transition-colors"><Edit2 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
                    <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 stroke-[1.5]" /></button>
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


