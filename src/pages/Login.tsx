import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { error: authError } = await signIn(email, password);
      
      if (authError) {
        // Simple error message for better UX
        if (authError.message === 'Invalid login credentials') {
          setError('Correo o contraseña incorrectos');
        } else {
          setError(authError.message || 'Error al iniciar sesión');
        }
        return;
      }

      toast.success('Bienvenido a POS-G');
      navigate('/dashboard');
    } catch (err: any) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@pos-g.app');
    setPassword('demo123');
    toast.info('Credenciales de demo cargadas. PIN de seguridad: 123456');
  };

  const quotes = [
    {
      title: "Kaizen 改善",
      headline: <>"Hoy mejor que ayer, <br /><span className="text-white">mañana mejor que hoy."</span></>,
      text: "La mejora continua no es un destino, es un sistema metódico. POS-G es la herramienta estructurada para perfeccionar cada milímetro de tu operación comercial diaria."
    },
    {
      title: "Kansō 簡素",
      headline: <>"La simplicidad es la <br /><span className="text-white">máxima sofisticación."</span></>,
      text: "Eliminamos la fricción y el ruido visual. POS-G te entrega un ecosistema limpio y potente, permitiéndote enfocar el 100% de tu energía en escalar tu negocio."
    },
    {
      title: "Shingitai 心技体",
      headline: <>"Mente, técnica y <br /><span className="text-white">cuerpo en armonía."</span></>,
      text: "Diseñamos un sistema donde la tecnología se mueve al mismo ritmo que tu visión empresarial. Sincronización perfecta en tiempo real y sin retardo."
    },
    {
      title: "Seijaku 静寂",
      headline: <>"Enfoque absoluto en <br /><span className="text-white">medio del caos."</span></>,
      text: "Ante la turbulencia del comercio diario, POS-G te otorga el control sereno y preciso que necesitas para liderar tu sector de manera implacable."
    }
  ];

  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % quotes.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex bg-white font-sans antialiased text-gray-900">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-[#fcfcfc]">
        <div className="w-full max-w-md mx-auto">
          {/* Minimalist Logo */}
          <div className="relative mb-12">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-white font-semibold text-lg tracking-widest">G</span>
              </div>
              <span className="text-xl font-normal tracking-[0.2em] text-zinc-900">POS-G</span>
            </Link>
          </div>

          <div className="mb-10 relative">
            <h1 className="text-3xl font-light text-zinc-900 leading-tight tracking-tight">
              Bienvenido de <br />vuelta.
            </h1>
            <p className="text-zinc-500 mt-4 text-xs tracking-widest uppercase flex items-center gap-3">
              <span className="w-6 h-[1px] bg-zinc-900 block" /> Gestión con precisión
            </p>
          </div>

          {/* Demo credentials notice */}
          <div className="mb-8 p-6 bg-white border border-zinc-200">
            <div className="flex items-start gap-4">
               <Shield className="w-4 h-4 text-zinc-900 mt-0.5" />
               <div className="space-y-1.5">
                 <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-900">Modo Demo</p>
                 <p className="text-xs tracking-widest text-zinc-600">demo@pos-g.app / demo123</p>
                 <p className="text-[10px] tracking-widest text-zinc-400">PIN Autorización: <span className="text-zinc-900 font-medium">123456</span></p>
               </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-white border border-red-200 text-red-600 text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Correo electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within:text-zinc-900" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="TU@EMAIL.COM"
                  className="pl-12 h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 transition-all text-xs tracking-widest uppercase placeholder:text-zinc-400 text-zinc-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors group-focus-within:text-zinc-900" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 transition-all text-sm tracking-[0.3em] font-medium placeholder:text-zinc-400 text-zinc-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                Cargar Demo
              </button>
              <Link to="/forgot-password" title="Olvidé mi contraseña" className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors">
                Recuperar Contraseña
              </Link>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold uppercase tracking-[0.2em] text-xs rounded-none shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Autenticando</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-12 text-center text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
            ¿Nuevo en POS-G?{' '}
            <Link to="/register" className="text-zinc-900 hover:underline ml-2 transition-colors">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Muji/Apple Zen Inspiration */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-20 bg-zinc-900 overflow-hidden group border-l border-zinc-800">
        
        <div className="absolute top-12 left-12">
          <div className="w-12 h-[1px] bg-zinc-500 mb-6" />
          <p className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase">Filosofía Empresarial</p>
        </div>

        <div key={quoteIdx} className="relative z-10 max-w-lg w-full animate-in fade-in duration-1000">
          <p className="text-zinc-400 font-medium tracking-[0.2em] uppercase text-[10px] mb-6">{quotes[quoteIdx].title}</p>
          <h2 className="text-3xl sm:text-4xl font-light text-zinc-300 leading-snug tracking-wide mb-8">
            {quotes[quoteIdx].headline}
          </h2>
          <div className="w-8 h-[1px] bg-zinc-600 mb-8" />
          <p className="text-zinc-400 font-light leading-relaxed text-sm tracking-wide">
            {quotes[quoteIdx].text}
          </p>
        </div>

        {/* Decorative Minimal Lines */}
        <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 m-12" />
        
        {/* Carousel Indicators */}
        <div className="absolute bottom-12 left-12 flex gap-4">
          {quotes.map((_, i) => (
            <div key={i} className={`h-[1px] transition-all duration-700 ${i === quoteIdx ? 'w-8 bg-white' : 'w-4 bg-zinc-700'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
