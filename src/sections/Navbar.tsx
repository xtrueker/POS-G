import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, Globe, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Inicio', href: '#hero' },
  { 
    name: 'Soluciones', 
    href: '#sectores',
    dropdown: [
      { name: 'Restaurantes', href: '#sectores' },
      { name: 'Peluquerías', href: '#sectores' },
      { name: 'Boutiques', href: '#sectores' },
      { name: 'Farmacias', href: '#sectores' },
      { name: 'Ferreterías', href: '#sectores' },
    ]
  },
  { name: 'Integraciones', href: '#integraciones' },
  { name: 'Precios', href: '#pricing' },
  { name: 'Blog', href: '#blog' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setIsScrolled(currentScrollY > 50);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center w-full px-4 sm:px-6 lg:px-8 transition-all duration-700 ${isVisible ? 'translate-y-4' : '-translate-y-full'}`}>
      <nav
        className={`w-full max-w-6xl rounded-2xl transition-all duration-500 border overflow-visible ${
          isScrolled
            ? 'glass-effect bg-white/70 backdrop-blur-2xl border-white/50 shadow-2xl shadow-slate-200/50 py-3'
            : 'bg-transparent border-transparent py-4'
        }`}
      >
        <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('#hero');
            }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-bl-lg" />
              <span className="text-white font-black text-xl font-['Poppins']">G</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black font-['Poppins'] text-black tracking-tighter leading-none">
                POS-G
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.href);
                  }}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-black transition-colors duration-200 group py-2"
                >
                  <span className="relative">
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                  </span>
                  {link.dropdown && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} />
                  )}
                </a>

                {/* Dropdown */}
                {link.dropdown && activeDropdown === link.name && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up p-2">
                    {link.dropdown.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(item.href);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black rounded-xl transition-all duration-200"
                      >
                        <Zap className="w-4 h-4 text-red-600" />
                        {item.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-full text-[11px] font-bold text-slate-500 mr-2">
              <Globe className="w-3 h-3" />
              ES-CO
            </div>
            <Link to="/login">
              <Button
                variant="ghost"
                className="text-sm font-bold hover:bg-slate-100 rounded-xl"
              >
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button
                className="rounded-xl bg-black text-white hover:bg-[#ef4444] font-black tracking-[0.1em] text-xs uppercase px-8 hover:scale-105 transition-all duration-300 h-14 shadow-xl flex items-center gap-3 group"
              >
                Abrir cuenta
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-black hover:bg-slate-200 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-6 border-t border-gray-100 pt-6 animate-slide-up bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <div key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="flex justify-between items-center text-lg font-bold text-gray-900"
                  >
                    {link.name}
                    {link.dropdown && <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </a>
                </div>
              ))}
              <hr className="my-2 border-gray-100" />
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold text-gray-600">Facturación DIAN avalada</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login">
                  <Button variant="outline" className="w-full rounded-2xl h-12 font-bold border-2">Entrar</Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full rounded-2xl h-12 bg-black text-white font-bold">Registro</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        </div>
      </nav>
    </div>
  );
}
