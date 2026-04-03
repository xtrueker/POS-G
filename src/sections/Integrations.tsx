import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const integrations = [
  { name: 'PayU', emoji: '🏦', desc: 'Pagos en línea y recaudo' },
  { name: 'Nequi', emoji: '📱', desc: 'Pagos móviles Colombia' },
  { name: 'DaviPlata', emoji: '💳', desc: 'Billetera Davivienda' },
  { name: 'PSE', emoji: '🏛️', desc: 'Débito bancario en línea' },
  { name: 'MercadoPago', emoji: '💰', desc: 'Pagos internacionales' },
  { name: 'WhatsApp', emoji: '💬', desc: 'Notificaciones y ventas' },
  { name: 'Gmail', emoji: '📧', desc: 'Facturas por correo' },
  { name: 'Siigo DIAN', emoji: '🇨🇴', desc: 'Facturación electrónica' },
];

export default function Integrations() {
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
    <section id="integraciones" ref={ref} className="py-24 bg-black overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(242,203,5,0.08) 0%, transparent 70%)',
      }} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563eb]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563eb]/30 to-transparent" />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb]/10 border border-[#2563eb]/20 text-[#2563eb] rounded-full text-sm font-semibold mb-6">
              ⚡ Conectado con Colombia
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-['Poppins'] text-white mb-6 leading-tight">
              Integrado con los<br /><span className="text-[#2563eb]">métodos de pago</span><br />que ya usas
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Conecta POS-G con Nequi, DaviPlata, PayU y las pasarelas de pago más usadas en Colombia. Acepta pagos digitales desde el primer día.
            </p>
            <a href="#contact" className="inline-flex items-center gap-2 bg-[#2563eb] text-black font-semibold px-6 py-3 rounded-xl hover:bg-[#1d4ed8] transition-colors group">
              Ver todas las integraciones
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Right — integration grid */}
          <div className={`grid grid-cols-2 gap-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '200ms' }}>
            {integrations.map((item, i) => (
              <div
                key={item.name}
                className="group bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-[#2563eb]/30 transition-all duration-300 cursor-pointer"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110">{item.emoji}</div>
                <div className="font-semibold text-white text-sm">{item.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
