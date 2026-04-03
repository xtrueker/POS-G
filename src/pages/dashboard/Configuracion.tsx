import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Store, Bell, Shield, CreditCard, ClipboardCheck, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBusiness } from '@/context/BusinessContext';
import { useStaff } from '@/context/StaffContext';
import { useSecurityGate } from '@/hooks/useSecurityGate';
import { ProfileTab, BusinessTab, NotificationsTab, ChecklistsTab, SecurityTab, BillingTab, DangerModal, BeautySettingsTab, LoyaltyTab } from '@/components/settings/SettingsTabs';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Configuracion() {
  const { user, signOut } = useAuth();
  const { businessInfo, updateBusinessInfo } = useBusiness();
  const { verifyOwnerPin } = useStaff();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { isSuperAdmin } = useSecurityGate({ toastId: 'security-config' });

  const isExpired = !isSuperAdmin && (!businessInfo?.subscriptionEndDate || new Date(businessInfo.subscriptionEndDate) < new Date() || businessInfo?.subscriptionStatus !== 'active');

  const [activeTab, setActiveTab] = useState(() => {
    if (isExpired) return 'billing';
    const params = new URLSearchParams(routerLocation.search);
    return params.get('tab') || 'profile';
  });

  useEffect(() => { if (isExpired) setActiveTab('billing'); }, [isExpired]);

  // ─── State ───
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState('');
  const [vertical, setVertical] = useState('general');
  const [notifications, setNotifications] = useState({ low_stock: true, security: true, weekly_report: true });
  const [aperturaChecklist, setAperturaChecklist] = useState<string[]>([]);
  const [cierreChecklist, setCierreChecklist] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    legalName: '', nit: '', verificationDigit: 0, address: '', city: '', department: '', phone: '', email: '', regimen: 'simplificado', resolutionNumber: '', prefix: '',
  });

  // ─── Hydrate from businessInfo ───
  useEffect(() => {
    if (businessInfo) {
      setFormData({
        legalName: businessInfo.legalName || '', nit: businessInfo.nit || '', verificationDigit: businessInfo.verificationDigit || 0,
        address: businessInfo.address || '', city: businessInfo.city || '', department: businessInfo.department || '',
        phone: businessInfo.phone || '', email: businessInfo.email || '', regimen: (businessInfo.regimen as any) || 'simplificado',
        resolutionNumber: businessInfo.resolutionNumber || '', prefix: businessInfo.prefix || '',
      });
      setVertical(businessInfo.vertical || 'general');
      if (businessInfo.settings) {
        setPaymentInfo(businessInfo.settings.payment_info || '');
        if (businessInfo.settings.notifications) setNotifications(prev => ({ ...prev, ...businessInfo.settings!.notifications }));
        if (businessInfo.settings.checklists) {
          setAperturaChecklist(businessInfo.settings.checklists.apertura || []);
          setCierreChecklist(businessInfo.settings.checklists.cierre || []);
        } else {
          if (vertical === 'beauty') {
            setAperturaChecklist(['Esterilización de herramientas y peines', 'Limpieza de espejos y estaciones con alcohol', 'Verificación de stock de toallas y capas limpias', 'Preparación de productos de uso interno (shampoos, tintes)', 'Encendido de vaporizadores y equipos térmicos', 'Organización de agenda del día con el equipo', 'Caja inicial cuadrada y registrada']);
            setCierreChecklist(['Limpieza de drenajes y trampas de cabello', 'Lavado profundo de peines y cepillos utilizados', 'Registro de uso de químicos y tintes del día', 'Cierre de caja y arqueo de propinas/comisiones', 'Limpieza profunda de estaciones de lavado', 'Apagado y desconexión de planchas y secadores', 'Inventario rápido de productos retail']);
          } else {
            setAperturaChecklist(['Hornos encendidos y a temperatura', 'Exhibición montada y organizada', 'Precios visibles y actualizados', 'Caja inicial cuadrada y registrada', 'Limpieza general completada', 'Inventario de insumos verificado', 'Pedidos del día revisados']);
            setCierreChecklist(['Merma del día registrada en sistema', 'Caja cerrada y cuadrada', 'Limpieza profunda realizada', 'Hornos apagados y limpiados', 'Pedidos de insumos para mañana', 'Refrigeración verificada', 'Luces y equipos desconectados']);
          }
        }
      }
    }
  }, [businessInfo]);

  useEffect(() => { if (user) setProfileName((user as any)?.user_metadata?.full_name || 'Usuario'); }, [user]);

  // ─── Handlers ───
  const handleSaveBusiness = async () => {
    const result = await updateBusinessInfo({ ...(formData as any), vertical, settings: { ...(businessInfo?.settings || {}), enable_bakery: vertical === 'bakery' } });
    result.success ? toast.success('Configuración Fiscal y de Industria guardada exitosamente') : toast.error(result.message);
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await (supabase.from('profiles') as any).update({ full_name: profileName }).eq('id', user?.id);
      if (error) throw error;
      toast.success('Perfil actualizado correctamente. (Recarga para reflejar cambios de nombre)');
    } catch (e: any) { toast.error('Error al guardar el perfil: ' + e.message); }
  };

  const handleSaveChecklists = async () => {
    const result = await updateBusinessInfo({ settings: { ...(businessInfo?.settings || {}), checklists: { apertura: aperturaChecklist, cierre: cierreChecklist } } });
    result.success ? toast.success('Plantillas de Checklist actualizadas exitosamente') : toast.error(result.message);
  };

  const handleSaveSettings = async () => {
    const result = await updateBusinessInfo({ settings: { ...(businessInfo?.settings || {}), payment_info: paymentInfo, notifications } });
    result.success ? toast.success('Preferencias de Sistema y Recaudo guardadas exitosamente') : toast.error(result.message);
  };

  const handleSaveBeautySettings = async (beauty: any) => {
    const result = await updateBusinessInfo({ settings: { ...(businessInfo?.settings || {}), beauty } });
    result.success ? toast.success('Parámetros de Belleza actualizados') : toast.error(result.message);
  };

  const handleSaveLoyaltySettings = async (loyalty: any) => {
    const result = await updateBusinessInfo({ settings: { ...(businessInfo?.settings || {}), loyalty } });
    result.success ? toast.success('Estrategia de Fidelización actualizada') : toast.error(result.message);
  };

  const handleChangePin = async (currentPin: string, newPin: string) => {
    if (!currentPin || !newPin) { toast.error('Completa ambos campos del PIN'); return; }
    if (!user?.id) { toast.error('Error de sesión'); return; }
    const isValid = await verifyOwnerPin(currentPin);
    if (!isValid) { toast.error('El PIN actual es incorrecto'); return; }
    if (newPin.length < 4) { toast.error('El nuevo PIN debe tener al menos 4 dígitos'); return; }
    try {
      const { error } = await (supabase.from('profiles') as any).update({ pin: newPin }).eq('id', user.id);
      if (error) throw error;
      toast.success('PIN de Propietario actualizado exitosamente');
    } catch (err: any) { toast.error('No se pudo actualizar el PIN: ' + err.message); }
  };

  const handleTerminateAccount = async (word: string, pin: string) => {
    if (word !== 'ELIMINAR') { toast.error('Escribe ELIMINAR en mayúsculas exactamente'); return; }
    const isValid = await verifyOwnerPin(pin);
    if (!pin || !isValid) { toast.error('PIN de Propietario inválido'); return; }
    try {
      const { error } = await supabase.rpc('terminate_account');
      if (error) throw error;
      toast.success('Cuenta exterminada irreversiblemente. Cerrando sesión...');
      setShowDangerModal(false);
      await signOut();
      navigate('/login');
    } catch (err: any) { toast.error('Error crítico en el núcleo de borrado: ' + err.message); }
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/tenant_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath);
      const bName = businessInfo?.legalName || profileName || 'Desconocido';
      const message = `Hola VaperG! Acabo de pagar la mensualidad SaaS del negocio *${bName}*.\n\n🧾 Comprobante: ${publicUrl}`;
      window.open(`https://wa.me/573145567625?text=${encodeURIComponent(message)}`, '_blank');
      toast.success('Comprobante en la nube. Redirigiendo a WhatsApp...');
    } catch (error: any) { toast.error('Error al procesar comprobante: ' + error.message); }
    finally { setIsUploading(false); e.target.value = ''; }
  };

  const handleMercadoPagoCheckout = async () => {
    if (!businessInfo?.id) { toast.error("No se encontró el ID del negocio para facturar."); return; }
    try {
      toast.loading("Generando plataforma de pago segura...", { id: 'mp-checkout' });
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { business_id: businessInfo.id, business_name: businessInfo.legalName || profileName || 'Tenant POSG', return_url: window.location.href }
      });
      if (error) throw error;
      if (!data?.init_point) throw new Error("La pasarela no devolvió el punto de cobro.");
      toast.success("Redirigiendo a MercadoPago...", { id: 'mp-checkout' });
      window.location.href = data.init_point;
    } catch (err: any) { toast.error('Error al conectar con MercadoPago: ' + err.message, { id: 'mp-checkout' }); }
  };

  // ─── Tabs Config ───
  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'business', label: 'Negocio', icon: Store },
    { id: 'checklists', label: 'Operación', icon: ClipboardCheck },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    ...(vertical === 'beauty' ? [{ id: 'industry', label: 'Industria', icon: ClipboardCheck }] : []),
    ...(user?.role === 'owner' ? [{ id: 'loyalty', label: 'Fidelización', icon: Heart }] : []),
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'billing', label: 'Facturación', icon: CreditCard },
  ];

  // ─── Render ───
  return (
    <>
    <div className="space-y-12">
      <div className="border-b border-zinc-100 dark:border-zinc-900 pb-8">
        <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Configuración de Sistema</h1>
        <p className="text-zinc-500 text-sm uppercase tracking-[0.1em] font-bold mt-2">Administración de identidad y parámetros globales</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none overflow-hidden space-y-1 p-2">
            {tabs.map((tab) => {
              const isTabDisabled = isExpired && tab.id !== 'billing';
              return (
                <button key={tab.id} onClick={() => !isTabDisabled && setActiveTab(tab.id)} disabled={isTabDisabled}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-none transition-all ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-none' : isTabDisabled ? 'text-zinc-200 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/50' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 group transition-all duration-300'}`}
                >
                  <tab.icon className={`w-4 h-4 stroke-[1.5] ${activeTab === tab.id ? 'text-white' : isTabDisabled ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white'}`} />
                  <div className="text-left flex-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{tab.label}</span>
                    {isTabDisabled && <Shield className="w-3 h-3 text-zinc-200" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 rounded-none p-12 glass-light dark:glass-dark border-glow-light dark:border-glow">
            {activeTab === 'profile' && <ProfileTab user={user} profileName={profileName} setProfileName={setProfileName} onSave={handleSaveProfile} />}
            {activeTab === 'business' && <BusinessTab formData={formData} setFormData={setFormData} vertical={vertical} setVertical={setVertical} onSave={handleSaveBusiness} />}
            {activeTab === 'notifications' && <NotificationsTab notifications={notifications} setNotifications={setNotifications} onSave={handleSaveSettings} />}
            {activeTab === 'industry' && vertical === 'beauty' && <BeautySettingsTab businessInfo={businessInfo} onSave={handleSaveBeautySettings} />}
            {activeTab === 'checklists' && <ChecklistsTab aperturaChecklist={aperturaChecklist} setAperturaChecklist={setAperturaChecklist} cierreChecklist={cierreChecklist} setCierreChecklist={setCierreChecklist} onSave={handleSaveChecklists} />}
            {activeTab === 'security' && <SecurityTab onChangePin={handleChangePin} onShowDangerModal={() => setShowDangerModal(true)} />}
            {activeTab === 'loyalty' && user?.role === 'owner' && <LoyaltyTab businessInfo={businessInfo} onSave={handleSaveLoyaltySettings} />}
            {activeTab === 'billing' && <BillingTab onMercadoPago={handleMercadoPagoCheckout} onUploadReceipt={handleUploadReceipt} isUploading={isUploading} />}
          </div>
        </div>
      </div>
    </div>

    <DangerModal isOpen={showDangerModal} onClose={() => setShowDangerModal(false)} businessName={businessInfo?.legalName || 'su empresa'} onConfirm={handleTerminateAccount} />
    </>
  );
}
