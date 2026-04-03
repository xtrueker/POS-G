import { useState, useCallback } from 'react';
import { Camera, X, Search, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/InventoryContext';
import { useSales } from '@/context/SalesContext';
import { useLocation } from '@/context/LocationContext';
import { toast } from 'sonner';
import TrackingScanner from '@/components/scanner/TrackingScanner';
import { useInvoices } from '@/context/InvoiceContext';
import InvoiceTicket from '@/components/InvoiceTicket';

interface ScannedProduct {
  productId: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
}

export default function BarcodeScanner() {
  const { getProductByBarcode } = useInventory();
  const { addSale } = useSales();
  const { currentLocation } = useLocation();

  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedProduct[]>([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showCart, setShowCart] = useState(false);
  
  // Invoice state
  const { addInvoice } = useInvoices();
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  // Sound feedback for successful scan
  const playBeep = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      
      osc.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio disabled or not supported", e);
    }
  }, []);

  const handleBarcodeScan = useCallback((barcode: string) => {
    playBeep(); // Play beep on successful scan from TrackingScanner
    const product = getProductByBarcode(barcode);
    if (product) {
      setScannedItems(prev => {
        const existing = prev.find(item => item.productId === product.id);
        if (existing) {
          return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { productId: product.id, name: product.name, price: product.price, cost: product.cost || 0, quantity: 1 }];
      });
      toast.success(`${product.name} agregado`);
    } else {
      toast.error('Producto no encontrado');
    }
  }, [getProductByBarcode]);

  const completeSale = async () => {
    if (scannedItems.length === 0) return;
    
    // Create the Sale
    const result = await addSale({
      products: scannedItems.map(item => ({ productId: item.productId, name: item.name, quantity: item.quantity, price: item.price, cost: item.cost })),
      subtotal: total,
      discountAmount: 0,
      total,
      paymentMethod: 'cash',
      locationId: currentLocation?.id,
    });
    
    if (result.success && result.sale) {
      // Create the Invoice
      const invoiceItems = scannedItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        total: item.price * item.quantity,
      }));

      addInvoice({
        customerId: undefined,
        customerName: 'Cliente general',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        items: invoiceItems,
        subtotal: total,
        discountAmount: 0,
        tax: 0,
        total: total,
        status: 'paid',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        paymentMethod: 'cash',
        paidDate: new Date().toISOString(),
        saleId: result.sale.id,
        id: result.sale.id,
      });

      setLastInvoice({
        id: result.sale.id,
        customerName: 'Cliente general',
        customerEmail: '',
        customerPhone: '',
        items: invoiceItems,
        subtotal: total,
        discountAmount: 0,
        tax: 0,
        total: total,
        issueDate: new Date().toISOString(),
        paymentMethod: 'cash',
        status: 'paid',
      });
      
      setIsTicketOpen(true);
      toast.success('Venta y Facturación completadas');
      setScannedItems([]);
      setShowCart(false);
    } else {
      toast.error(result.message);
    }
  };

  const total = scannedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Poppins']">Escáner POS</h1>
        <button onClick={() => setShowCart(!showCart)} className="relative p-3 bg-black text-white rounded-xl shadow-lg">
           <ShoppingCart className="w-5 h-5" />
           {scannedItems.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2563eb] text-black text-sm font-black rounded-full flex items-center justify-center">{scannedItems.length}</span>}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
         <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-gray-50 overflow-hidden shadow-sm">
               <div className="p-6">
                  <div className={`relative rounded-2xl overflow-hidden min-h-[400px] border-2 border-green-500 shadow-[0_0_20px_#22c55e/30] ${isScanning ? 'block' : 'hidden'}`}>
                     <TrackingScanner onScan={handleBarcodeScan} isActive={isScanning} continuous={true} />
                     <button onClick={() => setIsScanning(false)} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full z-20 shadow-lg hover:bg-red-600"><X className="w-5 h-5" /></button>
                  </div>
                  {!isScanning && (
                    <div className="aspect-video bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-100 min-h-[300px]">
                       <Camera className="w-12 h-12 text-gray-200 mb-4" />
                       <Button onClick={() => setIsScanning(true)} className="bg-black text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-black/10">Activar Cámara</Button>
                    </div>
                  )}
               </div>
            </div>
            <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-gray-50 shadow-sm">
               <div className="flex gap-2">
                  <div className="flex-1 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleBarcodeScan(manualBarcode)} placeholder="Ingresar código manualmente..." className="w-full h-12 pl-12 pr-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2563eb]" /></div>
                  <Button onClick={() => handleBarcodeScan(manualBarcode)} className="h-12 px-6 bg-[#2563eb] text-black font-bold rounded-xl shadow-lg shadow-[#2563eb]/20">Buscar</Button>
               </div>
            </div>
         </div>

         <div className={`bg-white dark:bg-zinc-950 rounded-3xl border border-gray-50 shadow-sm p-6 ${showCart ? 'block' : 'hidden lg:block'}`}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-[#2563eb]" />Carrito de Venta</h3>
            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
               {scannedItems.map(item => (
                 <div key={item.productId} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div><p className="text-xs font-bold">{item.name}</p><p className="text-sm text-gray-400 font-medium">${item.price.toLocaleString()} x {item.quantity}</p></div>
                    <div className="flex items-center gap-3">
                       <button onClick={() => setScannedItems(prev => prev.map(i => i.productId === item.productId ? {...i, quantity: Math.max(0, i.quantity -1)} : i).filter(i => i.quantity > 0))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 shadow-sm flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                       <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                       <button onClick={() => setScannedItems(prev => prev.map(i => i.productId === item.productId ? {...i, quantity: i.quantity + 1} : i))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-950 shadow-sm flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                 </div>
               ))}
               {scannedItems.length === 0 && <div className="text-center py-12"><div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingCart className="w-8 h-8 text-gray-200" /></div><p className="text-gray-400 text-sm font-medium">Carrito Vacío</p></div>}
            </div>
            {scannedItems.length > 0 && (
              <div className="pt-6 border-t border-gray-50 space-y-4">
                 <div className="flex justify-between items-center"><span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total a Pagar</span><span className="text-2xl font-black text-black">${total.toLocaleString()}</span></div>
                 <Button onClick={completeSale} className="w-full h-14 bg-black text-[#2563eb] text-lg font-black rounded-2xl shadow-xl shadow-black/20 flex items-center justify-center gap-3 transition-transform active:scale-95"><Check className="w-6 h-6" />FINALIZAR VENTA</Button>
              </div>
            )}
         </div>
      </div>

      {isTicketOpen && lastInvoice && (
        <InvoiceTicket
          isOpen={isTicketOpen}
          invoice={lastInvoice}
          onClose={() => setIsTicketOpen(false)}
        />
      )}
    </div>
  );
}


