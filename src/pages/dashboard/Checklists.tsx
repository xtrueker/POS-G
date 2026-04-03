import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClipboardCheck, Sun, Moon, CheckCircle2, Circle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/context/BusinessContext';
import { useLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { useStaff } from '@/context/StaffContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ChecklistItem {
  name: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

interface ChecklistRecord {
  id: string;
  shift: 'apertura' | 'cierre';
  date: string;
  items: ChecklistItem[];
  completionRate: number;
  completedBy?: string;
}

export default function Checklists() {
  const { businessId, businessInfo } = useBusiness();
  const { currentLocation } = useLocation();
  const { user } = useAuth();
  const { staff } = useStaff();

  const [activeShift, setActiveShift] = useState<'apertura' | 'cierre'>('apertura');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChecklistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const currentStaff = useMemo(() => staff.find(s => s.id === user?.id), [staff, user]);
  const staffName = currentStaff?.name || user?.email || 'Operador';

  const completionRate = useMemo(() => {
    const completed = items.filter(i => i.completed).length;
    return items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
  }, [items]);

  const loadChecklist = useCallback(async () => {
    if (!businessId) return;
    setIsLoading(true);

    const settings = businessInfo?.settings?.checklists;
    const baseApertura = settings?.apertura && settings.apertura.length > 0 ? settings.apertura : [
      'Hornos encendidos y a temperatura',
      'Exhibición montada y organizada',
      'Precios visibles y actualizados',
      'Caja inicial cuadrada y registrada',
      'Limpieza general completada',
      'Inventario de insumos verificado',
      'Pedidos del día revisados',
    ];
    
    const baseCierre = settings?.cierre && settings.cierre.length > 0 ? settings.cierre : [
      'Merma del día registrada en sistema',
      'Caja cerrada y cuadrada',
      'Limpieza profunda realizada',
      'Hornos apagados y limpiados',
      'Pedidos de insumos para mañana',
      'Refrigeración verificada',
      'Luces y equipos desconectados',
    ];

    const currentTemplate = activeShift === 'apertura' 
      ? baseApertura.map(name => ({ name, completed: false }))
      : baseCierre.map(name => ({ name, completed: false }));

    // Load today's checklist for the active shift
    const { data, error } = await (supabase
      .from('checklists') as any)
      .select('*')
      .eq('business_id', businessId)
      .eq('shift', activeShift)
      .eq('date', today)
      .eq('location_id', currentLocation?.id || '')
      .maybeSingle();

    if (data && !error) {
      setItems(data.items as ChecklistItem[]);
      setExistingId(data.id);
    } else {
      setItems(currentTemplate);
      setExistingId(null);
    }

    // Load history (last 7 days)
    const { data: histData } = await (supabase
      .from('checklists') as any)
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false })
      .limit(14);

    if (histData) {
      setHistory(histData.map((h: any) => ({
        id: h.id,
        shift: h.shift,
        date: h.date,
        items: h.items,
        completionRate: h.completion_rate,
        completedBy: h.completed_by,
      })));
    }

    setIsLoading(false);
  }, [businessId, activeShift, today, currentLocation]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const toggleItem = (index: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          completed: !item.completed,
          completedBy: !item.completed ? staffName : undefined,
          completedAt: !item.completed ? new Date().toISOString() : undefined,
        };
      }
      return item;
    }));
  };

  const saveChecklist = async () => {
    if (!businessId) return;

    const payload = {
      business_id: businessId,
      location_id: currentLocation?.id || null,
      shift: activeShift,
      date: today,
      items: items,
      completed_by: user?.id,
      completion_rate: completionRate,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existingId) {
      ({ error } = await (supabase.from('checklists') as any).update(payload).eq('id', existingId));
    } else {
      const { data, error: insertError } = await (supabase.from('checklists') as any).insert(payload).select().single();
      error = insertError;
      if (data) setExistingId(data.id);
    }

    if (error) {
      toast.error('Error al guardar checklist');
      console.error(error);
    } else {
      toast.success(`Checklist de ${activeShift} guardado — ${completionRate}% completado`);
      loadChecklist();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-zinc-500 stroke-[1.5]" />
            Checklists de Turno
          </h1>
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-bold mt-2">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            {currentLocation && ` — ${currentLocation.name}`}
          </p>
        </div>
        <Button
          onClick={saveChecklist}
          className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800 dark:hover:bg-white rounded-none h-11 px-8 text-xs font-bold uppercase tracking-widest shadow-lg transition-all border-none"
        >
          GUARDAR CHECKLIST
        </Button>
      </div>

      {/* Shift Tabs */}
      <div className="flex gap-0 border border-zinc-200 dark:border-zinc-800">
        {[
          { id: 'apertura' as const, label: 'APERTURA', icon: Sun, time: '6:00 AM' },
          { id: 'cierre' as const, label: 'CIERRE', icon: Moon, time: '8:00 PM' },
        ].map(shift => (
          <button
            key={shift.id}
            onClick={() => setActiveShift(shift.id)}
            className={`flex-1 flex items-center justify-center gap-3 py-5 text-xs font-bold uppercase tracking-widest transition-all ${
              activeShift === shift.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-950 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <shift.icon className="w-4 h-4 stroke-[1.5]" />
            {shift.label}
            <span className={`text-[10px] tracking-wider ${activeShift === shift.id ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>{shift.time}</span>
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">CUMPLIMIENTO DEL TURNO</span>
          <span className={`text-2xl font-light tracking-tight ${completionRate === 100 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>{completionRate}%</span>
        </div>
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 w-full">
          <div
            className={`h-full transition-all duration-500 ${completionRate === 100 ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-400'}`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 divide-y divide-zinc-100 dark:divide-zinc-900">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => toggleItem(index)}
            className={`w-full flex items-center gap-6 p-6 text-left transition-all group hover:bg-zinc-50 dark:hover:bg-zinc-900 ${item.completed ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''}`}
          >
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100 stroke-[1.5] shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 stroke-[1.5] shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wider ${item.completed ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {item.name}
              </p>
              {item.completed && item.completedBy && (
                <p className="text-[10px] text-zinc-400 mt-1 font-mono tracking-wider">
                  ✓ {item.completedBy} — {item.completedAt ? new Date(item.completedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              )}
            </div>
            <span className={`text-[10px] font-bold tracking-widest uppercase ${item.completed ? 'text-zinc-400' : 'text-zinc-300'}`}>
              {String(index + 1).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-zinc-500 stroke-[1.5]" />
            <h3 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.2em]">Historial de Cumplimiento</h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {history.slice(0, 7).map(record => (
              <div key={record.id} className="flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <div className="flex items-center gap-4">
                  {record.shift === 'apertura' ? (
                    <Sun className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
                  ) : (
                    <Moon className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      {record.shift} — {new Date(record.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-1">
                      {record.items.filter((i: any) => i.completed).length} / {record.items.length} tareas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full ${record.completionRate === 100 ? 'bg-zinc-900 dark:bg-white' : record.completionRate >= 70 ? 'bg-zinc-500' : 'bg-zinc-300'}`}
                      style={{ width: `${record.completionRate}%` }}
                    />
                  </div>
                  <span className={`text-sm font-mono font-bold ${record.completionRate === 100 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                    {record.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
