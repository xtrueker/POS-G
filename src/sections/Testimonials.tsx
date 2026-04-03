import { useEffect, useRef, useState } from 'react';
import { Quote, TrendingUp, TrendingDown, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'María González',
    business: 'Panadería Don Pepe',
    location: 'Bogotá',
    image: '/images/testimonial-maria.jpg',
    quote: 'Con POS-G pude organizar mis ventas y ahora facturó 40% más que antes. Las facturas tipo ticket son perfectas para mi negocio.',
    metric: 'Aumentó ventas 40%',
    trend: 'up',
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    business: 'Ferretería El Martillo',
    location: 'Medellín',
    image: '/images/testimonial-carlos.jpg',
    quote: 'Antes perdía muchas ventas por no controlar el inventario. Ahora sé exactamente qué tengo y qué necesito.',
    metric: 'Redujo pérdidas 60%',
    trend: 'down',
  },
  {
    id: 3,
    name: 'Ana Herrera',
    business: 'Salón de Belleza Glamour',
    location: 'Cali',
    image: '/images/testimonial-ana.jpg',
    quote: 'POS-G me ayudó a entender cuáles servicios me dan más ganancia. Las facturas se imprimen perfectamente.',
    metric: 'Mejoró rentabilidad 35%',
    trend: 'up',
  },
];

// Duplicate for infinite scroll
const duplicatedTestimonials = [...testimonials, ...testimonials];

export default function Testimonials() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#2563eb]/5 to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Section header */}
        <div className="section-container text-center max-w-3xl mx-auto mb-16">
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-['Poppins'] mb-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionTimingFunction: 'var(--ease-expo-out)' }}
          >
            Casos de éxito reales
          </h2>
          <p
            className={`text-xl text-gray-600 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '100ms' }}
          >
            Miles de emprendedores ya transformaron sus negocios con POS-G
          </p>
        </div>

        {/* Testimonials marquee - Row 1 */}
        <div
          className={`mb-8 transition-all duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '200ms' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className={`flex gap-6 ${isPaused ? '' : 'animate-marquee'}`}
            style={{ width: 'fit-content' }}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <div
                key={`row1-${testimonial.id}-${index}`}
                className="w-[400px] flex-shrink-0 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                style={{ 
                  transform: 'perspective(1000px) rotateY(-3deg)',
                }}
              >
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-[#2563eb]/30 mb-4" />
                
                {/* Quote text */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author info */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#2563eb]/20"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-black">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.business}</p>
                    <p className="text-xs text-gray-400">{testimonial.location}</p>
                  </div>
                </div>

                {/* Metric badge */}
                <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  testimonial.trend === 'up' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {testimonial.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {testimonial.metric}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials marquee - Row 2 (reverse) */}
        <div
          className={`transition-all duration-700 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '300ms' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className={`flex gap-6 ${isPaused ? '' : 'animate-marquee-reverse'}`}
            style={{ width: 'fit-content' }}
          >
            {[...duplicatedTestimonials].reverse().map((testimonial, index) => (
              <div
                key={`row2-${testimonial.id}-${index}`}
                className="w-[400px] flex-shrink-0 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300"
                style={{ 
                  transform: 'perspective(1000px) rotateY(3deg)',
                }}
              >
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-[#2563eb]/30 mb-4" />
                
                {/* Quote text */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author info */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#2563eb]/20"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-black">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.business}</p>
                    <p className="text-xs text-gray-400">{testimonial.location}</p>
                  </div>
                </div>

                {/* Metric badge */}
                <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  testimonial.trend === 'up' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {testimonial.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {testimonial.metric}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating summary */}
        <div
          className={`section-container mt-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '400ms' }}
        >
          <div className="flex flex-wrap justify-center items-center gap-8 p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-[#2563eb] fill-[#2563eb]" />
                ))}
              </div>
              <p className="text-2xl font-bold">4.8/5</p>
              <p className="text-sm text-gray-500">App Store</p>
            </div>
            <div className="w-px h-16 bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-[#2563eb] fill-[#2563eb]" />
                ))}
              </div>
              <p className="text-2xl font-bold">4.8/5</p>
              <p className="text-sm text-gray-500">Google Play</p>
            </div>
            <div className="w-px h-16 bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <p className="text-4xl font-bold text-[#2563eb]">+7M</p>
              <p className="text-sm text-gray-500">Descargas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
