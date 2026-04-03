import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const blogPosts = [
  {
    id: 1,
    title: 'Calendario de contenidos para redes sociales (plantilla + manual)',
    excerpt: 'Descarga un calendario de contenidos para redes sociales en Excel con manual de uso incluido. Planifica, organiza y mide tu contenido mensual de forma simple y eficiente.',
    image: '/images/blog-1.jpg',
    author: 'Equipo POS-G',
    date: '15 Feb 2026',
    readTime: '5 min',
    featured: true,
  },
  {
    id: 2,
    title: 'Cómo iniciar el año con tu emprendimiento: consejos clave para crecer sin complicaciones',
    excerpt: 'Iniciar el año con tu emprendimiento implica ordenar inventario, costos y finanzas para crecer con claridad y sin improvisar.',
    image: '/images/blog-2.jpg',
    author: 'Equipo POS-G',
    date: '10 Feb 2026',
    readTime: '7 min',
    featured: false,
  },
  {
    id: 3,
    title: 'Productos para minimercado: qué vender, qué es rentable y cómo organizarte mejor',
    excerpt: 'Descubre qué productos no pueden faltar en tu minimercado, cuáles dejan más ganancia y cómo organizar tu tienda para vender más y perder menos.',
    image: '/images/blog-3.jpg',
    author: 'Equipo POS-G',
    date: '5 Feb 2026',
    readTime: '6 min',
    featured: false,
  },
];

export default function Blog() {
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

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <section
      id="blog"
      ref={sectionRef}
      className="py-24 bg-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-[#2563eb]/5 to-transparent pointer-events-none" />

      <div className="section-container relative z-10">
        {/* Section header */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-['Poppins'] mb-4 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-expo-out)' }}
            >
              Recursos para tu negocio
            </h2>
            <p
              className={`text-xl text-gray-600 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '100ms' }}
            >
              Consejos, guías y noticias para emprendedores
            </p>
          </div>
          
          <Button
            variant="outline"
            className={`rounded-full border-2 border-black hover:bg-black hover:text-white transition-all duration-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '200ms' }}
          >
            Ver todos los artículos
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Blog grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Featured post */}
          {featuredPost && (
            <div
              className={`group cursor-pointer transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '300ms' }}
            >
              <div className="relative h-full bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-64 lg:h-80 overflow-hidden">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Featured badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-[#2563eb] text-black text-sm font-semibold rounded-full">
                    Destacado
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {featuredPost.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold font-['Poppins'] mb-3 group-hover:text-[#2563eb] transition-colors duration-300">
                    {featuredPost.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {featuredPost.excerpt}
                  </p>
                  
                  <span className="inline-flex items-center gap-2 text-[#2563eb] font-semibold group-hover:gap-3 transition-all duration-300">
                    Leer más
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Regular posts */}
          <div className="space-y-6">
            {regularPosts.map((post, index) => (
              <div
                key={post.id}
                className={`group cursor-pointer flex gap-6 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ 
                  transitionTimingFunction: 'var(--ease-expo-out)', 
                  transitionDelay: `${400 + index * 100}ms` 
                }}
              >
                <div className="relative w-32 sm:w-48 flex-shrink-0 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                <div className="flex-1 py-4 pr-4">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>
                  
                  <h3 className="font-bold font-['Poppins'] mb-2 group-hover:text-[#2563eb] transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {post.excerpt}
                  </p>
                  
                  <span className="inline-flex items-center gap-1 text-sm text-[#2563eb] font-medium group-hover:gap-2 transition-all duration-300">
                    Leer más
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter CTA */}
        <div
          className={`mt-16 p-8 lg:p-12 bg-black rounded-2xl relative overflow-hidden transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
          style={{ transitionTimingFunction: 'var(--ease-expo-out)', transitionDelay: '600ms' }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563eb]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2563eb]/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="text-2xl lg:text-3xl font-bold font-['Poppins'] text-white mb-3">
                Suscríbete a nuestro newsletter
              </h3>
              <p className="text-gray-400">
                Recibe consejos, guías y noticias exclusivas para hacer crecer tu negocio.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="flex-1 lg:w-64 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-[#2563eb] transition-colors"
              />
              <Button className="btn-primary">
                Suscribirme
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
