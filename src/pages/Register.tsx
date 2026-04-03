import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Store, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [confirmOwnerPin, setConfirmOwnerPin] = useState('');
  const [vertical, setVertical] = useState('gastronomy');
  const [enableLoyalty, setEnableLoyalty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      if (!name || !email || !businessName) {
        setError('Por favor completa todos los campos');
        return;
      }
      setStep(2);
      return;
    }
    
    if (step === 2) {
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (password.length < 6) {
        setError('Mínimo 6 caracteres');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (ownerPin !== confirmOwnerPin) {
        setError('Los PINs no coinciden');
        return;
      }
      if (ownerPin.length < 4) {
        setError('El PIN debe tener al menos 4 dígitos');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) return handleNext(e);
    
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Sign up user in Supabase Auth
      const { error: authError } = await signUp(email, password, { 
        full_name: name,
        business_name: businessName,
        role: 'owner',
        owner_pin: ownerPin,
        plan: 'essential'
      });

      if (authError) throw authError;

      // 2. Get the new user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 3. Atomically create Business and Profile via RPC and bypass RLS constraints
        const { error: rpcError } = await (supabase.rpc as any)('register_business', {
          p_business_name: businessName,
          p_business_email: email,
          p_profile_full_name: name,
          p_owner_pin: ownerPin,
          p_vertical: vertical,
          p_settings: {
            enable_loyalty: enableLoyalty,
            enable_bakery: vertical === 'bakery'
          }
        });

        if (rpcError) throw rpcError;

        toast.success('¡Bienvenido! Cuenta creada exitosamente');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Error al registrarse. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const quotes = [
    {
      title: "Kansō 簡素",
      headline: <>"La simplicidad es la <br /><span className="text-white">máxima sofisticación."</span></>,
      text: "Eliminamos la fricción y el ruido visual. POS-G te entrega un ecosistema limpio y potente, permitiéndote enfocar el 100% de tu energía en escalar tu negocio."
    },
    {
      title: "Kaizen 改善",
      headline: <>"Hoy mejor que ayer, <br /><span className="text-white">mañana mejor que hoy."</span></>,
      text: "La mejora continua no es un destino, es un sistema metódico. POS-G es la herramienta estructurada para perfeccionar cada milímetro de tu operación comercial diaria."
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
              Crea tu <br />cuenta.
            </h1>
            <p className="text-zinc-500 mt-4 text-xs tracking-widest uppercase flex items-center gap-3">
              <span className="w-6 h-[1px] bg-zinc-900 block" /> Vanguardia del retail
            </p>
          </div>

          {/* Minimalist Progress Bar */}
          <div className="flex gap-2 mb-10">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`flex-1 h-[1px] transition-all duration-500 overflow-hidden ${step >= s ? 'bg-zinc-200' : 'bg-zinc-100'}`}>
                {step >= s && <div className="w-full h-full bg-zinc-900" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-white border border-red-200 text-red-600 text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={step === 4 ? handleSubmit : handleNext} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Tu nombre</label>
                  <div className="relative group"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" /><Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="JUAN PÉREZ" className="pl-12 h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 transition-all text-xs tracking-widest uppercase placeholder:text-zinc-300" required /></div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Email</label>
                  <div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" /><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="TU@EMAIL.COM" className="pl-12 h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 transition-all text-xs tracking-widest uppercase placeholder:text-zinc-300" required /></div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Nombre del negocio</label>
                  <div className="relative group"><Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" /><Input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="MI COMERCIO" className="pl-12 h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 transition-all text-xs tracking-widest uppercase placeholder:text-zinc-300" required /></div>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Contraseña</label>
                  <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" /><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-12 pr-12 h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 transition-all text-sm tracking-[0.3em] font-medium placeholder:text-zinc-300 text-zinc-900" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Confirmar Contraseña</label>
                  <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" /><Input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="pl-12 pr-12 h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 transition-all text-sm tracking-[0.3em] font-medium placeholder:text-zinc-300 text-zinc-900" required /></div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 bg-white border border-zinc-200 flex gap-4">
                  <Shield className="w-4 h-4 text-zinc-900 mt-0.5" />
                  <div className="space-y-1.5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-900">Configurar PIN</p><p className="text-xs tracking-widest text-zinc-500 leading-relaxed">Este PIN de 6 dígitos protegerá anulaciones fiscales y accesos críticos.</p></div>
                </div>
                <div className="flex gap-2 justify-center py-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-12 h-12 rounded-none flex items-center justify-center font-medium text-xl transition-all border ${ownerPin[i] ? 'border-zinc-900 text-zinc-900 bg-zinc-50' : 'border-zinc-200 text-zinc-300 bg-white'}`}>{ownerPin[i] ? '•' : ''}</div>
                  ))}
                </div>
                <div className="space-y-3">
                  <Input
                    type="password"
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="NUEVO PIN"
                    className="w-full h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 text-center text-sm tracking-[1em] font-medium placeholder:tracking-widest placeholder:text-xs"
                    required
                  />
                  <Input
                    type="password"
                    value={confirmOwnerPin}
                    onChange={(e) => setConfirmOwnerPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="CONFIRMAR PIN"
                    className="w-full h-12 rounded-none border border-zinc-200 bg-white focus-visible:ring-0 focus-visible:border-zinc-900 text-center text-sm tracking-[1em] font-medium placeholder:tracking-widest placeholder:text-xs"
                    required
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">¿Cuál es tu sector?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'bakery', label: 'Panadería', icon: '🍞' },
                      { id: 'gastronomy', label: 'Restaurante', icon: '🍳' },
                      { id: 'retail', label: 'Comercio', icon: '🛍️' },
                      { id: 'beauty', label: 'Belleza', icon: '✨' },
                      { id: 'services', label: 'Servicios', icon: '✂️' },
                    ].map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVertical(v.id)}
                        className={`p-4 border text-left transition-all hover:bg-[#fcfcfc] ${vertical === v.id ? 'border-zinc-900 bg-white shadow-sm' : 'border-zinc-100 text-zinc-400'}`}
                      >
                        <span className="block text-xl mb-1">{v.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-tight">{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-white border border-zinc-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-900">Fidelización de Clientes</p>
                      <p className="text-[10px] text-zinc-500">Activa el sistema de puntos y niveles.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableLoyalty(!enableLoyalty)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${enableLoyalty ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enableLoyalty ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6">
              {step > 1 && (
                <Button type="button" onClick={() => setStep(step - 1)} variant="outline" className="flex-1 h-12 rounded-none border-zinc-200 font-semibold uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900">ATRAS</Button>
              )}
              <Button type="submit" disabled={isLoading} className="flex-[2] h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold uppercase tracking-[0.2em] text-[10px] rounded-none shadow-none transition-all disabled:opacity-50 flex items-center justify-center">
                <span>
                  {isLoading ? 'CONFIGURANDO...' : (step === 4 ? 'EMPEZAR' : 'CONTINUAR')}
                </span>
              </Button>
            </div>
          </form>

          <p className="mt-12 text-center text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
            ¿Ya tienes una cuenta? <Link to="/login" className="text-zinc-900 hover:underline ml-2 transition-colors">Iniciar sesión</Link>
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
