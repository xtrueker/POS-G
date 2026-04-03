import { useState, useMemo, useEffect } from 'react';
import { 
  Search, Star, Crown, 
  UserPlus, ChevronRight,
  Trash2, X, 
  Award, Zap
} from 'lucide-react';
import { useCustomer } from '@/context/CustomerContext';
import { useStaff } from '@/context/StaffContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Customer } from '@/types';

const TIERS = {
  bronze: { name: 'ESTÁNDAR', color: 'bg-zinc-100', textColor: 'text-zinc-500', icon: <Award className="w-4 h-4 stroke-[1.5]" />, minPoints: 0, multiplier: 1 },
  silver: { name: 'FRECUENTE', color: 'bg-zinc-200', textColor: 'text-zinc-500', icon: <Star className="w-4 h-4 stroke-[1.5]" />, minPoints: 1000, multiplier: 1.25 },
  gold: { name: 'PREMIUM', color: 'bg-zinc-800', textColor: 'text-zinc-900 dark:text-zinc-100', icon: <Crown className="w-4 h-4 stroke-[1.5]" />, minPoints: 2500, multiplier: 1.5 },
  platinum: { name: 'ELITE', color: 'bg-zinc-950', textColor: 'text-zinc-950', icon: <Zap className="w-4 h-4 stroke-[1.5]" />, minPoints: 5000, multiplier: 2 },
};

export default function Fidelizacion() {
  const { user } = useAuth();
  const { staff } = useStaff();
  const navigate = useNavigate();
  const { customers, deleteCustomer, addLoyaltyPoints, redeemLoyaltyPoints } = useCustomer();
  const { verifyOwnerPin } = useStaff();

  // Security gate
  const isSuperAdmin = user?.email === 'andresguillen1128@gmail.com' || (user as any)?.user_metadata?.role === 'superadmin';
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const isOwnerOrAdmin = isSuperAdmin || currentStaff?.role === 'owner' || currentStaff?.role === 'admin';

  useEffect(() => {
    if (staff.length > 0 && !isOwnerOrAdmin) {
      navigate('/dashboard', { replace: true });
      toast.error('Acceso Restringido: El programa de Fidelización solo puede ser gestionado por administradores', { id: 'security-block-loyalty' });
    }
  }, [staff, isOwnerOrAdmin, navigate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier] = useState<'' | 'bronze' | 'silver' | 'gold' | 'platinum'>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsAction, setPointsAction] = useState<'add' | 'redeem'>('add');
  const [pointsAmount, setPointsAmount] = useState(100);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchTerm));
      const matchesTier = !selectedTier || customer.tier === selectedTier;
      return matchesSearch && matchesTier;
    });
  }, [customers, searchTerm, selectedTier]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    const tierCounts = {
      bronze: customers.filter(c => c.tier === 'bronze').length,
      silver: customers.filter(c => c.tier === 'silver').length,
      gold: customers.filter(c => c.tier === 'gold').length,
      platinum: customers.filter(c => c.tier === 'platinum').length,
    };
    return { totalCustomers, totalPoints, tierCounts };
  }, [customers]);

  const handlePointsAction = async () => {
    if (!selectedCustomer) return;
    if (pointsAction === 'add') {
      await addLoyaltyPoints(selectedCustomer.id, pointsAmount, 'Ajuste manual');
      toast.success(`Se añadieron ${pointsAmount} puntos`);
    } else {
      const result = await redeemLoyaltyPoints(selectedCustomer.id, pointsAmount);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    }
    setShowPointsModal(false);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    const pin = prompt('Ingrese PIN de propietario para eliminar cliente:');
    if (pin) {
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        const result = await deleteCustomer(selectedCustomer.id);
        if (result.success) {
          toast.success(result.message);
          setShowDetailModal(false);
        }
      } else {
        toast.error('PIN incorrecto');
      }
    }
  };  return (
    <>
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-8 border-b border-zinc-100 dark:border-zinc-900 pb-8">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Sistema de Fidelización</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-[0.1em] font-bold mt-2">Gestión de activos de lealtad y retención</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-8 h-12 bg-zinc-900 text-white rounded-none font-bold text-xs uppercase tracking-wider flex items-center gap-3 hover:bg-zinc-800 transition-all shadow-none">
          <UserPlus className="w-4 h-4 stroke-[1.5]" />
          VINCULAR CONSUMIDOR
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'BASE INSTALADA', value: stats.totalCustomers, color: 'text-zinc-900 dark:text-zinc-100' },
          { label: 'LIQUIDEZ DE PUNTOS', value: stats.totalPoints.toLocaleString(), color: 'text-zinc-500' },
          { label: 'SEGMENTO PREMIUM', value: stats.tierCounts.gold, color: 'text-amber-600 dark:text-amber-500' },
          { label: 'SEGMENTO CRÍTICO', value: stats.tierCounts.platinum, color: 'text-zinc-950 dark:text-white' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 rounded-none p-8 space-y-3 glass-light dark:glass-dark border-glow-light dark:border-glow group">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{stat.label}</p>
            <p className={`text-4xl font-light tracking-tighter ${stat.color} leading-none`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="relative border-b border-zinc-100 dark:border-white/5 pb-8">
        <Search className="absolute left-0 top-0 mt-3.5 w-4 h-4 text-zinc-300 dark:text-zinc-600 stroke-[2.5]" />
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="REASTREAR POR NOMBRE, IDENTIDAD O CANAL DE CONTACTO..." 
          className="w-full h-12 pl-12 bg-transparent border-none outline-none text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-200 dark:placeholder:text-zinc-800" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCustomers.map(customer => {
          const tier = TIERS[customer.tier as keyof typeof TIERS] || TIERS.bronze;
          return (
            <div key={customer.id} onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }} className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 rounded-none p-8 cursor-pointer hover:border-zinc-900 dark:hover:border-white transition-all group relative overflow-hidden glass-light dark:glass-dark border-glow-light dark:border-glow">
               <div className="flex items-start justify-between mb-8">
                 <div className="flex items-center gap-6">
                   <div className={`w-16 h-16 ${tier.color} rounded-none flex items-center justify-center ${customer.tier === 'gold' || customer.tier === 'platinum' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'} font-light text-3xl shadow-xl transition-transform group-hover:scale-110`}>
                     {customer.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="space-y-2">
                     <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm tracking-[0.15em] uppercase leading-none">{customer.name}</h3>
                     <div className="flex items-center gap-3">
                       <span className={`p-1 border border-zinc-100 dark:border-white/5 ${tier.textColor}`}>{tier.icon}</span>
                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">{tier.name}</span>
                     </div>
                   </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-zinc-100 group-hover:text-zinc-900 dark:text-zinc-100 transition-all stroke-[1.5]" />
               </div>
               
               <div className="grid grid-cols-2 gap-8 border-t border-zinc-100/50 dark:border-white/5 pt-8 mt-4">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-2">BALANCE ACTIVO</p>
                    <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter">{customer.loyaltyPoints.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-2">RENDIMIENTO LTV</p>
                    <p className="text-xs font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em]">{customer.lifetimePoints.toLocaleString()}</p>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md z-50 flex items-center justify-center p-8">
           <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 rounded-none w-full max-w-xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500 overflow-hidden glass-light dark:glass-dark">
             <div className="p-10 border-b border-zinc-100/50 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
               <div className="space-y-1">
                 <h2 className="text-xl font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">EXPEDIENTE DE LEALTAD</h2>
                 <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Protocolo de Reconocimiento y Retención</p>
               </div>
               <button onClick={() => setShowDetailModal(false)} className="p-3 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-900 dark:hover:border-white"><X className="w-5 h-5 stroke-[1.5]" /></button>
             </div>
             
             <div className="p-12 space-y-12">
                <div className="flex items-center gap-10">
                   <div className={`w-28 h-28 ${TIERS[selectedCustomer.tier as keyof typeof TIERS].color} rounded-none flex items-center justify-center ${selectedCustomer.tier === 'gold' || selectedCustomer.tier === 'platinum' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'} text-5xl font-light shadow-2xl border border-zinc-900/10 dark:border-white/10 relative group`}>
                     <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20"></div>
                     {selectedCustomer.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="space-y-3">
                     <h2 className="text-4xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase leading-none">{selectedCustomer.name}</h2>
                     <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-bold">{selectedCustomer.email || 'CANAL DE CONTACTO NO REGISTRADO'}</p>
                     <div className="flex items-center gap-4 mt-6 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 w-fit shadow-xl">
                       {TIERS[selectedCustomer.tier as keyof typeof TIERS].icon}
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em]">PROTOCOL {selectedCustomer.tier}</span>
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                   <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100/50 dark:border-white/5 p-10 space-y-3 glass-light dark:glass-dark">
                     <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">BALANCE DISPONIBLE</p>
                     <p className="text-5xl font-light text-zinc-900 dark:text-zinc-100 tracking-tighter leading-none">{selectedCustomer.loyaltyPoints}</p>
                   </div>
                   <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100/50 dark:border-white/5 p-10 space-y-3 glass-light dark:glass-dark">
                     <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">RENDIMIENTO LTV</p>
                     <p className="text-3xl font-light text-zinc-400 dark:text-zinc-600 tracking-tighter leading-none">{selectedCustomer.lifetimePoints}</p>
                   </div>
                </div>

                <div className="flex gap-6 pt-6">
                  <Button onClick={() => { setPointsAction('add'); setShowPointsModal(true); }} className="flex-1 h-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs uppercase tracking-[0.2em] rounded-none hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-2xl">AJUSTAR ACTIVOS</Button>
                  <button onClick={handleDelete} className="w-20 h-20 border border-zinc-200 dark:border-white/10 text-zinc-300 dark:text-zinc-700 flex items-center justify-center rounded-none hover:text-red-600 dark:hover:text-red-500 hover:border-red-600 transition-all glass-light dark:glass-dark">
                    <Trash2 className="w-6 h-6 stroke-[1.5]" />
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {showPointsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xl z-[60] flex items-center justify-center p-8">
           <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/10 rounded-none w-full max-w-sm p-12 shadow-[0_0_80px_rgba(0,0,0,0.4)] animate-in zoom-in-95 duration-200 glass-light dark:glass-dark">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-10 text-center">{pointsAction === 'add' ? 'INCREMENTO DE ACTIVOS' : 'REDUCCIÓN POR CANJE'}</h3>
             <div className="relative mb-10">
               <input 
                 type="number" 
                 value={pointsAmount} 
                 onChange={(e) => setPointsAmount(Number(e.target.value))} 
                 className="w-full h-24 bg-zinc-50/50 dark:bg-zinc-900/50 border-b-2 border-zinc-900 dark:border-white rounded-none text-center text-6xl font-light tracking-tighter focus:bg-zinc-100 transition-all outline-none text-zinc-900 dark:text-zinc-100" 
               />
               <span className="absolute right-0 bottom-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">PTS</span>
             </div>
             <div className="flex gap-4">
               <button onClick={() => setShowPointsModal(false)} className="flex-1 h-14 text-zinc-400 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-zinc-900 dark:hover:text-white transition-colors">CANCELAR</button>
               <Button onClick={handlePointsAction} className="flex-1 h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-[0.2em] rounded-none hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-xl">EJECUTAR</Button>
             </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xl z-[70] flex items-center justify-center p-8">
           <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-none w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-12 duration-500 overflow-hidden">
             <div className="bg-zinc-900 p-12 text-center relative overflow-hidden">
               <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 p-3 bg-white dark:bg-zinc-950/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all z-10"><X className="w-5 h-5 stroke-[1.5]"/></button>
               <UserPlus className="w-16 h-16 text-white mx-auto mb-8 relative z-10 stroke-[1]" />
               <h2 className="text-2xl font-light text-white relative z-10 tracking-[0.15em] uppercase">VINCULAR CONSUMIDOR</h2>
               <div className="mt-4 px-6 py-2 bg-white text-zinc-900 text-[10px] font-extrabold tracking-[0.2em] uppercase inline-block relative z-10 shadow-xl">Protocolo de Fidelización</div>
             </div>
             
             <div className="p-12 space-y-10">
               <div className="space-y-3">
                 <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">Identidad Nominal</label>
                 <Input className="h-14 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent" placeholder="NOMBRE COMPLETO" />
               </div>
               
               <div className="space-y-3">
                 <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] block">Canal de Contacto</label>
                 <Input className="h-14 rounded-none border-zinc-200 dark:border-white/5 focus:border-zinc-900 dark:focus:border-white focus-visible:ring-0 text-xs font-bold uppercase tracking-[0.2em] bg-transparent" placeholder="TELÉFONO O CORREO ELECTRÓNICO" />
               </div>

               <Button onClick={() => {toast.success("Consumidor vinculado al ecosistema POS-G"); setShowAddModal(false);}} className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm uppercase tracking-[0.2em] rounded-none shadow-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all">ESTABLECER VÍNCULO</Button>
             </div>
           </div>
        </div>
      )}
    </div>
    </>
  );
}


