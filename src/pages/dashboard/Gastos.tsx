import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, Receipt, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useExpenses } from '@/context/ExpenseContext';
import { useSupplier } from '@/context/SupplierContext';
import { useStaff } from '@/context/StaffContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const expenseCategories = [
  'Insumos',
  'Servicios',
  'Alquiler',
  'Nómina',
  'Marketing',
  'Transporte',
  'Otros',
];

export default function Gastos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { suppliers } = useSupplier();
  const { staff, verifyOwnerPin, hasPermission } = useStaff();
  const { expenses, addExpense, deleteExpense } = useExpenses();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';

  useEffect(() => {
    if (staff.length > 0 && !isOwnerOrAdmin) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido: La gestión de gastos es exclusiva para administradores', { id: 'security-block-expenses' });
    }
  }, [staff, isOwnerOrAdmin, navigate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Insumos',
    supplierId: '',
    staffId: '',
    notes: '',
  });

  const canManageExpenses = hasPermission('expenses.edit');
  const canDeleteExpenses = hasPermission('expenses.delete');

  const filteredExpenses = useMemo(() => expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  ), [expenses, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageExpenses) {
      toast.error('No tienes permisos para registrar gastos');
      return;
    }
    if (!newExpense.description || !newExpense.amount) return;

    if (newExpense.category === 'Nómina' && !newExpense.staffId) {
      toast.error('Debe seleccionar a un Empleado para registrar la Nómina');
      return;
    }

    const result = await addExpense({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      supplierId: newExpense.category !== 'Nómina' ? (newExpense.supplierId || undefined) : undefined,
      staffId: newExpense.category === 'Nómina' ? (newExpense.staffId || undefined) : undefined,
      notes: newExpense.notes,
      date: new Date().toISOString(),
    });

    if (result.success) {
      toast.success(result.message);
      setNewExpense({
        description: '',
        amount: '',
        category: 'Insumos',
        supplierId: '',
        staffId: '',
        notes: '',
      });
      setIsNewExpenseOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!canDeleteExpenses) {
      toast.error('No tienes permisos para eliminar gastos');
      return;
    }
    const pin = prompt('Ingrese su PIN de propietario para confirmar la eliminación:');
    if (pin) {
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        const result = await deleteExpense(expenseId);
        if (result.success) {
          toast.success('Gasto eliminado');
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('PIN incorrecto');
      }
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-CO')}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const thisMonthExpenses = useMemo(() => expenses.filter(e => {
    const expenseDate = new Date(e.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Gestión de Gastos</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mt-1">CONTROL DE EGRESOS Y NÓMINA</p>
        </div>
        <Dialog open={isNewExpenseOpen} onOpenChange={setIsNewExpenseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800 dark:hover:bg-white rounded-none shadow-lg h-11 px-8 text-xs font-bold uppercase tracking-widest transition-all border-none">
              <Plus className="w-4 h-4 mr-2 stroke-[2]" />
              Nuevo registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl bg-white dark:bg-zinc-950 p-0 focus-visible:outline-none">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
              <DialogTitle className="text-lg font-light tracking-widest uppercase text-zinc-900 dark:text-zinc-100">Registrar Gasto</DialogTitle>
              <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mt-2">INGRESA LOS DETALLES DEL EGRESO</p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Descripción</label>
                  <Input 
                    value={newExpense.description} 
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} 
                    placeholder="EJ: COMPRA DE INSUMOS O PAGO DE NÓMINA" 
                    required 
                    className="h-11 border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Monto</label>
                  <Input 
                    type="number" 
                    value={newExpense.amount} 
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} 
                    placeholder="0" 
                    min="0" 
                    required 
                    className="h-11 border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Categoría</label>
                  <select 
                    value={newExpense.category} 
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} 
                    className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest focus:outline-none focus:border-zinc-900"
                  >
                    {expenseCategories.map(cat => (<option key={cat} value={cat}>{cat.toUpperCase()}</option>))}
                  </select>
                </div>
                
                {newExpense.category === 'Nómina' ? (
                  <div>
                    <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Personal (Obligatorio)</label>
                    <select 
                      value={newExpense.staffId || ''} 
                      onChange={(e) => setNewExpense({ ...newExpense, staffId: e.target.value })} 
                      className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-none bg-zinc-50 dark:bg-zinc-900 text-xs uppercase tracking-widest focus:outline-none focus:border-zinc-900"
                    >
                      <option value="">SELECCIONAR EMPLEADO</option>
                      {staff.map(s => (<option key={s.id} value={s.id}>{s.name.toUpperCase()} ({s.role.toUpperCase()})</option>))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Proveedor (Opcional)</label>
                    <select 
                      value={newExpense.supplierId || ''} 
                      onChange={(e) => setNewExpense({ ...newExpense, supplierId: e.target.value })} 
                      className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest focus:outline-none focus:border-zinc-900"
                    >
                      <option value="">SELECCIONAR PROVEEDOR</option>
                      {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">Notas (Opcional)</label>
                  <textarea 
                    value={newExpense.notes} 
                    onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} 
                    placeholder="NOTAS ADICIONALES..." 
                    className="w-full p-4 border border-zinc-200 dark:border-zinc-800 rounded-none h-24 focus:outline-none focus:border-zinc-900 resize-none text-xs uppercase tracking-widest" 
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <Button 
                  type="submit" 
                  className="flex-1 h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-none shadow-none text-sm font-semibold uppercase tracking-wider"
                >
                  Confirmar Registro
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {[
          { label: 'TOTAL HISTÓRICO', value: formatCurrency(totalExpenses), icon: Receipt },
          { label: 'GASTO DEL MES', value: formatCurrency(thisMonthExpenses), icon: Calendar },
          { label: 'TRANSACCIONES', value: expenses.length, icon: Tag }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-8 border border-zinc-200/50 dark:border-white/5 flex items-center gap-6 glass-light dark:glass-dark border-glow-light dark:border-glow group hover:border-zinc-900 dark:hover:border-white transition-all">
            <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-500 flex items-center justify-center shadow-sm">
              <stat.icon className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.5]" />
        <Input 
          placeholder="FILTRAR POR DESCRIPCIÓN O CATEGORÍA..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-12 h-12 border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest placeholder:text-zinc-500 shadow-none" 
        />
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 overflow-hidden glass-light dark:glass-dark border-glow-light dark:border-glow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">FECHA</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">DESCRIPCIÓN</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">CATEGORÍA</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">ENTIDAD</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">MONTO</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredExpenses.map((expense) => {
                let entityName = '---';
                if (expense.category === 'Nómina' && expense.staffId) {
                  const employee = staff.find(s => s.id === expense.staffId);
                  entityName = employee ? employee.name.toUpperCase() : 'DESCONOCIDO';
                } else if (expense.supplierId) {
                  const supplier = suppliers.find(s => s.id === expense.supplierId);
                  entityName = supplier ? supplier.name.toUpperCase() : 'DESCONOCIDO';
                }

                return (
                  <tr key={expense.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono font-bold tracking-[0.1em] text-zinc-500 dark:text-zinc-500">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-xs tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{expense.description}</p>
                        {expense.notes && <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1 uppercase tracking-[0.2em] line-clamp-1 font-bold">{expense.notes}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase ${expense.category === 'Nómina' ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' : 'border border-zinc-200 dark:border-white/10 text-zinc-500'}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium tracking-widest uppercase text-zinc-500">{entityName}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-colors"><Trash2 className="w-4 h-4 stroke-[1.5]" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


