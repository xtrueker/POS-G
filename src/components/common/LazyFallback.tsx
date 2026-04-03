import { Loader2 } from 'lucide-react';

export default function LazyFallback() {
  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center gap-3 animate-fade-in">
      <Loader2 className="w-10 h-10 text-[#F2CB05] animate-spin" />
      <p className="text-sm font-medium text-gray-500">Cargando módulo...</p>
    </div>
  );
}


