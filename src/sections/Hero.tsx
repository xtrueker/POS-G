import { useEffect, useRef, useState } from 'react';
import {
  Smartphone, BarChart3, Users, Globe, ArrowRight,
  ShieldCheck, Zap, TrendingUp, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const COUNTERS_TARGET = { businesses: 25000, transactions: 1200000, cities: 32 };

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [counters, setCounters] = useState({ businesses: 0, transactions: 0, cities: 0 });
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsVisible(true);
    const duration = 2200;
    const steps = 80;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const p = 1 - Math.pow(1 - step / steps, 3);
      setCounters({
        businesses: Math.floor(COUNTERS_TARGET.businesses * p),
        transactions: Math.floor(COUNTERS_TARGET.transactions * p),
        cities: Math.floor(COUNTERS_TARGET.cities * p),
      });
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  const formatK = (n: number) => n >= 1000 ? `+${(n / 1000).toFixed(0)}K` : `+${n}`;

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-[90vh] pt-32 pb-20 overflow-hidden bg-white"
    >
      {/* Grid background - Clean and technical */}
      <div className="absolute inset-0 pointer-events-none stroke-slate-200/50"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M80 80V0H0' fill='none' fill-rule='evenodd' stroke='%23f1f5f9' stroke-width='1.5'/%3E%3C/svg%3E")` 
        }} />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-2 pr-4 items-center">

          {/* ── Left ── */}
          <div className="space-y-10">
            {/* Eyebrow badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[#fff1f2] border border-red-100/50 text-red-600 rounded-lg text-[10px] font-black tracking-[0.1em] transition-all duration-700 uppercase ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '200ms' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              EL POS SÍMBOLO DE COLOMBIA
            </div>

            {/* Headline */}
            <h1 className="text-7xl sm:text-8xl lg:text-[6.5rem] font-black font-['Poppins'] leading-[0.95] tracking-[-0.04em] text-[#0f172a]">
              <span className={`block transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
                Conquista
              </span>
              <span className={`block transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
                el comercio
              </span>
              <span className={`block transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '500ms' }}>
                con <span className="text-[#ef4444]">POS-G.</span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className={`text-xl text-slate-500 max-w-lg transition-all duration-700 leading-relaxed font-medium ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '600ms' }}>
              La plataforma más completa para manejar ventas, inventario, facturación electrónica DIAN y clientes — desde tu celular o computador.
            </p>

            {/* Feature bullets */}
            <div className="space-y-4 pt-4">
              {[
                { icon: Smartphone, text: 'Ecosistema ubicuo — celular y computador' },
                { icon: BarChart3, text: 'Precisión y métricas en tiempo real' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-4 transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                  style={{ transitionDelay: `${660 + i * 80}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-slate-600 font-semibold text-base">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className={`flex flex-wrap gap-4 transition-all duration-700 pt-4 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '1000ms' }}>
              <Link to="/register">
                <Button size="lg" className="bg-black text-white hover:bg-[#ef4444] text-xs tracking-[0.2em] font-black uppercase px-10 rounded-xl shadow-2xl transition-all h-16 flex items-center group">
                     Abrir cuenta
                     <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-xs tracking-[0.2em] font-black uppercase px-10 rounded-xl border-slate-200 h-16 hover:bg-slate-50">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Right — Dashboard Preview ── */}
          <div className={`relative pt-12 lg:pt-0 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'}`} style={{ transitionDelay: '400ms' }}>
            <div className="relative animate-float sm:px-12">
              <div className="absolute -inset-4 bg-slate-100/50 rounded-3xl blur-3xl opacity-50" />
              
              <div className="relative bg-white border border-slate-200 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] overflow-hidden">
                {/* Fake browser chrome */}
                <div className="bg-slate-50/50 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                  </div>
                  <div className="flex-1 max-w-xs mx-4 bg-white border border-slate-100 rounded-lg py-1.5 text-[10px] text-slate-400 font-mono text-center tracking-wider">pos-g.app/dashboard</div>
                  <div className="w-10 h-3" />
                </div>

                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Ventas hoy</div>
                      <div className="text-4xl font-black text-slate-900 tracking-tighter">+$2.847.000</div>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: 'Productos', val: '142', color: 'bg-slate-50 text-slate-900 border border-slate-100' },
                      { label: 'Clientes', val: '89', color: 'bg-slate-50 text-slate-900 border border-slate-100' },
                      { label: 'Ganancia', val: '68%', color: 'bg-[#ef4444] text-white shadow-lg shadow-red-200' },
                    ].map(s => (
                      <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center transition-transform hover:scale-105 duration-300`}>
                        <div className="text-xl font-black">{s.val}</div>
                        <div className="text-[9px] uppercase font-black tracking-widest opacity-80">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: 'Pan Artesanal × 12', price: '$42.000' },
                      { name: 'Café Americano × 8', price: '$44.000' },
                      { name: 'Croissant × 6', price: '$27.000' }
                    ].map(s => (
                      <div key={s.name} className="flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 p-4 rounded-xl border border-transparent hover:border-slate-100 transition-all duration-200">
                        <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                        <span className="text-sm font-black text-slate-900">{s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -right-4 bg-white rounded-2xl shadow-2xl p-5 border border-slate-100 animate-float-delayed">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative">
                    <Zap className="w-5 h-5 text-slate-900" />
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">En vivo</p>
                    <p className="text-base font-black text-slate-900 tracking-tight">4.231 operaciones</p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -left-4 bg-[#0f172a] rounded-2xl shadow-xl px-5 py-3 border border-slate-800 flex items-center gap-2.5 z-20">
                <div className="w-5 h-5 bg-red-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">DIAN Avalado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className={`mt-24 grid grid-cols-2 lg:grid-cols-4 gap-1 p-1 bg-[#0f172a] rounded-[2rem] shadow-3xl text-white transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          style={{ transitionDelay: '1300ms' }}>
          {[
            { icon: Users, label: 'negocios colombianos', value: formatK(counters.businesses) },
            { icon: Globe, label: 'departamentos activos', value: `+${counters.cities}` },
            { icon: Star, label: 'calificación promedio', value: '4.9' },
            { icon: Smartphone, label: 'tiempo de actividad', value: '99.9%' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="py-10 text-center hover:bg-white/5 transition-colors duration-300 first:rounded-l-[1.9rem] last:rounded-r-[1.9rem]">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-red-500" />
                  <span className="text-4xl font-black tracking-tighter font-['Poppins']">{value}</span>
                </div>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
