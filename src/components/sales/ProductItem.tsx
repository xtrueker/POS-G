import { memo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { type Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

const ProductItem = memo(({ product, onAdd }: { product: Product, onAdd: (p: Product) => void }) => (
  <button
    onClick={() => onAdd(product)}
    className="relative flex flex-col items-center justify-center bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none transition-colors duration-300 text-center aspect-square overflow-hidden group p-0"
  >
    {product.imageUrl ? (
       <img 
          src={product.imageUrl} 
          alt={product.name} 
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-contain p-4 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-500" 
       />
    ) : (
       <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-300">
         <ShoppingBag className="w-12 h-12 text-black dark:text-white"/>
       </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-black/80 to-transparent group-hover:from-black/40 transition-colors duration-300"></div>
    <div className="relative z-10 w-full flex flex-col items-center justify-end h-full p-3 mt-auto">
      <span className="font-bold leading-tight text-[10px] uppercase tracking-widest line-clamp-2 text-zinc-900 dark:text-white drop-shadow-sm">{product.name}</span>
      <span className="mt-0.5 text-[9px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400">{formatCurrency(product.price)}</span>
    </div>
  </button>
));

ProductItem.displayName = 'ProductItem';

export default ProductItem;
