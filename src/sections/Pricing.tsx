import { useEffect, useRef, useState } from 'react';
import { Check, ArrowRight, Sparkles, Zap, Building2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const plans = [
  {
    id: 'gratis',
    name: 'Gratis',
    price: '$0',
    period: '/mes para siempre',
    badge: null,
    description: 'Para emprendedores que están iniciando',
    icon: Sparkles,
    color: 'from-gray-50 to-gray-100',
    btnClass: 'bg-black text-white hover:bg-gray-800',
    features: [
      '1 sede activa',
      'Hasta 500 productos',
      'Ventas y compras ilimitadas',
      'Control de inventario básico',
      'Gestión de clientes',
      'Reportes mensuales',
      'Soporte por email',
    ],
  },
  {
    id: 'esencial',
    name: 'Esencial',
    price: '$49.900',
    period: '/mes',
    badge: 'Más popular',
    description: 'Para negocios que quieren crecer',
    icon: Zap,
    color: 'from-[#2563eb] to-[#1d4ed8]',
    btnClass: 'bg-black text-white hover:bg-gray-800',
    features: [
      'Hasta 3 sedes',
      'Productos ilimitados',
      'Facturación electrónica DIAN',
      'Exportar PDF y Excel',
      'Programa de lealtad de clientes',
      'Reportes avanzados',
      'Múltiples cajeros',
      'Soporte prioritario 24/7',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99.900',
    period: '/mes',
    badge: 'Más completo',
    description: 'Para cadenas y negocios establecidos',
    icon: Building2,
    color: 'from-gray-900 to-black',
    textColor: 'text-white',
    btnClass: 'bg-[#2563eb] text-black hover:bg-[#1d4ed8]',
    features: [
      'Sedes ilimitadas',
      'API para integraciones',
      'Integraciones PayU / Nequi',
      'Gestión multi-usuario avanzada',
      'Analytics con IA',
      'Dashboard personalizable',
      'Inventario multi-almacén',
      'Gerente de cuenta dedicado',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'A la medida',
    period: '',
    badge: null,
    description: 'Para franquicias y grandes cadenas',
    icon: Crown,
    color: 'from-purple-50 to-indigo-50',
    btnClass: 'bg-black text-white hover:bg-gray-800',
    features: [
      'Todo lo de Pro',
      'Integración ERP (SAP, Siigo)',
      'Módulo de nómina y RRHH',
      'White-label disponible',
      'SLA garantizado 99.99%',
      'Capacitación presencial',
      'Soporte técnico dedicado 24/7',
      'Personalización total',
    ],
  },
];

export default function Pricing() {
  const [isVisible, setIsVisible] = useState(false);
  const [annual, setAnnual] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } }, { threshold: 0.05 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="py-28 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#2563eb]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-black/3 rounded-full blur-3xl" />
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb]/10 text-black rounded-full mb-6 text-sm font-semibold transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Sparkles className="w-4 h-4 text-[#1d4ed8]" />
            Planes para todo negocio colombiano
          </div>
          <h2 className={`text-4xl sm:text-5xl font-bold font-['Poppins'] mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Elige el plan <span className="text-[#2563eb]">que necesitas</span>
          </h2>
          <p className={`text-xl text-gray-600 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '100ms' }}>
            Empieza gratis y escala cuando tu negocio lo requiera. Sin contratos, sin letras pequeñas.
          </p>

          {/* Annual toggle */}
          <div className={`inline-flex items-center gap-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
            <span className={`text-sm ${!annual ? 'font-semibold' : 'text-gray-500'}`}>Mensual</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-black' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-6' : ''}`} />
            </button>
            <span className={`text-sm ${annual ? 'font-semibold' : 'text-gray-500'}`}>
              Anual <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full ml-1">-20%</span>
            </span>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isDark = plan.id === 'pro';
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl overflow-hidden transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} hover:scale-[1.02] hover:shadow-2xl`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                {plan.badge && (
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${plan.id === 'esencial' ? 'bg-black text-[#2563eb]' : 'bg-[#2563eb] text-black'}`}>
                    {plan.badge}
                  </div>
                )}

                <div className={`bg-gradient-to-br ${plan.color} p-6 h-full flex flex-col`}>
                  <div className={`w-10 h-10 ${isDark ? 'bg-white/10' : 'bg-black/10'} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${isDark ? 'text-[#2563eb]' : 'text-black'}`} />
                  </div>

                  <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{plan.description}</p>

                  <div className="mb-6">
                    <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      {annual && plan.price !== '$0' && plan.price !== 'A la medida'
                        ? plan.price.replace('$', '$').replace(/[\d.]+/, m => String(Math.round(parseInt(m.replace(/\./g, '')) * 0.8 / 1000) * 1000).replace(/\B(?=(\d{3})+(?!\d))/g, '.'))
                        : plan.price}
                    </span>
                    {plan.period && <span className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>}
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2">
                        <div className={`w-5 h-5 ${isDark ? 'bg-[#2563eb]/20' : 'bg-black/10'} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Check className={`w-3 h-3 ${isDark ? 'text-[#2563eb]' : 'text-black'}`} />
                        </div>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.id === 'enterprise' ? '#contact' : '/register'}>
                    <Button className={`w-full rounded-xl ${plan.btnClass}`}>
                      {plan.id === 'gratis' ? 'Empezar gratis' : plan.id === 'enterprise' ? 'Contactar ventas' : 'Comenzar ahora'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className={`mt-16 flex flex-wrap justify-center gap-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '700ms' }}>
          {['✅ Sin tarjeta de crédito', '✅ Cancela cuando quieras', '✅ Sin contratos largos', '✅ Datos siempre tuyos', '✅ Soporte en español'].map(t => (
            <span key={t} className="text-gray-600 font-medium">{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
