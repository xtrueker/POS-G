import { useRef, useEffect } from 'react';
import { ScanBarcode, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { type Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface ScannerPanelProps {
  products: Product[];
  filteredProducts: Product[];
  productSearch: string;
  setProductSearch: (search: string) => void;
  addToCart: (product: Product) => void;
  isOpen: boolean;
}

export default function ScannerPanel({ products, filteredProducts, productSearch, setProductSearch, addToCart, isOpen }: ScannerPanelProps) {
  const scannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const refocusScanner = () => {
    setTimeout(() => scannerInputRef.current?.focus(), 50);
  };

  const handleScannerSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = productSearch.trim();
      if (!code) return;

      const exactMatch = products.find(
        p => p.barcode === code || p.sku === code || p.name.toLowerCase() === code.toLowerCase()
      );

      if (exactMatch) {
        if (exactMatch.stock <= 0) {
          toast.error(`Sin inventario: ${exactMatch.name}`);
        } else {
          addToCart(exactMatch);
          setProductSearch('');
          toast.success(`${exactMatch.name} registrado`, { id: 'scan-success', duration: 1000 });
        }
      } else {
        toast.error(`Producto no hallado: ${code}`);
      }
      refocusScanner();
    }
  };

  return (
    <div className="p-8 flex flex-col h-[calc(100vh-250px)]">
      <div className="mb-6">
        <label className="text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center text-zinc-500">
          <ScanBarcode className="w-4 h-4 mr-2" />
          Escaneo Rápido (Barcode / SKU / Nombre)
        </label>
        <div className="relative">
          <Input
            ref={scannerInputRef}
            placeholder="CÓDIGO DE BARRAS..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={handleScannerSubmit}
            autoComplete="off"
            className="pl-6 h-20 text-2xl font-mono border-2 border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl tracking-[0.2em] focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 transition-all placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-sans font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-900">
               <span className="text-xs">↵</span> ENTER
             </kbd>
          </div>
        </div>
      </div>
      
      <div className="flex-1 border border-zinc-100 dark:border-zinc-900 overflow-hidden flex flex-col bg-white dark:bg-zinc-950">
        {productSearch && filteredProducts.length > 0 ? (
           <div className="overflow-y-auto flex-1 custom-scrollbar">
             {filteredProducts.map(product => (
               <div
                 key={product.id}
                 className="flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 cursor-pointer border-b border-zinc-50 dark:border-zinc-900 last:border-b-0 transition-colors"
                 onClick={() => { addToCart(product); setProductSearch(''); refocusScanner(); }}
               >
                 <div>
                   <div className="flex items-center gap-3">
                      <p className="font-bold text-sm uppercase tracking-widest text-zinc-800 dark:text-zinc-100">{product.name}</p>
                      {product.barcode && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-mono tracking-widest">{product.barcode}</span>}
                   </div>
                   <p className={`text-xs tracking-widest mt-2 uppercase font-bold sm:mt-1 ${product.stock <= product.minStock ? 'text-red-500' : 'text-zinc-400'}`}>STOCK: {product.stock}</p>
                 </div>
                 <span className="text-lg font-light text-zinc-900 dark:text-zinc-100 tracking-tighter">{formatCurrency(product.price)}</span>
               </div>
             ))}
           </div>
        ) : productSearch && filteredProducts.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400">
             <AlertTriangle className="w-12 h-12 mb-4 stroke-[1]" />
             <p className="text-sm font-bold tracking-widest uppercase">Sin coincidencias</p>
           </div>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-300 dark:text-zinc-800">
             <ScanBarcode className="w-16 h-16 mb-6 stroke-[0.5]" />
             <p className="text-xs font-bold tracking-[0.2em] uppercase max-w-xs text-center leading-relaxed">Pase el producto por el láser o escriba su nombre para buscar manualmente</p>
           </div>
        )}
      </div>
    </div>
  );
}
