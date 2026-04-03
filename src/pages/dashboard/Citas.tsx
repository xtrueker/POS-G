import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Check, X, Wallet, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppointments } from '@/context/AppointmentContext';
import { useCustomer } from '@/context/CustomerContext';
import { useStaff } from '@/context/StaffContext';
import { useBusiness } from '@/context/BusinessContext';
import { useInventory } from '@/context/InventoryContext';
import { useWhatsAppEngine } from '@/hooks/useWhatsAppEngine';
import { VERTICAL_SERVICES } from '@/lib/constants';
import { toast } from 'sonner';

interface AppointmentFormData {
  customerId: string;
  customerName: string;
  service: string;
  productId?: string;
  staffId?: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
  price?: number;
}

export default function Citas() {
  const navigate = useNavigate();
  const { businessInfo } = useBusiness();
  const { appointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { customers } = useCustomer();
  const { staff } = useStaff();
  const { products, addProduct: addInventoryProduct } = useInventory();

  const businessVertical = businessInfo?.vertical || 'general';
  
  const availableServices = useMemo(() => {
    return products.filter(p => p.isService);
  }, [products]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  
  const [isQuickServiceOpen, setIsQuickServiceOpen] = useState(false);
  const [quickServiceData, setQuickServiceData] = useState({ name: '', price: '' });

  const handleQuickAddService = async () => {
    if (!quickServiceData.name || !quickServiceData.price) {
      toast.error('Nombre y precio requeridos');
      return;
    }
    const result = await addInventoryProduct({
      name: quickServiceData.name.toUpperCase(),
      description: 'SERVICIO AGREGADO DESDE AGENDA',
      price: parseFloat(quickServiceData.price),
      cost: 0,
      stock: 0,
      category: 'Servicios',
      minStock: 0,
      unit: 'un',
      isService: true
    });
    if (result.success) {
      toast.success('Servicio integrado al catálogo');
      // Recargar productos no es necesario porque context ya lo hace
      const newProduct = products.find(p => p.name === quickServiceData.name);
      setFormData(prev => ({ 
        ...prev, 
        service: quickServiceData.name.toUpperCase(), 
        price: Number(quickServiceData.price),
        productId: newProduct?.id 
      }));
      setIsQuickServiceOpen(false);
      setQuickServiceData({ name: '', price: '' });
    } else {
      toast.error(result.message);
    }
  };

  const handleCheckout = useCallback((apt: any) => {
    localStorage.setItem('pending_checkout', JSON.stringify({
      appointmentId: apt.id,
      customerId: apt.customerId,
      customerName: apt.customerName,
      items: [{
        productId: apt.productId || `svc-${apt.service.toLowerCase().replace(/\s+/g, '-')}`,
        name: apt.service,
        price: apt.price || 0,
        quantity: 1,
        staffId: apt.staffId,
        staffName: apt.staffName
      }]
    }));
    navigate('/dashboard/ventas');
    toast.info('Cita cargada en el punto de venta');
  }, [navigate]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [formData, setFormData] = useState<AppointmentFormData>({
    customerId: '',
    customerName: '',
    service: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: businessInfo?.settings?.beauty?.defaultDuration || 60,
    price: 0,
  });

  const { sendReminder } = useWhatsAppEngine();

  const handleSendReminder = useCallback(async (apt: any) => {
    const customer = customers.find(c => c.id === apt.customerId);
    if (!customer) {
      toast.error('Cliente no encontrado');
      return;
    }
    await sendReminder(apt, customer);
  }, [customers, sendReminder]);

  const filteredAppointments = appointments.filter(a => 
    a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customerId);
    const staffMember = staff.find(s => s.id === formData.staffId);
    
    const appointmentData = {
      ...formData,
      customerName: customer?.name || formData.customerName,
      staffName: staffMember?.name,
      status: 'pending' as const,
    };
    
    let result;
    if (editingAppointment) {
      result = await updateAppointment(editingAppointment, appointmentData);
    } else {
      result = await addAppointment(appointmentData);
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
      customerId: '', 
      customerName: '', 
      service: '', 
      productId: '',
      date: new Date().toISOString().split('T')[0], 
      time: '09:00', 
      duration: 60, 
      price: 0 
    });
    setEditingAppointment(null);
    setIsQuickServiceOpen(false);
    setQuickServiceData({ name: '', price: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de cancelar esta cita?')) {
      const result = await deleteAppointment(id);
      if (result.success) toast.success(result.message);
    }
  };

  const handleStatusChange = async (id: string, status: any) => {
     if (status === 'completed') {
       const apt = appointments.find(a => a.id === id);
       if (apt && (apt.price || 0) > 0) {
         handleCheckout(apt);
         toast.info('Redirigiendo a Punto de Venta para registrar el dinero');
         return;
       }
     }
     await updateAppointment(id, { status });
     toast.success(`Cita ${status}`);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-8 border-b border-zinc-100 dark:border-zinc-900 pb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Protocolos de Agenda</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-[0.1em] font-bold">Gestión de consultoría, servicios y soporte técnico</p>
        </div>
        <div className="flex gap-6">
          <div className="flex bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-none border border-zinc-100 dark:border-white/5 shadow-inner">
            <button onClick={() => setView('list')} className={`px-6 py-2.5 rounded-none text-[10px] font-bold tracking-[0.2em] transition-all ${view === 'list' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl' : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white'}`}>LISTA</button>
            <button onClick={() => setView('calendar')} className={`px-6 py-2.5 rounded-none text-[10px] font-bold tracking-[0.2em] transition-all ${view === 'calendar' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl' : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white'}`}>CALENDARIO</button>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold h-14 px-8 rounded-none text-xs tracking-wider shadow-2xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all">
            <Plus className="w-5 h-5 mr-3 stroke-[1.5]" />
            PROGRAMAR CITA
          </Button>
        </div>
      </div>

      <div className="relative border-b border-zinc-100 dark:border-white/5 pb-8">
        <Search className="absolute left-0 top-0 mt-3.5 w-4 h-4 text-zinc-300 dark:text-zinc-600 stroke-[2.5]" />
        <Input 
          placeholder="RASTREAR POR CLIENTE O CATEGORÍA DE SERVICIO..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full h-12 pl-12 bg-transparent border-none outline-none text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-100 dark:placeholder:text-zinc-900 transition-colors" 
        />
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {view === 'list' ? (
          <div className="overflow-x-auto glass-light dark:glass-dark border-glow-light dark:border-glow">
            <table className="w-full border-collapse">
               <thead>
                 <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100/50 dark:border-white/5">
                   <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">CONSUMIDOR</th>
                   <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">ESPECIFICACIÓN</th>
                   <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">TEMPORALIDAD</th>
                   <th className="px-8 py-6 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">ESTADO</th>
                   <th className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">ACCIÓN</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100/50 dark:divide-white/5">
                 {filteredAppointments.map(apt => (
                   <tr key={apt.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-none flex items-center justify-center text-sm font-light shadow-xl">
                           {apt.customerName.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <p className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-900 dark:text-zinc-100">{apt.customerName}</p>
                           <p className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-600">ID: {apt.id.slice(0,8).toUpperCase()}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.15em]">{apt.service}</p>
                       <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-bold mt-1">{apt.duration} MINUTOS</p>
                     </td>
                     <td className="px-8 py-6">
                       <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 tracking-[0.1em]">{new Date(apt.date).toLocaleDateString()}</p>
                       <p className="text-sm text-zinc-900 dark:text-white font-black tracking-tighter mt-1">{apt.time}</p>
                     </td>
                     <td className="px-8 py-6">
                       <span className={`px-4 py-2 rounded-none text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm ${apt.status === 'completed' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900' : apt.status === 'pending' ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-zinc-900 shadow-zinc-900/10' : 'bg-transparent text-zinc-300 border-zinc-200 opacity-50'}`}>
                         {apt.status === 'pending' ? 'PENDIENTE' : apt.status === 'completed' ? 'FINALIZADO' : apt.status.toUpperCase()}
                       </span>
                     </td>
                     <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => handleStatusChange(apt.id, 'completed')} className="p-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:scale-110 transition-transform"><Check className="w-4 h-4" /></button>
                         <button onClick={() => handleDelete(apt.id)} className="p-3 border border-zinc-200 dark:border-white/5 text-zinc-400 hover:text-red-600 dark:hover:text-red-500 hover:border-red-600 transition-all"><X className="w-4 h-4" /></button>
                       </div>
                     </td>
                   </tr>
                 ))}
                 {filteredAppointments.length === 0 && (
                   <tr><td colSpan={5} className="px-8 py-24 text-center text-zinc-300 dark:text-zinc-700 font-bold text-[10px] uppercase tracking-[0.3em]">Cero incidencias en agenda</td></tr>
                 )}
               </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-100/50 dark:divide-white/5 glass-light dark:glass-dark border-glow-light dark:border-glow">
            <div className="w-full lg:w-[480px] p-10 bg-white/50 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase">
                  {new Date(displayMonth).toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </h2>
                <div className="flex gap-3">
                  <button onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))} className="p-3 rounded-none border border-zinc-100 dark:border-white/5 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))} className="p-3 rounded-none border border-zinc-100 dark:border-white/5 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-y-8 gap-x-2 text-center">
                {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => (
                   <div key={day} className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">{day}</div>
                ))}
                
                {Array.from({ length: new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay() }).map((_, i) => (
                   <div key={`empty-${i}`} className="p-2" />
                ))}
                
                {Array.from({ length: new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                   const cellDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
                   const isSelected = cellDate.toDateString() === currentDate.toDateString();
                   const isToday = cellDate.toDateString() === new Date().toDateString();
                   const dateStr = cellDate.toISOString().split('T')[0];
                   const dayAppointments = appointments.filter(a => a.date === dateStr);
                   const hasAppointments = dayAppointments.length > 0;
                   
                   return (
                     <button
                       key={day}
                       onClick={() => setCurrentDate(cellDate)}
                       className={`relative h-14 w-full flex items-center justify-center rounded-none text-sm font-light transition-all duration-300 border
                         ${isSelected ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xl scale-110 z-10' : 
                           isToday ? 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10' : 
                            'border-transparent text-zinc-400 dark:text-zinc-600 hover:border-zinc-900 dark:hover:border-white hover:text-zinc-900 dark:hover:text-white'
                         }
                       `}
                     >
                       <span className="relative z-10">{day}</span>
                       {hasAppointments && (
                         <div className="absolute top-1 right-1">
                           <div className={`w-1.5 h-1.5 rounded-none ${isSelected ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-900 dark:bg-white'} animate-pulse`} />
                         </div>
                       )}
                     </button>
                   );
                })}
              </div>
            </div>

            <div className="flex-1 bg-zinc-50/30 dark:bg-zinc-900/10 p-10">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.25em] mb-3">AGENDA CRONOLÓGICA</p>
                  <h2 className="text-3xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase">
                     {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                  </h2>
                </div>
                <div className="w-16 h-16 bg-white dark:bg-zinc-950 rounded-none shadow-2xl border border-zinc-100/50 dark:border-white/10 flex items-center justify-center text-2xl font-light text-zinc-900 dark:text-zinc-100">
                  {currentDate.getDate()}
                </div>
              </div>

              <div className="space-y-6">
                {appointments.filter(a => a.date === currentDate.toISOString().split('T')[0]).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-zinc-100 dark:border-white/5 opacity-40">
                    <CalendarIcon className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-6 stroke-[1]" />
                    <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.3em]">Ventana de tiempo inactiva</p>
                  </div>
                ) : (
                  appointments.filter(a => a.date === currentDate.toISOString().split('T')[0]).sort((a,b) => a.time.localeCompare(b.time)).map(apt => (
                    <div key={apt.id} className="group p-8 bg-white dark:bg-zinc-950 border border-zinc-100/50 dark:border-white/5 hover:border-zinc-900 dark:hover:border-white transition-all duration-500 relative overflow-hidden glass-light dark:glass-dark shadow-sm hover:shadow-2xl">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 dark:bg-white scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pl-4">
                        <div className="flex items-start gap-8">
                          <div className="w-20 h-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-none flex flex-col items-center justify-center shadow-xl flex-shrink-0 transition-transform group-hover:-translate-y-1">
                            <span className="text-2xl font-light">{apt.time.split(':')[0]}</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest">{apt.time.split(':')[1]} MIN</span>
                          </div>
                          <div className="space-y-2">
                            <p className="font-bold text-xl text-zinc-900 dark:text-zinc-100 tracking-tight uppercase leading-none mb-1">{apt.customerName}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 px-3 py-1 uppercase tracking-[0.1em]">{apt.service}</span>
                              <span className="text-[9px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em]">{apt.duration} MINUTOS</span>
                            </div>
                            {apt.staffName && (
                              <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mt-6">
                                OPERADOR ASIGNADO: <span className="text-zinc-900 dark:text-zinc-100">{apt.staffName.toUpperCase()}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center sm:flex-col justify-between sm:justify-start gap-4">
                          <span className={`px-5 py-2.5 rounded-none text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm ${apt.status === 'completed' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900' : apt.status === 'pending' ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-zinc-200 shadow-zinc-900/5' : 'bg-transparent text-zinc-200 border-zinc-100 opacity-50'}`}>
                            {apt.status === 'pending' ? 'EN ESPERA' : apt.status === 'completed' ? 'ATENDIDO' : apt.status.toUpperCase()}
                          </span>
                          {apt.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleSendReminder(apt)} className="text-[9px] font-bold text-white bg-emerald-600 border border-emerald-600 px-5 py-2.5 rounded-none hover:bg-emerald-700 transition-all shadow-xl flex items-center gap-2">
                                <MessageCircle className="w-3 h-3" /> RECORDAR
                              </button>
                              <button onClick={() => handleCheckout(apt)} className="text-[9px] font-bold text-white bg-zinc-900 dark:bg-zinc-800 border border-zinc-900 px-5 py-2.5 rounded-none hover:bg-zinc-800 transition-all shadow-xl flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> COBRAR
                              </button>
                              <button onClick={() => handleStatusChange(apt.id, 'completed')} className="text-[9px] font-bold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white border border-zinc-900 dark:border-white px-5 py-2.5 rounded-none hover:tracking-[0.15em] transition-all shadow-xl">
                                ATENDER
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-2xl z-[70] flex items-center justify-center p-8">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 rounded-none w-full max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-12 duration-500 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-zinc-100/50 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="space-y-1">
                <h2 className="text-xl font-light uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">{editingAppointment ? 'RECTIFICAR CITA' : 'PROGRAMACIÓN DE AGENDA'}</h2>
                <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Reserva de Servicios</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="p-3 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-900 dark:hover:border-white"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">IDENTIDAD DEL CONSUMIDOR</label>
                  <select required value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="w-full h-12 px-6 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100/50 dark:border-white/5 rounded-none outline-none text-xs uppercase tracking-[0.2em] font-bold focus:border-zinc-900 dark:focus:border-white transition-colors appearance-none"><option value="">SELECCIONAR CLIENTE DEL REGISTRO</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}</select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">ESPECIFICACIÓN DEL SERVICIO</label>
                    <button type="button" onClick={() => setIsQuickServiceOpen(!isQuickServiceOpen)} className="text-[9px] font-bold text-zinc-900 dark:text-white uppercase tracking-widest hover:underline transition-all">{isQuickServiceOpen ? 'VOLVER AL CATÁLOGO' : '+ NUEVO TIPO DE TRABAJO'}</button>
                  </div>
                  
                  {isQuickServiceOpen ? (
                    <div className="p-6 bg-zinc-900 border border-zinc-800 space-y-6 animate-in slide-in-from-top-4 duration-500">
                       <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">NOMBRE DEL SERVICIO</label>
                            <Input placeholder="EJ: CORTE + BARBA" value={quickServiceData.name} onChange={e => setQuickServiceData({...quickServiceData, name: e.target.value.toUpperCase()})} className="h-12 text-xs font-bold uppercase tracking-widest rounded-none border-zinc-800 focus:border-white bg-transparent" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">PRECIO DE VENTA</label>
                            <Input type="number" placeholder="0.00" value={quickServiceData.price} onChange={e => setQuickServiceData({...quickServiceData, price: e.target.value})} className="h-12 text-xs font-bold uppercase tracking-widest rounded-none border-zinc-800 focus:border-white bg-transparent" />
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <Button type="button" onClick={handleQuickAddService} className="flex-1 h-12 bg-white text-zinc-900 text-[10px] font-bold uppercase rounded-none tracking-widest hover:bg-zinc-200 transition-all">REGISTRAR</Button>
                          <Button type="button" variant="outline" onClick={() => setIsQuickServiceOpen(false)} className="px-6 h-12 border-zinc-800 text-white text-[10px] font-bold uppercase rounded-none tracking-widest">ANULAR</Button>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {businessVertical === 'beauty' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                           {[
                             { name: 'CORTE', icon: '✂️', time: 30 },
                             { name: 'MANICURE', icon: '💅', time: 45 },
                             { name: 'MAQUILLAJE', icon: '💄', time: 60 },
                             { name: 'MASAJE', icon: '💆', time: 60 }
                           ].map(p => (
                             <button
                               key={p.name}
                               type="button"
                               onClick={() => setFormData({...formData, service: p.name, duration: p.time})}
                               className={`flex flex-col items-center justify-center p-2 border border-zinc-100 dark:border-white/5 hover:border-zinc-900 dark:hover:border-white transition-all group ${formData.service === p.name ? 'bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white' : 'bg-white dark:bg-zinc-950'}`}
                             >
                               <span className="text-lg mb-1 group-hover:scale-125 transition-transform">{p.icon}</span>
                               <span className={`text-[7px] font-bold uppercase tracking-widest ${formData.service === p.name ? 'text-white dark:text-zinc-900' : 'text-zinc-400'}`}>{p.name}</span>
                             </button>
                           ))}
                        </div>
                      )}
                      <select required value={formData.productId || ''} onChange={(e) => {
                        const selected = products.find(p => p.id === e.target.value);
                        if (selected) {
                          setFormData({
                            ...formData, 
                            productId: selected.id,
                            service: selected.name, 
                            price: selected.price,
                            duration: selected.duration || formData.duration
                          });
                        }
                      }} className="w-full h-12 px-6 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100/50 dark:border-white/5 rounded-none outline-none text-xs uppercase tracking-[0.2em] font-bold focus:border-zinc-900 dark:focus:border-white transition-colors appearance-none"><option value="">DEFINIR CATEGORIA DE ATENCION</option>{availableServices.map((s: any) => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}</select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">PROFESIONAL ASIGNADO</label>
                  <select required={businessVertical === 'beauty'} value={formData.staffId || ''} onChange={(e) => setFormData({...formData, staffId: e.target.value})} className="w-full h-12 px-6 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100/50 dark:border-white/5 rounded-none outline-none text-xs uppercase tracking-[0.2em] font-bold focus:border-zinc-900 dark:focus:border-white transition-colors appearance-none"><option value="">SELECCIONAR ESPECIALISTA</option>{staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}</select>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">VENTANA TEMPORAL</label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">INICIO</label>
                    <Input type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">PRECIO</label>
                    <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-12 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent" placeholder="0.00" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">MINUTOS</label>
                    <Input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})} className="h-12 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent" placeholder="60" />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-100/50 dark:border-white/5">
                  <Button type="button" onClick={() => { resetForm(); setShowModal(false); }} variant="outline" className="flex-1 h-14 rounded-none border-zinc-200 dark:border-white/10 text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all opacity-60">DESCARTAR</Button>
                  <Button type="submit" className="flex-1 h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-[0.2em] rounded-none shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all">CONSOLIDAR</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
