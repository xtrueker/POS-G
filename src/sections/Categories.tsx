import { useEffect, useRef, useState } from 'react';
import { ArrowRight, UtensilsCrossed, ShoppingBag, Briefcase, Store } from 'lucide-react';

const categories = [
  {
    id: 'gastronomicos',
    title: 'Negocios gastronómicos',
    icon: UtensilsCrossed,
    image: '/images/category-gastronomicos.jpg',
    businesses: ['Restaurantes', 'Cafés', 'Bares', 'Comida rápida', 'Licoreras', 'Panaderías'],
    description: 'El Sistema POS-G es la solución ideal para negocios gastronómicos. Gestiona inventarios de insumos, controla costos, organiza pedidos y calcula márgenes de ganancia en tiempo real. Las facturas tipo ticket son perfectas para este sector.',
    benefit: 'Optimiza compras, reduce desperdicios y aumenta la rentabilidad de tu negocio gastronómico.',
  },
  {
    id: 'comercios',
    title: 'Comercios',
    icon: ShoppingBag,
    image: '/images/category-comercios.jpg',
    businesses: ['Tiendas de ropa', 'Artículos para el hogar', 'Tiendas de accesorios', 'Tiendas de regalos', 'Jardinería', 'Tiendas de zapatos'],
    description: 'Para comercios retail, POS-G ofrece un sistema POS que gestiona inventarios, múltiples proveedores y categorías de productos. Controla stock, precios y descuentos en tiempo real con facturación instantánea.',
    benefit: 'La solución ideal para profesionalizar la gestión del negocio.',
  },
  {
    id: 'servicios',
    title: 'Servicios',
    icon: Briefcase,
    image: '/images/category-servicios.jpg',
    businesses: ['Servicios profesionales', 'Servicios de limpieza', 'Servicios de salud', 'Servicios de belleza y estética', 'Talleres y servicios automotriz', 'Veterinaria'],
    description: 'En el sector servicios, POS-G funciona como un sistema de gestión integral que te permite administrar clientes, proveedores, controlar ingresos y egresos. Genera facturas profesionales en segundos.',
    benefit: 'Mantén el control total de tu flujo de caja y rentabilidad.',
  },
  {
    id: 'mercados',
    title: 'Mercados',
    icon: Store,
    image: '/images/category-mercados.jpg',
    businesses: ['Minimercados', 'Mercados', 'Tiendas de barrios', 'Charcuterías', 'Frutas y verduras', 'Distribuidor mayorista'],
    description: 'Para mercados, POS-G ofrece un sistema POS y software de gestión que facilita el control de inventarios, proveedores y ventas. Administra productos por kilos, litros o unidades con facturación rápida.',
    benefit: 'La herramienta ideal para modernizar tu mercado.',
  },
];

export default function Categories() {
  const [activeCategory, setActiveCategory] = useState(0);
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="categories"
      ref={sectionRef}
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#2563eb]/5 to-transparent pointer-events-none" />

      <div className="section-container relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-['Poppins'] mb-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionTimingFunction: 'var(--ease-expo-out)' }}
          >
            No importa el tipo de negocio que tengas
          </h2>
          <p
            className={`text-xl text-gray-600 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '100ms' }}
          >
            En <span className="text-[#2563eb] font-semibold">POS-G</span> somos tus aliados
          </p>
        </div>

        {/* Category tabs */}
        <div
          className={`flex flex-wrap justify-center gap-3 mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '200ms' }}
        >
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(index)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === index
                  ? 'bg-[#2563eb] text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-expo-out)' }}
            >
              <category.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{category.title}</span>
            </button>
          ))}
        </div>

        {/* Active category content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div
            className={`relative transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
            style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '300ms' }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src={categories[activeCategory].image}
                alt={categories[activeCategory].title}
                className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* Business types overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex flex-wrap gap-2">
                  {categories[activeCategory].businesses.map((business) => (
                    <span
                      key={business}
                      className="px-3 py-1 bg-white/90 backdrop-blur-sm text-sm font-medium rounded-full"
                    >
                      {business}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className={`space-y-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
            style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '400ms' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#2563eb]/10 rounded-xl flex items-center justify-center">
                {(() => {
                  const Icon = categories[activeCategory].icon;
                  return <Icon className="w-6 h-6 text-[#2563eb]" />;
                })()}
              </div>
              <h3 className="text-2xl font-bold font-['Poppins']">
                {categories[activeCategory].title}
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 text-lg leading-relaxed">
                {categories[activeCategory].description}
              </p>
              
              <div className="p-4 bg-[#2563eb]/10 rounded-xl border-l-4 border-[#2563eb]">
                <p className="text-black font-medium">
                  {categories[activeCategory].benefit}
                </p>
              </div>
            </div>

            <button className="group flex items-center gap-2 text-[#2563eb] font-semibold hover:gap-4 transition-all duration-300">
              Conoce más
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Category cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {categories.map((category, index) => (
            <div
              key={category.id}
              onClick={() => setActiveCategory(index)}
              className={`group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-500 ${
                activeCategory === index
                  ? 'border-[#2563eb] bg-[#2563eb]/5'
                  : 'border-gray-100 bg-white hover:border-[#2563eb]/50 hover:shadow-lg'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ 
                transitionTimingFunction: 'var(--ease-expo-out)', 
                transitionDelay: `${500 + index * 100}ms` 
              }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                activeCategory === index ? 'bg-[#2563eb]' : 'bg-gray-100 group-hover:bg-[#2563eb]/20'
              }`}>
                <category.icon className={`w-6 h-6 transition-colors duration-300 ${
                  activeCategory === index ? 'text-black' : 'text-gray-600 group-hover:text-[#2563eb]'
                }`} />
              </div>
              <h4 className="font-semibold text-lg mb-2">{category.title}</h4>
              <p className="text-sm text-gray-500">{category.businesses.length} tipos de negocios</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
