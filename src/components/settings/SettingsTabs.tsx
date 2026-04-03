import { useState } from 'react';
import { Plus, Trash2, Crown, AlertOctagon, X, Loader2, Receipt, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type BusinessInfo } from '@/types';

// ==========================================
// SHARED TYPES
// ==========================================
export interface SettingsTabProps {
  businessInfo: BusinessInfo | null;
  updateBusinessInfo: (info: any) => Promise<{ success: boolean; message: string }>;
}

// ==========================================
// PROFILE TAB
// ==========================================
export function ProfileTab({ user, profileName, setProfileName, onSave }: {
  user: any;
  profileName: string;
  setProfileName: (name: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-12">
      <div className="border-b border-zinc-50 pb-6">
        <h2 className="text-lg font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 inline-block border-b-2 border-zinc-900 pb-1">Identidad del Usuario</h2>
      </div>
      <div className="flex items-center gap-8 mb-12">
        <div className="w-24 h-24 bg-zinc-900 rounded-none flex items-center justify-center text-white ring-8 ring-zinc-50">
          <span className="text-4xl font-light tracking-tighter">{profileName ? profileName.charAt(0).toUpperCase() : 'U'}</span>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">ACTIVO DIGITAL</p>
          <Button variant="outline" size="sm" className="rounded-none border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 hover:border-zinc-900 transition-all">CAMBIAR AVATAR</Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Nombre Completo</label>
          <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs uppercase tracking-widest placeholder:text-zinc-100" />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Credencial de Acceso</label>
          <Input defaultValue={user?.email} disabled className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-900 text-zinc-500 rounded-none cursor-not-allowed text-xs tracking-widest" />
        </div>
      </div>
      <div className="pt-8 border-t border-zinc-50">
        <Button onClick={onSave} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 px-12 rounded-none text-sm uppercase tracking-wider shadow-none transition-all">CONSOLIDAR PERFIL</Button>
      </div>
    </div>
  );
}

// ==========================================
// BUSINESS TAB
// ==========================================
export function BusinessTab({ formData, setFormData, vertical, setVertical, onSave }: {
  formData: any;
  setFormData: (data: any) => void;
  vertical: string;
  setVertical: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-12">
      <div className="border-b border-zinc-50 pb-6">
        <h2 className="text-lg font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 inline-block border-b-2 border-zinc-900 pb-1">Configuración Fiscal & Industria</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="sm:col-span-2 space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Razón Social / Nombre Comercial</label>
          <Input value={formData.legalName} onChange={(e) => setFormData({...formData, legalName: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs uppercase tracking-widest" />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Identificación Tributaria (NIT)</label>
          <div className="flex gap-2">
            <Input placeholder="900000000" value={formData.nit} onChange={(e) => setFormData({...formData, nit: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs" />
            <div className="flex items-center gap-1"><span className="text-zinc-300">-</span><Input placeholder="0" className="w-14 h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-center text-xs" value={formData.verificationDigit} onChange={(e) => setFormData({...formData, verificationDigit: parseInt(e.target.value) || 0})} /></div>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">Especialización de Vertical</label>
          <select className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 rounded-none outline-none font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 transition-colors" value={vertical} onChange={(e) => setVertical(e.target.value)}>
            <option value="general">COMERCIO GENERAL / RETAIL</option>
            <option value="bakery">PANADERÍA & REPOSTERÍA TÉCNICA</option>
            <option value="beauty">BELLEZA & BIENESTAR (BARBERÍA, SPA)</option>
            <option value="gastronomy">RESTAURANTE / GASTRONOMÍA</option>
            <option value="services">SERVICIOS / PROFESIONAL</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Régimen Operativo</label>
          <select className="w-full h-12 px-4 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-none outline-none text-sm font-bold uppercase tracking-wider focus:border-zinc-900 transition-colors" value={formData.regimen} onChange={(e) => setFormData({...formData, regimen: e.target.value as any})}>
            <option value="simplificado">NO RESPONSABLE DE IVA</option>
            <option value="comun">RESPONSABLE DE IVA</option>
          </select>
        </div>
        <div className="sm:col-span-2 space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Sede Principal / Dirección</label>
          <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs uppercase tracking-widest" />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Ciudad</label>
          <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs uppercase tracking-widest" />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Departamento</label>
          <Input value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs uppercase tracking-widest" />
        </div>
        <div className="sm:col-span-2 pt-8 border-t border-zinc-50 mt-4">
          <h3 className="text-[11px] font-bold uppercase text-zinc-300 mb-6 tracking-[0.1em]">Habilitación de Facturación (DIAN)</h3>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">N° Resolución</label><Input value={formData.resolutionNumber} onChange={(e) => setFormData({...formData, resolutionNumber: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs uppercase" /></div>
            <div className="space-y-3"><label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Prefijo</label><Input value={formData.prefix} onChange={(e) => setFormData({...formData, prefix: e.target.value})} className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs uppercase" /></div>
          </div>
        </div>
      </div>
      <div className="pt-8 border-t border-zinc-50">
        <Button onClick={onSave} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 px-12 rounded-none text-sm uppercase tracking-wider shadow-none transition-all">ACTUALIZAR REGISTRO FISCAL</Button>
      </div>
    </div>
  );
}

// ==========================================
// NOTIFICATIONS TAB
// ==========================================
export function NotificationsTab({ notifications, setNotifications, onSave }: {
  notifications: { low_stock: boolean; security: boolean; weekly_report: boolean };
  setNotifications: (n: any) => void;
  onSave: () => void;
}) {
  const items = [
    { key: 'low_stock', label: 'Alertas de Stock Crítico', desc: 'Sincronización en tiempo real de inventario' },
    { key: 'security', label: 'Protocolos de Seguridad', desc: 'Trazabilidad de accesos y cambios de privilegios' },
    { key: 'weekly_report', label: 'Análisis de Inteligencia Semanal', desc: 'Reportística predictiva de ventas vía email' },
  ];

  return (
    <div className="space-y-12">
      <div className="border-b border-zinc-50 pb-6">
        <h2 className="text-lg font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 inline-block border-b-2 border-zinc-900 pb-1">Preferencias del Sistema</h2>
      </div>
      <div className="space-y-6">
        {items.map((item, i) => {
          const isActive = notifications[item.key as keyof typeof notifications];
          return (
            <div key={i} className="flex items-center justify-between p-8 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900 hover:bg-white dark:bg-zinc-950 hover:border-zinc-200 dark:border-zinc-800 transition-all group">
              <div className="space-y-1">
                <p className="font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">{item.label}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">{item.desc}</p>
              </div>
              <div
                onClick={() => setNotifications({...notifications, [item.key]: !isActive})}
                className={`w-14 h-7 rounded-none relative cursor-pointer border-2 transition-all p-1 ${isActive ? 'bg-zinc-900 border-zinc-900' : 'bg-transparent border-zinc-200 dark:border-zinc-800'}`}
              >
                <div className={`w-4 h-4 bg-white dark:bg-zinc-950 transition-all ${isActive ? 'translate-x-7 bg-white dark:bg-zinc-950 shadow-lg' : 'translate-x-0 bg-zinc-200'}`} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-8 border-t border-zinc-50">
        <Button onClick={onSave} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 px-12 rounded-none text-sm uppercase tracking-wider shadow-none transition-all">CONSOLIDAR PREFERENCIAS</Button>
      </div>
    </div>
  );
}

// ==========================================
// CHECKLISTS TAB
// ==========================================
export function ChecklistsTab({ aperturaChecklist, setAperturaChecklist, cierreChecklist, setCierreChecklist, onSave }: {
  aperturaChecklist: string[];
  setAperturaChecklist: (c: string[]) => void;
  cierreChecklist: string[];
  setCierreChecklist: (c: string[]) => void;
  onSave: () => void;
}) {
  const [newAperturaTask, setNewAperturaTask] = useState('');
  const [newCierreTask, setNewCierreTask] = useState('');

  const addTask = (type: 'apertura' | 'cierre') => {
    if (type === 'apertura' && newAperturaTask.trim()) {
      setAperturaChecklist([...aperturaChecklist, newAperturaTask.trim()]);
      setNewAperturaTask('');
    } else if (type === 'cierre' && newCierreTask.trim()) {
      setCierreChecklist([...cierreChecklist, newCierreTask.trim()]);
      setNewCierreTask('');
    }
  };

  const renderChecklist = (
    title: string,
    checklist: string[],
    setChecklist: (c: string[]) => void,
    newTask: string,
    setNewTask: (t: string) => void,
    type: 'apertura' | 'cierre',
  ) => (
    <div className="space-y-6">
      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</h3>
      <div className="space-y-2">
        {checklist.map((task, idx) => (
          <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <Input value={task} onChange={e => {
              const newTasks = [...checklist];
              newTasks[idx] = e.target.value;
              setChecklist(newTasks);
            }} className="h-10 text-xs rounded-none border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100" />
            <Button variant="outline" size="icon" onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))} className="h-10 w-10 shrink-0 border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 rounded-none"><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={`NUEVA TAREA DE ${title.toUpperCase()}...`}
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTask(type); }}
          className="h-10 text-xs tracking-widest uppercase placeholder:text-zinc-400 rounded-none border-zinc-200 dark:border-zinc-800"
        />
        <Button onClick={() => addTask(type)} className="h-10 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-none hover:bg-zinc-800"><Plus className="w-4 h-4" /></Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="border-b border-zinc-50 dark:border-zinc-900 pb-6">
        <h2 className="text-lg font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 inline-block border-b-2 border-zinc-900 dark:border-zinc-100 pb-1">Plantillas de Operación (Checklists)</h2>
      </div>
      <div className="grid lg:grid-cols-2 gap-12">
        {renderChecklist('Apertura de Turno', aperturaChecklist, setAperturaChecklist, newAperturaTask, setNewAperturaTask, 'apertura')}
        {renderChecklist('Cierre de Turno', cierreChecklist, setCierreChecklist, newCierreTask, setNewCierreTask, 'cierre')}
      </div>
      <div className="pt-8 border-t border-zinc-50 dark:border-zinc-900/50 mt-12">
        <Button onClick={onSave} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 px-12 rounded-none text-sm uppercase tracking-wider shadow-none transition-all">GUARDAR PLANTILLAS DE OPERACIÓN</Button>
      </div>
    </div>
  );
}

// ==========================================
// SECURITY TAB
// ==========================================
export function SecurityTab({ onChangePin, onShowDangerModal }: {
  onChangePin: (currentPin: string, newPin: string) => void;
  onShowDangerModal: () => void;
}) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');

  return (
    <div className="space-y-12">
      <div className="border-b border-zinc-50 pb-6">
        <h2 className="text-lg font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 inline-block border-b-2 border-zinc-900 pb-1">Credenciales y Seguridad</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block">PIN de Propietario Actual</label>
          <Input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="••••" className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-2xl tracking-[0.5em] text-center" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block">Nuevo PIN de Seguridad</label>
          <Input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="••••" className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-2xl tracking-[0.5em] text-center" />
        </div>
      </div>
      <Button onClick={() => { onChangePin(currentPin, newPin); setCurrentPin(''); setNewPin(''); }} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 px-12 rounded-none text-sm uppercase tracking-wider shadow-none transition-all">ACTUALIZAR LLAVE MAESTRA</Button>
      <div className="pt-12 border-t border-red-50 dark:border-red-900/10 mt-8">
        <div className="bg-red-50/20 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 rounded-none p-10 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-100/50 dark:bg-red-900/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all duration-1000 group-hover:scale-150"></div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-red-700 dark:text-red-500 flex items-center gap-3 mb-4 tracking-[0.2em] uppercase">
              <AlertOctagon className="w-5 h-5 stroke-[2]" />
              Nodo de Exterminio
            </h3>
            <p className="text-[11px] text-red-600/60 dark:text-red-400/60 mb-8 uppercase tracking-[0.1em] leading-relaxed font-bold">
              La eliminación de cuenta es un protocolo de grado militar irreversible. Esta acción destruirá permanentemente todos los registros transaccionales, fiscales y de inventario de su organización.
            </p>
            <Button onClick={onShowDangerModal} className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-10 rounded-none text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 border-none">INICIAR PURGA TOTAL</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BeautySettingsTab({ businessInfo, onSave }: {
  businessInfo: any;
  onSave: (data: any) => void;
}) {
  const [beautySettings, setBeautySettings] = useState(businessInfo?.settings?.beauty || {
    defaultDuration: 60,
    globalCommission: 10
  });

  return (
    <div className="space-y-12">
      <div className="border-b border-zinc-50 pb-6">
        <h2 className="text-lg font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 inline-block border-b-2 border-zinc-900 pb-1">Parámetros de Industria: Belleza</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Duración Predeterminada (Minutos)</label>
          <Input 
            type="number" 
            value={beautySettings.defaultDuration} 
            onChange={(e) => setBeautySettings({...beautySettings, defaultDuration: parseInt(e.target.value) || 0})}
            className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 text-sm font-mono" 
          />
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Base para nuevas citas en la agenda</p>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Comisión Global (%)</label>
          <Input 
            type="number" 
            value={beautySettings.globalCommission} 
            onChange={(e) => setBeautySettings({...beautySettings, globalCommission: parseInt(e.target.value) || 0})}
            className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 text-sm font-mono" 
          />
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Porcentaje sugerido para colaboradores</p>
        </div>
      </div>

      <div className="space-y-6 pt-8 border-t border-zinc-100 dark:border-white/5">
        <div className="flex justify-between items-center">
           <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Especialidades & Tipos de Trabajo</label>
           <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pr-2">Defina sus áreas de servicio</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(beautySettings.categories || ['Peluquería', 'Barbería', 'Manicure', 'Pedicure', 'SPA']).map((cat: string, i: number) => (
            <div key={i} className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-zinc-900 group">
              {cat}
              <button onClick={() => {
                const newCats = (beautySettings.categories || ['Peluquería', 'Barbería', 'Manicure', 'Pedicure', 'SPA']).filter((_: any, idx: number) => idx !== i);
                setBeautySettings({...beautySettings, categories: newCats});
              }} className="opacity-40 group-hover:opacity-100 transition-all ml-2 hover:text-red-400"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <Input 
            id="newBeautyCat" 
            placeholder="AÑADIR NUEVA ESPECIALIDAD (Ej: Masajes)" 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.toUpperCase();
                if (val) {
                   setBeautySettings({
                     ...beautySettings, 
                     categories: [...(beautySettings.categories || ['Peluquería', 'Barbería', 'Manicure', 'Pedicure', 'SPA']), val]
                   });
                   (e.target as HTMLInputElement).value = '';
                }
              }
            }}
            className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 text-xs tracking-widest" 
          />
          <Button variant="outline" className="h-12 w-12 p-0 border-zinc-200 dark:border-zinc-800" onClick={() => {
            const input = document.getElementById('newBeautyCat') as HTMLInputElement;
            if (input.value) {
                setBeautySettings({
                  ...beautySettings, 
                  categories: [...(beautySettings.categories || ['Peluquería', 'Barbería', 'Manicure', 'Pedicure', 'SPA']), input.value.toUpperCase()]
                });
                input.value = '';
            }
          }}><Plus className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="space-y-4 pt-8 border-t border-zinc-100 dark:border-white/5">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Tiempo de Preparación (Buffer)</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
          {[0, 5, 10, 15, 20, 30].map(m => (
            <button key={m} onClick={() => setBeautySettings({...beautySettings, bufferTime: m})} className={`h-12 border text-[10px] font-bold uppercase tracking-widest transition-all ${beautySettings.bufferTime === m ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-900'}`}>
              {m} MIN
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Tiempo muerto entre servicios para limpieza y preparación operativa</p>
      </div>
      <div className="pt-8 border-t border-zinc-50">
        <Button onClick={() => onSave(beautySettings)} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-12 px-12 rounded-none text-sm uppercase tracking-wider shadow-none transition-all">CONSOLIDAR REGLAS DE INDUSTRIA</Button>
      </div>
    </div>
  );
}

// ==========================================
// BILLING TAB
// ==========================================
export function BillingTab({ onMercadoPago, onUploadReceipt, isUploading }: {
  onMercadoPago: () => void;
  onUploadReceipt: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}) {
  return (
    <div className="space-y-12">
      <div className="border-b border-zinc-50 pb-6">
        <h2 className="text-lg font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 inline-block border-b-2 border-zinc-900 pb-1">Suscripto & Licenciamiento</h2>
      </div>
      <div className="bg-zinc-900 p-12 relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-96 h-96 bg-zinc-800 rounded-full -mr-48 -mt-48 blur-3xl transition-all duration-1000 group-hover:bg-zinc-700/50"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-2">
              <div className="px-4 py-1.5 bg-zinc-800 text-white text-xs font-bold uppercase tracking-[0.1em] inline-block border border-zinc-700">LICENSE: MASTER PLAN</div>
              <h3 className="text-4xl font-light text-white tracking-tighter mt-4">SaaS Operativo POS-G</h3>
            </div>
            <Crown className="w-12 h-12 text-zinc-700 stroke-[1]" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-zinc-800/50 border border-zinc-800 backdrop-blur-sm">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-3">VALUACIÓN MENSUAL</p>
              <p className="text-3xl font-light text-white tracking-tighter">$15.000 <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">COP</span></p>
            </div>
            <div className="p-8 bg-zinc-800/50 border border-zinc-800 backdrop-blur-sm flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-3">VENCIMIENTO DE CICLO</p>
                <p className="text-2xl font-light text-white tracking-tighter">15 DE ABRIL, 2026</p>
              </div>
              <div className="px-3 py-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-[11px] font-extrabold uppercase tracking-widest border border-white">ACTIVO</div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-8">
        <div className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Canales de Recaudo Autorizados</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2 font-medium">Sincronización automática vía pasarela o validación manual inmediata</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-8">
          <div onClick={onMercadoPago} className="p-10 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-900 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform"><CreditCard className="w-5 h-5 stroke-[1.5]" /></div>
                <h4 className="font-bold text-sm tracking-widest text-zinc-900 dark:text-zinc-100 uppercase">Pasarela Digital</h4>
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold leading-relaxed">Liquidación instántanea vía MercadoPago. Acepta todas las franquicias y PSE.</p>
            </div>
            <div className="mt-8"><span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-zinc-300 group-hover:text-zinc-900 dark:text-zinc-100 transition-colors">Iniciar Transacción SEGURA →</span></div>
          </div>
          <div className="p-10 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:bg-zinc-950 hover:border-zinc-900 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-lg">N</div>
                <h4 className="font-bold text-sm tracking-widest text-zinc-900 dark:text-zinc-100 uppercase">Transferencia Directa</h4>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">CANAL NEQUI / TRANSFIYA</p>
                <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-widest">314 556 7625</p>
              </div>
            </div>
            <div className="mt-8 text-[11px] text-zinc-300 uppercase font-bold tracking-widest">Requiere carga de comprobante</div>
          </div>
        </div>
        <div className="mt-12">
          <label className="cursor-pointer group">
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onUploadReceipt} disabled={isUploading} />
            <div className={`w-full flex items-center justify-center gap-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold h-16 rounded-none text-sm uppercase tracking-[0.1em] transition-all ${isUploading ? 'opacity-80 cursor-wait' : ''}`}>
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Receipt className="w-5 h-5 stroke-[1.5]" />VALIDAR COMPROBANTE DE PAGO</>}
            </div>
          </label>
          <p className="text-center text-[11px] text-zinc-500 mt-6 font-bold uppercase tracking-[0.1em]">Protocolo de validación manual: Menor a 10 minutos / Auditoría permanente</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// LOYALTY TAB (Owner Only)
// ==========================================
export function LoyaltyTab({ businessInfo, onSave }: {
  businessInfo: any;
  onSave: (loyalty: any) => void;
}) {
  const [enabled, setEnabled] = useState(businessInfo?.settings?.loyalty?.enabled || false);
  const [ratio, setRatio] = useState(businessInfo?.settings?.loyalty?.moneyToPointsRatio || 1000);
  const [pointsName, setPointsName] = useState(businessInfo?.settings?.loyalty?.pointsName || 'PUNTOS');

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="border-b border-zinc-50 dark:border-zinc-900 pb-6 flex items-center justify-between">
        <h2 className="text-lg font-light tracking-wider uppercase text-zinc-900 dark:text-zinc-100 inline-block border-b-2 border-zinc-900 pb-1">Estrategia de Fidelización</h2>
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 border border-zinc-100 dark:border-zinc-900">
           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">PROGRAMA ACTIVO</span>
           <input 
            type="checkbox" 
            checked={enabled} 
            onChange={(e) => setEnabled(e.target.checked)} 
            className="w-4 h-4 accent-zinc-900 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Nombre de tu Moneda de Lealtad</label>
          <Input 
            value={pointsName} 
            onChange={(e) => setPointsName(e.target.value.toUpperCase())} 
            placeholder="EJ: BEAUTYCOINS, ESTRELLAS"
            className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 text-xs uppercase tracking-widest" 
          />
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Ratio de Acumulación (Dinero por 1 Punto)</label>
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold text-zinc-400">$</span>
             <Input 
              type="number"
              value={ratio} 
              onChange={(e) => setRatio(parseInt(e.target.value) || 0)} 
              className="h-12 rounded-none border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus-visible:ring-0 font-mono text-xs" 
            />
             <span className="text-[10px] font-bold text-zinc-400">/ 1 {pointsName}</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic mt-2">
            Tip: Un ratio de $1.000 es el estándar. Un ratio de $500 es muy agresivo.
          </p>
        </div>
      </div>

      <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Vista Previa del Programa</h4>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              Si un cliente realiza una compra de <span className="text-zinc-900 dark:text-zinc-100 font-bold">$50.000</span>, 
              recibirá automáticamente <span className="text-zinc-900 dark:text-zinc-100 font-bold">{Math.floor(50000 / ratio)} {pointsName}</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-50 dark:border-zinc-900">
        <Button 
          onClick={() => onSave({ enabled, moneyToPointsRatio: ratio, pointsName })} 
          className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-white font-bold h-12 px-12 rounded-none text-sm uppercase tracking-wider shadow-none transition-all"
        >
          DESPLEGAR ESTRATEGIA
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// DANGER MODAL
// ==========================================
export function DangerModal({ isOpen, onClose, businessName, onConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  onConfirm: (word: string, pin: string) => void;
}) {
  const [dangerWord, setDangerWord] = useState('');
  const [dangerPin, setDangerPin] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center p-8 z-50">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-12 duration-500">
        <div className="bg-zinc-900 p-12 text-center relative overflow-hidden">
          <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white dark:bg-zinc-950/5 text-zinc-500 hover:text-white hover:bg-white dark:bg-zinc-950/10 transition-all z-10"><X className="w-5 h-5 stroke-[1.5]" /></button>
          <AlertOctagon className="w-20 h-20 text-red-600 mx-auto mb-8 relative z-10" />
          <h2 className="text-2xl font-light text-white relative z-10 tracking-[0.1em] uppercase">Protocolo de Exterminio</h2>
          <div className="mt-4 px-6 py-2 bg-red-600 text-white text-[11px] font-extrabold tracking-[0.1em] uppercase inline-block relative z-10">Acción Irreversible</div>
        </div>
        <div className="p-12 space-y-12">
          <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 text-zinc-600 text-sm uppercase font-bold tracking-[0.15em] leading-[2] text-center">
            Está a punto de iniciar la purga de la base de datos maestra de <b className="text-zinc-900 dark:text-zinc-100">{businessName}</b>. Esta operación obliterará el rastro operativo, fiscal y humano de la organización.
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-zinc-500 block tracking-wider">Confirmación Semántica</label>
              <p className="text-xs text-zinc-500 mb-4 uppercase tracking-widest font-medium">Ingrese la palabra clave <b className="text-zinc-900 dark:text-zinc-100">ELIMINAR</b> para desbloquear el sistema.</p>
              <Input value={dangerWord} onChange={(e) => setDangerWord(e.target.value)} placeholder="ELIMINAR" className="h-14 rounded-none border border-zinc-200 dark:border-zinc-800 focus:border-red-600 focus-visible:ring-0 font-bold text-center tracking-[0.1em] text-red-600 bg-transparent" />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-zinc-500 block tracking-wider">Clave de Autorización (Propietario)</label>
              <Input type="password" value={dangerPin} onChange={(e) => setDangerPin(e.target.value)} placeholder="••••" className="h-14 rounded-none border border-zinc-200 dark:border-zinc-800 focus:border-red-600 focus-visible:ring-0 text-3xl tracking-[0.1em] text-center bg-transparent" />
            </div>
          </div>
          <div className="flex gap-6 pt-12 border-t border-zinc-50">
            <Button onClick={onClose} variant="outline" className="flex-1 h-14 rounded-none text-sm uppercase tracking-wider font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-all shadow-none">Abortar Misión</Button>
            <Button onClick={() => onConfirm(dangerWord, dangerPin)} className="flex-1 h-14 rounded-none bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider shadow-none transition-all disabled:opacity-20" disabled={dangerWord !== 'ELIMINAR' || dangerPin.length < 4}>Iniciar Exterminio</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
