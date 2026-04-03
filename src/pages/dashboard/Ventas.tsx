import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, ShoppingCart,
  CreditCard, Banknote, Smartphone, CheckCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInventory } from '@/context/InventoryContext';
import { useCustomer } from '@/context/CustomerContext';
import { useSales } from '@/context/SalesContext';
import { useInvoices } from '@/context/InvoiceContext';
import { useLocation } from '@/context/LocationContext';
import { useBusiness } from '@/context/BusinessContext';
import { usePromotion } from '@/context/PromotionContext';
import { useStaff } from '@/context/StaffContext';
import { useCash } from '@/context/CashContext';
import { useSecurity } from '@/context/SecurityContext';
import { OpenRegisterModal } from '@/components/cash/OpenRegisterModal';
import { CloseRegisterModal } from '@/components/cash/CloseRegisterModal';
import { useAppointments } from '@/context/AppointmentContext';
import InvoiceTicket from '@/components/InvoiceTicket';
import PinModal from '@/components/sales/PinModal';
import ProductItem from '@/components/sales/ProductItem';
import ScannerPanel from '@/components/sales/ScannerPanel';
import PaymentModal from '@/components/sales/PaymentModal';
import SalesTable from '@/components/sales/SalesTable';
import { useWhatsAppEngine } from '@/hooks/useWhatsAppEngine';
import { toast } from 'sonner';
import { type Product, type Customer, type SalePaymentLine } from '@/types';
import { formatCurrency } from '@/lib/utils';

// ==========================================
// TYPES
// ==========================================
interface CartItem extends Product {
  quantity: number;
  staffId?: string;
  staffName?: string;
}

// ==========================================
// VENTAS - MAIN COMPONENT (ORCHESTRATOR)
// ==========================================
export default function Ventas() {
  // --- Context Hooks ---
  const { businessInfo } = useBusiness();
  const isBakery = businessInfo?.vertical === 'bakery';
  const { currentLocation } = useLocation();
  const { validatePromoCode, incrementPromoUsage } = usePromotion();
  const { staff, hasPermission, verifyOwnerPin } = useStaff();
  const { logAudit } = useSecurity();
  const { products } = useInventory();
  const { customers, reverseCustomerSale, addLoyaltyPoints } = useCustomer();
  const { sales, addSale, reverseSale } = useSales();
  const { invoices, addInvoice, updateInvoice } = useInvoices();
  const { isOpen } = useCash();
  const { updateAppointment } = useAppointments();

  // --- UI State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // --- Cash Register ---
  const [isOpenRegisterOpen, setIsOpenRegisterOpen] = useState(false);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false);

  // --- Payment ---
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'split'>('cash');
  const [paymentLines, setPaymentLines] = useState<SalePaymentLine[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [generateInvoice, setGenerateInvoice] = useState(true);

  // --- Discount ---
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; type: 'percentage' | 'fixed'; value: number } | null>(null);

  // --- PIN ---
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPromoPinModal, setShowPromoPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<'reverse' | 'delete'>('reverse');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  // --- Search Debounce ---
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(productSearch), 150);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const { sendSaleConfirmation, sendLoyaltyUpdate } = useWhatsAppEngine();

  // --- Appointment Integration ---
  useEffect(() => {
    // 1. Detect on mount or when customers load
    const pendingStr = localStorage.getItem('pending_checkout');
    if (pendingStr && !isNewSaleOpen && customers.length > 0) {
      setIsNewSaleOpen(true);
      return; 
    }

    // 2. Populate cart when modal is open
    if (!isNewSaleOpen || customers.length === 0 || !pendingStr) return;
    
    try {
      const pending = JSON.parse(pendingStr);
      const customer = customers.find(c => c.id === pending.customerId);
      if (customer) setSelectedCustomer(customer);
      if (pending.appointmentId) setActiveAppointmentId(pending.appointmentId);
      
      const newItems = pending.items.map((item: any) => {
        const inventoryProduct = products.find(p => p.id === item.productId);
        return {
          id: item.productId,
          name: inventoryProduct?.name || item.name,
          price: inventoryProduct?.price || item.price,
          cost: inventoryProduct?.cost || 0,
          quantity: item.quantity,
          staffId: item.staffId,
          staffName: item.staffName,
          category: inventoryProduct?.category || 'Servicios',
          stock: inventoryProduct?.isService ? 9999 : (inventoryProduct?.stock || 0),
          unit: inventoryProduct?.unit || 'servicio',
          isService: inventoryProduct?.isService ?? true
        };
      });
      
      setCart(newItems);
      localStorage.removeItem('pending_checkout');
      toast.success('Cita cargada con éxito');
    } catch (e) {
      console.error(e);
    }
  }, [isNewSaleOpen, customers]);

  // --- Permissions ---
  const canCreateSale = hasPermission('sales' as any) || hasPermission('sales.create');
  const canReverseSale = hasPermission('sales' as any) || hasPermission('sales.reverse');

  // --- Derived Data ---
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLocation = currentLocation ? sale.locationId === currentLocation.id : true;
      return matchesSearch && matchesLocation;
    });
  }, [sales, searchTerm, currentLocation]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      (p.isService || p.stock > 0) &&
      p.usageType !== 'professional' &&
      (currentLocation ? p.locationId === currentLocation.id || !p.locationId : true)
    );
  }, [products, debouncedSearch, currentLocation]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedDiscount?.amount || 0;
  const cartTotal = cartSubtotal - discountAmount;

  // ==========================================
  // CART OPERATIONS
  // ==========================================
  const addToCart = (product: Product) => {
    if (product.isCombo && product.comboItems) {
      toast.info(`Agregando combo: ${product.name}`);
      const missingStock = product.comboItems.some(item => {
        const p = products.find(prod => prod.id === item.productId);
        return !p || p.stock < item.quantity;
      });
      if (missingStock) {
        toast.error('Insumos insuficientes para preparar este combo.');
        return;
      }
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (product.isService || existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        toast.error(`Stock insuficiente. Solo hay ${product.stock} unidades.`);
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    if (cart.length === 1) {
      setAppliedDiscount(null);
      setPromoCode('');
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    const product = products.find(p => p.id === productId);
    if (product && (product.isService || quantity <= product.stock)) {
      setCart(cart.map(item => item.id === productId ? { ...item, quantity } : item));
    } else {
      toast.error(`Stock insuficiente ${product?.name}. Solo hay ${product?.stock} unidades.`);
    }
  };

  // ==========================================
  // PROMO OPERATIONS
  // ==========================================
  const applyPromoCode = () => {
    if (!promoCode.trim()) { toast.error('Ingrese un código de descuento'); return; }
    const cartItems = cart.map(item => ({ productId: item.id, category: item.category }));
    const result = validatePromoCode(promoCode, cartSubtotal, cartItems);
    if (result.valid && result.promotion) {
      if (result.requiresPin) { setShowPromoPinModal(true); return; }
      applyDiscountRecord(result);
    } else {
      toast.error(result.message);
      setAppliedDiscount(null);
    }
  };

  const applyDiscountRecord = (result: any) => {
    setAppliedDiscount({
      code: promoCode.toUpperCase(),
      amount: result.discountAmount,
      type: result.promotion.type,
      value: result.promotion.value,
    });
    toast.success(result.message);
  };

  const handlePromoPinConfirm = async (pin: string) => {
    const isValid = await verifyOwnerPin(pin);
    if (!isValid) { toast.error('PIN incorrecto. Las promociones especiales requieren PIN del dueño.'); return; }
    const cartItems = cart.map(item => ({ productId: item.id, category: item.category }));
    const result = validatePromoCode(promoCode, cartSubtotal, cartItems);
    if (result.valid) { applyDiscountRecord(result); setShowPromoPinModal(false); }
  };

  // ==========================================
  // SALE COMPLETION
  // ==========================================
  const handleCompleteSale = async () => {
    if (!canCreateSale) { toast.error('No tiene permiso para crear ventas'); return; }
    if (!currentLocation) { toast.error('Debe seleccionar una Sede específica (arriba a la izquierda) para facturar'); return; }

    const finalPaymentLines = paymentMethod === 'split' ? paymentLines : [{ method: paymentMethod as any, amount: cartTotal }];

    const result = await addSale({
      products: cart.map(item => ({
        productId: item.id, 
        name: item.name, 
        quantity: item.quantity, 
        price: item.price, 
        cost: item.cost,
        staffId: item.staffId,
        staffName: item.staffName
      })),
      subtotal: cartSubtotal,
      discountAmount, discountCode: appliedDiscount?.code, discountType: appliedDiscount?.type, discountValue: appliedDiscount?.value,
      total: cartTotal,
      customerId: selectedCustomer?.id, customerName: selectedCustomer?.name || 'Cliente general',
      paymentMethod, paymentLines: finalPaymentLines,
      locationId: currentLocation?.id,
    });

    if (result.success && result.sale) {
      if (generateInvoice) {
        const targetCustomerName = selectedCustomer?.name || 'Cliente general';
        const invoiceItems = cart.map(item => ({
          productId: item.id, name: item.name, description: item.description,
          quantity: item.quantity, price: item.price, cost: item.cost || 0, total: item.price * item.quantity,
        }));

        addInvoice({
          customerId: selectedCustomer?.id || undefined,
          customerName: targetCustomerName, customerEmail: selectedCustomer?.email || '',
          customerPhone: selectedCustomer?.phone || '', customerAddress: selectedCustomer?.address || '',
          items: invoiceItems, subtotal: cartSubtotal, discountAmount, discountCode: appliedDiscount?.code,
          tax: 0, total: cartTotal, status: 'paid',
          issueDate: new Date().toISOString(), dueDate: new Date().toISOString(),
          paymentMethod, paidDate: new Date().toISOString(),
          saleId: result.sale.id, id: result.sale.id,
        });

        setLastInvoice({
          id: result.sale.id, customerName: targetCustomerName,
          customerEmail: selectedCustomer?.email || '', customerPhone: selectedCustomer?.phone || '',
          items: invoiceItems, subtotal: cartSubtotal, discountAmount, discountCode: appliedDiscount?.code,
          tax: 0, total: cartTotal, issueDate: new Date().toISOString(), paymentMethod, status: 'paid',
        });
        setIsTicketOpen(true);
      }

      if (appliedDiscount?.code) await incrementPromoUsage(appliedDiscount.code);
      toast.success(result.message);
      
      // --- 🔗 Agenda Integration ---
      if (activeAppointmentId) {
        await updateAppointment(activeAppointmentId, { status: 'completed' });
        setActiveAppointmentId(null);
        toast.success('Cita marcada como completada en agenda');
      }

      // WhatsApp confirmation for high-value sales
      if (selectedCustomer?.id) {
        sendSaleConfirmation(result.sale, selectedCustomer);
        
        // --- 💎 Loyalty Points (Elite Beauty - Refactored) ---
        const loyaltyConfig = businessInfo?.settings?.loyalty;
        if (loyaltyConfig?.enabled && selectedCustomer) {
          const ratio = loyaltyConfig.moneyToPointsRatio || 1000;
          const pointsEarned = Math.floor(cartTotal / ratio);
          const pName = loyaltyConfig.pointsName || 'PUNTOS';

          if (pointsEarned > 0) {
            await addLoyaltyPoints(selectedCustomer.id, pointsEarned, `Compra #${result.sale.id.slice(0,8)}`);
            
            // Premium Feedback Toast
            toast.success(`¡NUEVA RECOMPENSA!`, {
              description: `${selectedCustomer.name.toUpperCase()} HA GANADO ${pointsEarned} ${pName}`,
              icon: '💎'
            });
            
            const updatedCustomer = customers.find(c => c.id === selectedCustomer.id);
            const totalPoints = (updatedCustomer?.loyaltyPoints || 0) + pointsEarned;
            sendLoyaltyUpdate(selectedCustomer, pointsEarned, totalPoints);
          }
        }
      }

      resetSaleState();
    } else {
      toast.error(result.message);
    }
  };

  const resetSaleState = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentMethod('cash');
    setPromoCode('');
    setAppliedDiscount(null);
    setIsNewSaleOpen(false);
  };

  // ==========================================
  // REVERSAL OPERATIONS
  // ==========================================
  const handleReverseSaleConfirm = (saleId: string) => {
    if (!canReverseSale) { toast.error('No tiene permiso para reversar ventas'); return; }
    setSelectedSaleId(saleId);
    setPinAction('reverse');
    setReversalReason('');
    setShowPinModal(true);
  };

  const handlePinConfirm = async (pin: string) => {
    if (!selectedSaleId) return;
    if (pinAction === 'delete') {
      toast.error('La eliminación física está deshabilitada. Use reversión.');
    } else if (pinAction === 'reverse') {
      const isValid = await verifyOwnerPin(pin);
      if (!isValid) { toast.error('PIN incorrecto'); return; }

      const result = await reverseSale(selectedSaleId, pin, reversalReason);
      if (result.success) {
        const sale = sales.find(s => s.id === selectedSaleId);
        if (sale?.customerId) await reverseCustomerSale(sale.customerId, sale.total);
        const invoice = invoices.find(i => i.saleId === selectedSaleId);
        if (invoice) await updateInvoice(invoice.id, { status: 'cancelled' });

        toast.success('Venta reversada atómicamente (CRM y Facturero actualizados)');
        logAudit({
          action: 'SALE_REVERSE', entityType: 'sale', entityId: selectedSaleId,
          description: `Venta #${selectedSaleId.slice(0, 8)} reversada. Motivo: ${reversalReason}`,
          requiresPin: true, pinVerified: true, severity: 'warning'
        });
        setShowPinModal(false);
      } else {
        toast.error(result.message);
      }
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Punto de Venta</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mt-1">SISTEMA DE FACTURACIÓN TPOS</p>
        </div>
        <div className="flex items-center gap-3">
          {isOpen ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none items-center gap-2 h-10">
                <div className="w-1.5 h-1.5 rounded-none bg-zinc-900 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">CAJA ACTIVA</span>
              </div>
              <Button onClick={() => setIsCloseRegisterOpen(true)} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 rounded-none text-xs font-semibold uppercase tracking-widest h-10 shadow-none px-6">
                Cerrar Turno
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsOpenRegisterOpen(true)} className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-none px-6 text-xs font-semibold uppercase tracking-widest h-10 shadow-none animate-pulse">
              <Lock className="w-3.5 h-3.5 mr-2" />
              Abrir Caja
            </Button>
          )}

          {canCreateSale && (
            <Button onClick={() => {
              if (!isOpen) { setIsOpenRegisterOpen(true); return; }
              setIsNewSaleOpen(true);
            }} className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800 dark:hover:bg-white h-10 px-6 rounded-none shadow-lg hover:shadow-xl transition-all text-sm font-bold uppercase tracking-widest border-none">
              <Plus className="w-4 h-4 mr-2 stroke-[2]" />
              Nueva Venta
            </Button>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* NEW SALE DIALOG                              */}
      {/* ============================================ */}
      {canCreateSale && (
        <Dialog open={isNewSaleOpen} onOpenChange={setIsNewSaleOpen}>
          <DialogContent className="!max-w-[95vw] lg:!max-w-[85vw] w-full h-[90vh] max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl bg-white dark:bg-zinc-950 p-0 gap-0 flex flex-col">
              <DialogHeader className="px-8 py-5 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shrink-0 border-b border-zinc-100 dark:border-zinc-900 z-10 flex flex-row items-center justify-between">
                <DialogTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
                  <ShoppingCart className="w-4 h-4 text-zinc-500" />
                  Nueva Venta <span className="text-sm tracking-wider px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 bg-zinc-50 dark:bg-zinc-900">{isBakery ? 'TÁCTIL' : 'ESCÁNER RETAIL'}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid lg:grid-cols-2 gap-0 flex-1 overflow-hidden">
                {/* LEFT PANEL: Product Selection */}
                <div className="bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col h-full border-r border-zinc-100/50 dark:border-white/5 overflow-hidden relative">
                  {isBakery ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto p-8 flex-1 custom-scrollbar">
                      {filteredProducts.slice(0, debouncedSearch ? 100 : 32).map(product => (
                        <ProductItem key={product.id} product={product} onAdd={addToCart} />
                      ))}
                      {!debouncedSearch && filteredProducts.length > 32 && (
                        <div className="col-span-full py-8 text-center border-t border-dashed border-zinc-200 dark:border-zinc-800">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Usa el buscador para ver más productos</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <ScannerPanel
                      products={products}
                      filteredProducts={filteredProducts}
                      productSearch={productSearch}
                      setProductSearch={setProductSearch}
                      addToCart={addToCart}
                      isOpen={isNewSaleOpen}
                    />
                  )}

                  {/* Customer + Invoice Toggle */}
                  <div className="mt-auto p-8 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                    <label className="text-sm font-medium uppercase tracking-wider mb-4 block text-zinc-500">Cliente Asociado</label>
                    <div className="flex items-center gap-4">
                      <select
                        className="flex-1 h-12 px-4 border border-zinc-200 dark:border-zinc-800 rounded-none bg-zinc-50 dark:bg-zinc-900 text-xs tracking-widest uppercase focus:outline-none focus:border-zinc-900 transition-colors"
                        value={selectedCustomer?.id || ''}
                        onChange={(e) => {
                          const customer = customers.find(c => c.id === e.target.value);
                          setSelectedCustomer(customer || null);
                        }}
                      >
                        <option value="">Consumidor Final</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>{customer.name}</option>
                        ))}
                      </select>
                      <label htmlFor="generateInvoice" className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${generateInvoice ? 'bg-zinc-900 border-zinc-900' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-400'}`}>
                          {generateInvoice && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <input type="checkbox" id="generateInvoice" checked={generateInvoice} onChange={(e) => setGenerateInvoice(e.target.checked)} className="sr-only" />
                        <span className="text-sm uppercase tracking-wider text-zinc-600">Requerir Factura</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* RIGHT PANEL: Cart / Ticket */}
                <div className="bg-white dark:bg-zinc-950 flex flex-col h-full min-h-0 overflow-hidden relative">
                  <div className="px-8 py-6 flex items-center justify-between shrink-0 border-b border-zinc-50">
                    <h3 className="font-normal text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Ticket</h3>
                    <span className="text-sm tracking-widest text-zinc-500">{cart.length} ÍTEMS</span>
                  </div>

                  <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <ShoppingCart className="w-8 h-8 mb-4 stroke-[1]" />
                        <p className="text-sm uppercase tracking-wider">Canasta Vacía</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-transparent border-b border-zinc-50 pb-4 relative group">
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-[13px] font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[11px] font-medium tracking-wide text-zinc-500">{formatCurrency(item.price)} C/U</p>
                                {item.staffName && (
                                  <span className="text-[9px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold uppercase tracking-wider rounded-none">
                                    {item.staffName.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {businessInfo?.vertical === 'beauty' && (
                                <select 
                                  className="text-[9px] font-bold uppercase tracking-tighter bg-transparent border-none focus:ring-0 text-zinc-400 hover:text-zinc-900"
                                  value={item.staffId || ''}
                                  onChange={(e) => {
                                    const s = staff.find(sm => sm.id === e.target.value);
                                    setCart(cart.map(i => i.id === item.id ? { ...i, staffId: s?.id, staffName: s?.name } : i));
                                  }}
                                >
                                  <option value="">Operador...</option>
                                  {staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                              )}
                              <div className="flex items-center gap-3">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors">-</button>
                                <span className="w-5 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors">+</button>
                              </div>
                              <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer: Promo + Payment + Total */}
                  <div className="shrink-0 px-6 pb-6 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-900">
                    {cart.length > 0 && (
                      <div className="py-2 border-b border-zinc-100 dark:border-zinc-900">
                        <label className="text-sm font-medium uppercase tracking-[0.15em] mb-1.5 block text-zinc-500">Promoción</label>
                        {!appliedDiscount ? (
                          <div className="flex gap-2">
                            <Input placeholder="CÓDIGO" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-none shadow-none text-sm font-medium tracking-wider h-8 px-3 focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 placeholder:text-zinc-300 text-zinc-900 dark:text-zinc-100" />
                            <Button onClick={applyPromoCode} className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-none shadow-none uppercase tracking-widest text-xs h-8 px-4 font-bold transition-colors">Aplicar</Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none">
                            <div>
                              <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{appliedDiscount.code}</p>
                              <p className="text-xs text-zinc-500 tracking-wider mt-0.5">Ahorro: -{formatCurrency(appliedDiscount.amount)}</p>
                            </div>
                            <button onClick={() => { setAppliedDiscount(null); setPromoCode(''); }} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="py-4 border-b border-zinc-100 dark:border-zinc-900">
                      <label className="text-xs font-semibold uppercase tracking-widest mb-3 block text-zinc-600">Método de Pago</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['cash', 'card', 'transfer'].map((method) => (
                          <label key={method} className={`flex flex-col items-center justify-center py-2.5 px-2 border cursor-pointer transition-colors ${paymentMethod === method ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 hover:border-zinc-300'}`}>
                            <input type="radio" name="payment_method" value={method} className="sr-only" onChange={(e) => setPaymentMethod(e.target.value as any)} />
                            {method === 'cash' && <Banknote className={`w-4 h-4 mb-1.5 ${paymentMethod === method ? 'stroke-[2]' : 'stroke-[1.5]'}`} />}
                            {method === 'card' && <CreditCard className={`w-4 h-4 mb-1.5 ${paymentMethod === method ? 'stroke-[2]' : 'stroke-[1.5]'}`} />}
                            {method === 'transfer' && <Smartphone className={`w-4 h-4 mb-1.5 ${paymentMethod === method ? 'stroke-[2]' : 'stroke-[1.5]'}`} />}
                            <span className="text-sm font-medium uppercase tracking-wider w-full text-center leading-tight mt-0.5">{method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Transfer.'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Total a Cobrar</span>
                        <span className="text-3xl font-normal tracking-tight text-zinc-900 dark:text-zinc-100">{formatCurrency(cartTotal)}</span>
                      </div>
                      <Button
                        onClick={() => {
                          if (cartTotal <= 0) { handleCompleteSale(); return; }
                          setIsPaymentModalOpen(true);
                        }}
                        disabled={cart.length === 0}
                        className="w-full h-14 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 border-glow-light dark:border-glow text-white text-sm font-bold uppercase tracking-[0.2em] rounded-none shadow-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                      >
                        Pagar {formatCurrency(cartTotal)}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

      {/* ============================================ */}
      {/* EXTRACTED COMPONENTS                          */}
      {/* ============================================ */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartTotal={cartTotal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paymentLines={paymentLines}
        setPaymentLines={setPaymentLines}
        onConfirm={handleCompleteSale}
      />

      <SalesTable
        sales={filteredSales}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        canReverseSale={canReverseSale}
        onReverseSale={handleReverseSaleConfirm}
      />

      {/* Pin Modals */}
      <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onConfirm={handlePinConfirm} title="Reversar Venta" description="Esta acción requiere el PIN del dueño por seguridad." showReason={true} onReasonChange={setReversalReason} />
      <PinModal isOpen={showPromoPinModal} onClose={() => setShowPromoPinModal(false)} onConfirm={handlePromoPinConfirm} title="Promoción Especial" description="Esta promoción requiere PIN del dueño para aplicarse." />
      <InvoiceTicket invoice={lastInvoice} isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} />

      {/* Cash Register Modals */}
      <OpenRegisterModal isOpen={isOpenRegisterOpen} onClose={() => setIsOpenRegisterOpen(false)} />
      <CloseRegisterModal isOpen={isCloseRegisterOpen} onClose={() => setIsCloseRegisterOpen(false)} />
    </div>
  );
}
