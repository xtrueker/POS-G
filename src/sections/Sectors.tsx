import { useEffect, useRef, useState } from 'react';

const sectors = [
  { emoji: '🍕', name: 'Restaurantes', sub: 'Pizzerías, asaderos,\ncafeterías y más', count: '+4.200' },
  { emoji: '💇', name: 'Peluquerías', sub: 'Barberías, spas\ny centros de belleza', count: '+3.800' },
  { emoji: '👗', name: 'Boutiques', sub: 'Ropa, calzado\ny accesorios', count: '+5.100' },
  { emoji: '💊', name: 'Farmacias', sub: 'Droguerías y\nbotiquines', count: '+1.900' },
  { emoji: '🔧', name: 'Ferreterías', sub: 'Materiales y\nsuministros técnicos', count: '+2.300' },
  { emoji: '🐾', name: 'Veterinarias', sub: 'Clínicas, tiendas\ny peluquerías pet', count: '+980' },
  { emoji: '📚', name: 'Papelerías', sub: 'Útiles, impresión\ny encuadernado', count: '+1.400' },
  { emoji: '🛒', name: 'Minimercados', sub: 'Tiendas, graneros\ny superetes', count: '+6.700' },
];

export default function Sectors() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.05 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="sectores" ref={ref} className="py-24 bg-gray-50 overflow-hidden">
      <div className="section-container">
        <div className="text-center mb-14">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-black text-[#2563eb] rounded-full text-sm font-semibold mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            🇨🇴 Para cada sector de Colombia
          </div>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-['Poppins'] mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            POS-G funciona para <span className="text-[#2563eb]">tu tipo de negocio</span>
          </h2>
          <p className={`text-xl text-gray-600 max-w-2xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '100ms' }}>
            Más de 25.000 negocios en toda Colombia ya digitalizaron sus ventas con POS-G.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sectors.map((sector, i) => (
            <div
              key={sector.name}
              className={`group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#2563eb] hover:shadow-xl transition-all duration-500 cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + i * 60}ms` }}
            >
              <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110">{sector.emoji}</div>
              <h3 className="font-bold text-gray-900 mb-1">{sector.name}</h3>
              <p className="text-xs text-gray-500 mb-3 whitespace-pre-line">{sector.sub}</p>
              <div className="inline-flex items-center gap-1.5 bg-[#2563eb]/10 text-gray-800 rounded-full px-3 py-1 text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {sector.count} activos
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className={`mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '700ms' }}>
          {[
            { label: 'Departamentos de Colombia', value: '+32' },
            { label: 'Ventas procesadas al día', value: '+48.000' },
            { label: 'Productos gestionados', value: '+2.1M' },
            { label: 'Clientes en programas de lealtad', value: '+310K' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl font-bold text-black mb-1 font-['Poppins']">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
