import { useEffect, useRef, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: '¿Qué es POS-G y cómo funciona?',
    answer: 'POS-G es un sistema POS (Punto de Venta) gratuito que te ayuda a manejar ventas, inventario, clientes, proveedores y facturación de tu negocio desde el celular o computador. Es muy fácil de usar: registras tus productos, creas facturas tipo ticket de tienda, y llevas el control total de tu negocio.',
  },
  {
    question: '¿POS-G es realmente gratis?',
    answer: '¡Sí! POS-G es 100% gratuito para siempre. No hay planes de pago, no hay límites de uso, no hay publicidad. Todas las funcionalidades están disponibles desde el día uno: facturación, inventario, reportes, clientes, proveedores y más.',
  },
  {
    question: '¿En qué países puedo usar POS-G?',
    answer: 'POS-G está disponible en todos los países de habla hispana. Puedes usarlo desde cualquier lugar con conexión a internet. El sistema está optimizado para negocios en América Latina, España y cualquier región hispanohablante.',
  },
  {
    question: '¿Necesito conexión a internet para usar POS-G?',
    answer: 'Sí, POS-G requiere conexión a internet para funcionar. Esto permite que tu información se sincronice en la nube y esté disponible en todos tus dispositivos. Tus datos están seguros y accesibles desde cualquier lugar.',
  },
  {
    question: '¿POS-G funciona en celular y computadora?',
    answer: '¡Sí! POS-G es una aplicación web que funciona perfectamente en celulares, tablets y computadoras. Solo necesitas abrir tu navegador, iniciar sesión y empezar a usar el sistema. La interfaz se adapta automáticamente a cualquier pantalla.',
  },
  {
    question: '¿Qué tipos de negocios pueden usar POS-G?',
    answer: 'POS-G está diseñado para todo tipo de negocios: tiendas de ropa, restaurantes, cafés, peluquerías, mercados, talleres, consultorios médicos, servicios profesionales, ferreterías, papelerías y muchos más. Cualquier negocio que necesite facturación y control de inventario.',
  },
  {
    question: '¿Puedo imprimir las facturas?',
    answer: '¡Sí! Las facturas de POS-G están diseñadas como tickets de tienda, perfectas para imprimir en impresoras térmicas o normales. Solo creas la factura, la marcas como pagada y puedes imprimirla directamente desde tu navegador.',
  },
  {
    question: '¿POS-G me ayuda con el inventario?',
    answer: 'Sí, POS-G tiene un sistema completo de inventario. Puedes registrar productos, controlar stock, recibir alertas cuando un producto está por agotarse, y el inventario se actualiza automáticamente con cada venta o factura.',
  },
  {
    question: '¿Cómo empiezo a usar POS-G?',
    answer: 'Es muy fácil: 1) Crea una cuenta gratuita en nuestro sitio web, 2) Configura tu negocio, 3) Agrega tus productos, 4) ¡Empieza a crear facturas y registrar ventas! Todo el proceso toma menos de 5 minutos.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-[#2563eb]/5 to-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-[#2563eb]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left column - Title */}
          <div className="lg:col-span-2 lg:sticky lg:top-32 lg:self-start">
            <div
              className={`transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-expo-out)' }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb]/10 rounded-full mb-6">
                <HelpCircle className="w-5 h-5 text-[#2563eb]" />
                <span className="text-sm font-medium">¿Tienes dudas?</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-['Poppins'] mb-6">
                Preguntas frecuentes
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                Resolvemos las dudas más comunes sobre POS-G. Si no encuentras tu respuesta, contáctanos.
              </p>

              <button className="btn-primary">
                Contactar soporte
              </button>
            </div>
          </div>

          {/* Right column - Accordion */}
          <div className="lg:col-span-3 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl border-2 transition-all duration-500 ${
                  openIndex === index 
                    ? 'border-[#2563eb] shadow-lg' 
                    : 'border-gray-100 hover:border-[#2563eb]/50'
                } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ 
                  transitionTimingFunction: 'var(--ease-expo-out)', 
                  transitionDelay: `${100 + index * 50}ms` 
                }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-lg pr-4">{faq.question}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      openIndex === index 
                        ? 'bg-[#2563eb] rotate-180' 
                        : 'bg-gray-100'
                    }`}
                  >
                    <ChevronDown className={`w-5 h-5 transition-colors ${
                      openIndex === index ? 'text-black' : 'text-gray-500'
                    }`} />
                  </div>
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    openIndex === index ? 'max-h-96' : 'max-h-0'
                  }`}
                  style={{ transitionTimingFunction: 'var(--ease-expo-out)' }}
                >
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
