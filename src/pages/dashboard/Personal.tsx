import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStaff } from '@/context/StaffContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'supervisor' | 'cashier';
  pin: string;
  commissionRate: number;
}

const PERMISSIONS = [
  { key: 'sales', label: 'Ventas' },
  { key: 'inventory', label: 'Inventario' },
  { key: 'customers', label: 'Clientes' },
  { key: 'reports', label: 'Reportes' },
  { key: 'invoices', label: 'Facturas' },
  { key: 'expenses', label: 'Gastos' },
];

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  cashier: 'Cajero',
};

export default function Personal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { staff, addStaff, updateStaff, deleteStaff, verifyOwnerPin } = useStaff();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';
  const hasAccess = isOwnerOrAdmin || currentStaff?.permissions?.includes('staff' as any);

  useEffect(() => {
    if (staff.length > 0 && !hasAccess) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido al Módulo de Personal', { id: 'security-block' });
    }
  }, [staff, hasAccess, navigate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
    pin: '',
    commissionRate: 0,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['sales']);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ROLE_LABELS[s.role]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', role: 'cashier', pin: '', commissionRate: 0 });
    setSelectedPermissions(['sales']);
    setEditingStaff(null);
    setShowPin(false);
  };

  const handleEdit = (member: any) => {
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      pin: '',
      commissionRate: member.commissionRate || 0
    });
    setSelectedPermissions(member.permissions || []);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    if (editingStaff) {
      result = await updateStaff(editingStaff, { ...formData, permissions: selectedPermissions as any });
    } else {
      result = await addStaff({ ...formData, permissions: selectedPermissions as any });
    }
    
    if (result.success) {
      toast.success(result.message);
      resetForm();
      setShowModal(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    const pin = prompt('Ingrese PIN de propietario para eliminar personal:');
    if (pin) {
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        const result = await deleteStaff(id);
        if (result.success) toast.success(result.message);
      } else {
        toast.error('PIN incorrecto');
      }
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-8 border-b border-zinc-100 dark:border-zinc-900 pb-8">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Gestión de Capital Humano</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-[0.1em] font-bold mt-2">Control de accesos y jerarquía de equipo</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowModal(true); }} 
          className="bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-8 rounded-none shadow-none text-sm font-bold uppercase tracking-wider transition-all"
        >
          <Plus className="w-4 h-4 mr-3 stroke-[1.5]" />
          AÑADIR PERSONAL
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-within:text-zinc-900 dark:text-zinc-100 transition-colors stroke-[1.5]" />
        <Input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="IDENTIFICACIÓN / EMAIL / CARGO..." 
          className="h-14 pl-16 rounded-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 bg-white dark:bg-zinc-950 text-sm font-bold uppercase tracking-[0.1em] placeholder:text-zinc-200" 
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStaff.map(member => (
          <div key={member.id} className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 p-8 hover:border-zinc-900 dark:hover:border-white transition-all group relative overflow-hidden glass-light dark:glass-dark border-glow-light dark:border-glow">
             <div className="flex justify-between items-start mb-8">
               <div className="w-16 h-16 bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 text-xl font-light tracking-tighter shadow-xl">{member.name.charAt(0).toUpperCase()}</div>
               <div className="flex gap-2">
                 <button onClick={() => { setEditingStaff(member.id); handleEdit(member); }} className="p-2 border border-zinc-100 dark:border-white/5 hover:border-zinc-900 dark:hover:border-white text-zinc-300 hover:text-zinc-900 dark:group-hover:text-zinc-400 dark:hover:text-white transition-all"><Edit2 className="w-4 h-4 stroke-[1.5]" /></button>
                 <button onClick={() => handleDelete(member.id)} className="p-2 border border-zinc-100 dark:border-white/5 hover:border-red-600 text-zinc-300 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4 stroke-[1.5]" /></button>
               </div>
             </div>
             
             <div className="space-y-2">
               <h3 className="text-sm font-bold tracking-[0.2em] text-zinc-900 dark:text-zinc-100 uppercase">{member.name}</h3>
               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em]">{member.email}</p>
             </div>

             <div className="flex items-center gap-4 my-8">
               <span className="px-3 py-1 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 dark:text-zinc-400">{ROLE_LABELS[member.role]}</span>
               <span className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.1em] ${member.isActive ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white' : 'bg-red-50 text-red-600 border-red-100'}`}>
                 {member.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
               </span>
             </div>

             <div className="pt-8 border-t border-zinc-100/50 dark:border-white/5">
               <p className="text-[9px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.2em] mb-4">PRIVILEGIOS OPERATIVOS</p>
               <div className="flex flex-wrap gap-2">
                 {(member.permissions as any[] || []).map(p => (
                   <span key={p} className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border border-zinc-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-[0.1em]">{p}</span>
                 ))}
               </div>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-50 flex items-center justify-center p-8">
           <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in duration-300">
             <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
               <h2 className="text-xl font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100">{editingStaff ? 'MODIFICAR PERFIL' : 'ALTA DE PERSONAL'}</h2>
               <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-colors"><X className="w-5 h-5 text-zinc-500 stroke-[1.5]" /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[85vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Nombre Completo</label>
                    <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="rounded-none h-12 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs uppercase tracking-widest bg-transparent" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Correo Electrónico</label>
                    <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="rounded-none h-12 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs tracking-widest bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Rol Jerárquico</label>
                    <select 
                      value={formData.role} 
                      onChange={(e) => setFormData({...formData, role: e.target.value as any})} 
                      className="w-full h-12 px-4 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-none outline-none focus:border-zinc-900 text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                      <option value="cashier">CAJERO / ESPECIALISTA</option>
                      <option value="supervisor">SUPERVISOR</option>
                      <option value="admin">ADMINISTRADOR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Tasa de Comisión (%)</label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={formData.commissionRate} 
                        onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value) || 0})} 
                        placeholder="0"
                        className="rounded-none h-12 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-center font-mono text-lg" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 font-bold">%</span>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Clave de Acceso (PIN)</label>
                    <Input 
                      type={showPin ? "text" : "password"} 
                      required 
                      value={formData.pin} 
                      onChange={(e) => setFormData({...formData, pin: e.target.value})} 
                      className="rounded-none h-12 border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-center text-lg tracking-[0.5em]" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPin(!showPin)} 
                      className="absolute right-4 top-[42px] text-zinc-300 hover:text-zinc-900 dark:text-zinc-100 transition-colors"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-6 border-b border-zinc-50 pb-2">Matriz de Permisos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {PERMISSIONS.map(p => (
                      <button 
                        key={p.key} 
                        type="button" 
                        onClick={() => setSelectedPermissions(prev => prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key])} 
                        className={`px-4 py-3 rounded-none text-left text-xs font-bold border transition-all uppercase tracking-[0.1em] ${selectedPermissions.includes(p.key) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-100 dark:border-zinc-900 hover:border-zinc-400'}`}
                      >
                        <div className="flex items-center justify-between">
                          {p.label}
                          {selectedPermissions.includes(p.key) && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-6 pt-8 border-t border-zinc-50">
                   <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="h-12 border-zinc-200 dark:border-zinc-800 text-sm font-bold uppercase tracking-wider w-40 rounded-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-all">Cancelar</Button>
                   <Button type="submit" className="h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-wider rounded-none w-48 shadow-none transition-all">Validar & Guardar</Button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}


