import { useState, useMemo, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation as useReactRouterLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  FileText,
  UserCog,
  MapPin,
  Tag,
  Calendar,
  Shield,
  Heart,
  ChefHat,
  Activity,
  Box,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useSecurity } from '@/context/SecurityContext';
import { useInventory } from '@/context/InventoryContext';
import { useStaff } from '@/context/StaffContext';
import { toast } from 'sonner';
import { useBusiness } from '@/context/BusinessContext';
import ThemeToggle from '@/components/common/ThemeToggle';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { path: '/dashboard/citas', icon: Calendar, label: 'Agenda' },
  { path: '/dashboard/ventas', icon: ShoppingCart, label: 'Punto de Venta' },
  { path: '/dashboard/clientes', icon: Users, label: 'Fichas Clientes' },
  { path: '/dashboard/inventario', icon: Package, label: 'Servicios y Productos' },
  { path: '/dashboard/personal', icon: UserCog, label: 'Colaboradores' },
  { path: '/dashboard/gastos', icon: Receipt, label: 'Egresos' },
  { path: '/dashboard/facturas', icon: FileText, label: 'Registro de Ventas' },
  { path: '/dashboard/reportes', icon: BarChart3, label: 'Estadísticas' },
  { path: '/dashboard/fidelizacion', icon: Heart, label: 'Fidelización' },
  { path: '/dashboard/promociones', icon: Tag, label: 'Marketing' },
  { path: '/dashboard/proveedores', icon: Truck, label: 'Proveedores' },
  { path: '/dashboard/ubicaciones', icon: MapPin, label: 'Sedes' },
  { path: '/dashboard/auditoria', icon: Shield, label: 'Seguridad' },
  { path: '/dashboard/recetas', icon: ChefHat, label: 'Fórmulas' }, // Hidden for beauty
  { path: '/dashboard/produccion', icon: Activity, label: 'Producción' }, // Hidden for beauty
  { path: '/dashboard/insumos', icon: Box, label: 'Insumos' }, // Hidden for beauty
  { path: '/dashboard/checklists', icon: ClipboardCheck, label: 'Auditables' }, // Hidden for beauty
];

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { currentLocation, locations, setCurrentLocation, addLocation, loading: locationsLoading } = useLocation();
  const { isOffline, securityAlerts } = useSecurity();
  const { products } = useInventory();
  const { staff, hasPermission } = useStaff();
  const { businessInfo } = useBusiness();
  const navigate = useNavigate();
  const reactLocation = useReactRouterLocation();

  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const userRole = currentStaff?.role || (user as any)?.user_metadata?.role || 'cashier';
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  const availableLocations = useMemo(() => {
    if (isOwnerOrAdmin) return locations;
    return locations.filter(l => l.id === currentStaff?.locationId);
  }, [locations, isOwnerOrAdmin, currentStaff]);

  useEffect(() => {
    if (!isOwnerOrAdmin && availableLocations.length > 0) {
      if (!currentLocation || currentLocation.id !== availableLocations[0].id) {
        setCurrentLocation(availableLocations[0]);
      }
    }
  }, [isOwnerOrAdmin, availableLocations, currentLocation, setCurrentLocation]);
  
  // Mandatory First Location State
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationPhone, setNewLocationPhone] = useState('');
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);

  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= p.minStock), [products]);

  const handleCreateFirstLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) {
      toast.error('El nombre de la sede es obligatorio');
      return;
    }
    setIsSubmittingLocation(true);
    const result = await addLocation({
      name: newLocationName,
      address: newLocationAddress,
      phone: newLocationPhone,
      isActive: true
    });
    setIsSubmittingLocation(false);
    if (result.success) {
      toast.success('¡Excelente! Primera sede configurada');
    } else {
      toast.error(result.message);
    }
  };

  const showMandatoryLocationModal = !locationsLoading && locations.length === 0;

  // Paywall SaaS Logic
  const isSuperAdmin = userRole === 'superadmin' || user?.email === 'andresguillen1128@gmail.com';
  
  const isSubscriptionExpired = useMemo(() => {
    if (isSuperAdmin) return false;
    if (!businessInfo?.subscriptionEndDate) return false;
    const endDate = new Date(businessInfo.subscriptionEndDate);
    const now = new Date();
    return endDate < now || businessInfo.subscriptionStatus !== 'active';
  }, [businessInfo, isSuperAdmin]);




  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada');
      navigate('/login');
    } catch (err) {
      toast.error('Error al cerrar sesión');
    }
  };

  const notifications = securityAlerts.slice(0, 5);

  return (
    <div className="flex h-screen bg-[#fcfcfc] dark:bg-[#000000] font-sans antialiased text-zinc-900 dark:text-zinc-400">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#050505] border-r border-zinc-200/50 dark:border-white/5 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full custom-scrollbar overflow-y-auto">
          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100/50 dark:border-white/5 bg-white dark:bg-[#050505]">
            <NavLink to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <span className="text-white dark:text-zinc-900 font-semibold text-lg tracking-widest leading-none mt-0.5">G</span>
              </div>
              <span className="font-bold tracking-[0.2em] text-zinc-900 dark:text-zinc-100 uppercase transition-colors group-hover:text-black dark:group-hover:text-white">POS-G</span>
            </NavLink>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-colors"><X className="w-5 h-5 text-zinc-500" /></button>
          </div>

          <div className="p-4 border-b border-zinc-100 dark:border-zinc-900">
             <div className="relative group">
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-100" />
               <select 
                 value={currentLocation?.id || ''} 
                 onChange={(e) => { const loc = availableLocations.find(l => l.id === e.target.value); if (loc) setCurrentLocation(loc); }} 
                 className="w-full h-10 pl-10 pr-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-sm font-semibold tracking-widest uppercase appearance-none cursor-pointer focus:ring-0 focus:border-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-zinc-700"
                 disabled={!isOwnerOrAdmin || availableLocations.length <= 1}
               >
                 {availableLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
               </select>
             </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {navItems.filter(item => {
              const businessVertical = businessInfo?.vertical || 'general';
              const isLoyaltyEnabled = businessInfo?.settings?.enable_loyalty ?? true;

              // --- STRICT VISIBILITY RULES ---
              // Filter out non-beauty modules if in beauty vertical
              if (businessVertical === 'beauty') {
                const hiddenForBeauty = [
                  '/dashboard/recetas',
                  '/dashboard/produccion',
                  '/dashboard/insumos',
                  '/dashboard/checklists'
                ];
                if (hiddenForBeauty.includes(item.path)) return false;
              } else if (businessVertical === 'bakery' || businessVertical === 'gastronomy') {
                if (item.path === '/dashboard/citas') return false;
              }

              if (isOwnerOrAdmin) {
                if (item.path === '/dashboard/fidelizacion' && !isLoyaltyEnabled) return false;
                return true;
              }

              // --- PERMISSIONS ---
              if (item.path === '/dashboard') return true;
              if (item.path === '/dashboard/citas') return hasPermission('appointments' as any) || isOwnerOrAdmin;
              if (item.path === '/dashboard/ventas') return hasPermission('sales' as any);
              if (item.path === '/dashboard/facturas') return hasPermission('invoices' as any);
              if (item.path === '/dashboard/inventario') return hasPermission('inventory' as any);
              if (item.path === '/dashboard/clientes') return hasPermission('customers' as any);
              if (item.path === '/dashboard/reportes') return isOwnerOrAdmin;
              
              if (item.path === '/dashboard/personal' || item.path === '/dashboard/ubicaciones') {
                return hasPermission('staff' as any) || hasPermission('locations' as any);
              }

              if (item.path === '/dashboard/fidelizacion' || item.path === '/dashboard/promociones') {
                if (item.path === '/dashboard/fidelizacion' && !isLoyaltyEnabled) return false;
                return isOwnerOrAdmin;
              }

              if (item.path === '/dashboard/auditoria') return isOwnerOrAdmin || hasPermission('audit' as any);
              if (item.path === '/dashboard/proveedores') return isOwnerOrAdmin;

              return false;
            }).map((item) => (
              <NavLink key={item.path} to={item.path} onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)} className={({ isActive }) => `group relative flex items-center gap-3 px-4 py-3 border border-transparent transition-all duration-200 ${isActive ? 'bg-zinc-50/80 dark:bg-zinc-900 border-l border-l-zinc-900 border-y-zinc-200/50 border-r-zinc-200/50 text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-900 dark:bg-zinc-900 hover:text-zinc-900 dark:text-zinc-100 hover:border-zinc-200/50 dark:border-zinc-800'}`}>
                {({ isActive }) => (
                  <>
                    <div className={`w-0.5 h-full absolute left-0 bg-zinc-900 dark:bg-white transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                    <item.icon className={`w-4 h-4 stroke-[1.5] transition-colors ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'}`} />
                    <span className={`flex-1 transition-colors ${isActive ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 dark:text-zinc-500'}`}>{item.label}</span>
                    {isActive && <div className="w-1 h-1 bg-zinc-900 dark:bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 space-y-1">
            {isOwnerOrAdmin && (
              <NavLink to="/dashboard/configuracion" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 border border-transparent transition-all ${isActive ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 hover:text-zinc-900 dark:text-zinc-100 hover:border-zinc-200 dark:border-zinc-800'}`}><Settings className="w-4 h-4 stroke-[1.5]" /><span className="text-sm font-semibold uppercase tracking-widest">Ajustes</span></NavLink>
            )}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600/80 hover:bg-red-50 hover:text-red-600 transition-all font-semibold text-sm uppercase tracking-widest border border-transparent hover:border-red-100"><LogOut className="w-4 h-4 stroke-[1.5]" />Cerrar Sesión</button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 lg:h-20 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-white/5 flex items-center justify-between px-6 sticky top-0 z-40 glass-light border-glow-light">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-colors"><Menu className="w-5 h-5 text-zinc-900 dark:text-zinc-100" /></button>
            <span className="font-semibold tracking-wider text-zinc-900 dark:text-zinc-100 uppercase">POS-G</span>
          </div>

          <div className="hidden lg:flex items-center gap-4 flex-1 max-w-xl">
             <div className="relative w-full group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-focus-within:text-zinc-900 dark:text-zinc-100" /><input type="text" placeholder="BUSCAR EN EL SISTEMA..." className="w-full h-10 pl-12 pr-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-none text-sm font-semibold tracking-widest uppercase focus:bg-white dark:bg-zinc-950 focus:ring-0 focus-visible:border-zinc-900 transition-all placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100" /></div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="flex items-center gap-2">
               {isOffline && <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 text-xs font-semibold tracking-widest uppercase"><Shield className="w-3 h-3" />Offline</div>}
               {lowStockProducts.length > 0 && <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold tracking-widest uppercase"><Package className="w-3 h-3" />Stock Bajo</div>}
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
              <ThemeToggle />
              
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                  className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 group"
                >
                  <Bell className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-100 transition-colors" />
                  {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500" />}
                </button>
                
                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-950 shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in duration-200">
                     <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-900 mb-2">
                       <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Notificaciones</span>
                     </div>
                     <div className="max-h-80 overflow-auto scrollbar-hide">
                        {notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer border-b last:border-0 border-zinc-50 dark:border-zinc-900">
                             <p className="text-sm font-semibold tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{n.title}</p>
                             <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed text-xs">{n.message}</p>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <div className="p-8 text-center">
                            <Bell className="w-6 h-6 text-zinc-200 dark:text-zinc-800 mx-auto mb-3" />
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bandeja vacía</p>
                          </div>
                        )}
                     </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 p-1.5 pl-4 bg-white dark:bg-zinc-950 border border-transparent hover:border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 group">
                <div className="hidden sm:block text-right leading-none"><p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{(user as any)?.user_metadata?.full_name || user?.email?.split('@')[0]}</p><p className="text-xs text-zinc-500 font-medium tracking-wider mt-1.5 uppercase">{(user as any)?.user_metadata?.role || 'Propietario'}</p></div>
                 <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 text-xs font-semibold">{(user as any)?.user_metadata?.full_name ? (user as any).user_metadata.full_name.charAt(0).toUpperCase() : 'P'}</div>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-950 shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 z-50 animate-in fade-in duration-200">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900"><p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Suscripción</p><div className="flex items-center gap-2 mt-2"><div className="px-2 py-1 bg-zinc-900 text-white text-xs font-semibold tracking-widest uppercase">ESSENTIAL</div></div></div>
                  <NavLink to="/dashboard/configuracion" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 hover:text-zinc-900 dark:text-zinc-100 transition-colors"><Settings className="w-4 h-4 stroke-[1.5]" />AJUSTES</NavLink>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-red-600/80 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut className="w-4 h-4 stroke-[1.5]" />CERRAR SESIÓN</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#fcfcfc] dark:bg-[#000000]">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-full">
            {!showMandatoryLocationModal && <Outlet />}
          </div>
        </main>
      </div>

      {showMandatoryLocationModal && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md [&>button]:hidden rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <DialogHeader>
              <DialogTitle className="text-sm font-medium uppercase tracking-wider text-center flex flex-col items-center gap-4 text-zinc-900 dark:text-zinc-100 mt-4">
                <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                </div>
                Configuración Inicial
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs tracking-widest text-center px-4 mt-2">
                Para empezar a registrar ventas o inventario, configura tu primera ubicación física.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <form onSubmit={handleCreateFirstLocation} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Nombre de la Sede</label>
                  <Input 
                    placeholder="SEDE PRINCIPAL" 
                    value={newLocationName} 
                    onChange={e => setNewLocationName(e.target.value)}
                    className="h-10 rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs tracking-widest uppercase"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Dirección (Opcional)</label>
                  <Input 
                    placeholder="CALLE 123" 
                    value={newLocationAddress} 
                    onChange={e => setNewLocationAddress(e.target.value)}
                    className="h-10 rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs tracking-widest uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Teléfono (Opcional)</label>
                  <Input 
                    placeholder="300 123 4567" 
                    value={newLocationPhone} 
                    onChange={e => setNewLocationPhone(e.target.value)}
                    className="h-10 rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-900 text-xs tracking-widest uppercase"
                  />
                </div>
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm uppercase tracking-wider h-12 rounded-none transition-colors"
                    disabled={!newLocationName.trim() || isSubmittingLocation}
                  >
                    {isSubmittingLocation ? 'CONFIGURANDO...' : 'CREAR SEDE'}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Paywall SaaS Modal */}
      {isSubscriptionExpired && reactLocation.pathname !== '/dashboard/configuracion' && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md [&>button]:hidden rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
             <DialogHeader className="relative z-10">
                <DialogTitle className="text-sm font-medium uppercase text-center flex flex-col items-center gap-4 text-zinc-900 dark:text-zinc-100 tracking-wider mt-4">
                  <div className="w-12 h-12 bg-red-50 border border-red-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  Suscripción Vencida
                </DialogTitle>
                <DialogDescription className="text-zinc-500 text-center text-xs tracking-widest pt-4 px-4 leading-relaxed">
                  El período de tu plan en POS-G ha caducado. Vuelve al panel de configuración para reactivar tu membresía.
                </DialogDescription>
             </DialogHeader>
             <div className="flex justify-center pt-6 pb-2">
               <Button onClick={() => navigate('/dashboard/configuracion?tab=billing')} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold h-12 rounded-none uppercase tracking-wider">
                 RENOVAR SUSCRIPCIÓN
               </Button>
             </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


