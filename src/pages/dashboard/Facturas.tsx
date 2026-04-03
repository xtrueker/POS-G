import { useState, useMemo } from 'react';
import { 
  Plus, Search, Trash2, FileText, CheckCircle, Clock, 
  Banknote, Printer, Receipt, 
  TrendingUp, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInventory } from '@/context/InventoryContext';
import { useCustomer } from '@/context/CustomerContext';

import { useInvoices } from '@/context/InvoiceContext';
import { useBusiness } from '@/context/BusinessContext';
import { useStaff } from '@/context/StaffContext';
import InvoiceTicket from '@/components/InvoiceTicket';
import { toast } from 'sonner';
import { type Product, type Customer, type Invoice } from '@/types';

interface InvoiceItem {
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  cost: number;
  total: number;
  stock: number;
}

export default function Facturas() {
  const { businessInfo } = useBusiness();
  const { hasPermission, verifyOwnerPin } = useStaff();
  const { invoices, addInvoice, deleteInvoice, markAsPaid } = useInvoices();
  const { products } = useInventory();
  const { customers } = useCustomer();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // New invoice form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const canDeleteInvoice = hasPermission('invoices.delete');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.stock > 0
    );
  }, [products, productSearch]);

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = businessInfo?.regimen === 'comun' ? 0.19 : 0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total, taxRate: taxRate * 100 };
  };

  const addItemToInvoice = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`No hay stock disponible de ${product.name}`);
      return;
    }

    const existingItem = invoiceItems.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(`Solo hay ${product.stock} unidades disponibles de ${product.name}`);
        return;
      }
      setInvoiceItems(invoiceItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setInvoiceItems([...invoiceItems, {
        productId: product.id,
        name: product.name,
        description: product.description,
        quantity: 1,
        price: product.price,
        cost: product.cost,
        total: product.price,
        stock: product.stock,
      }]);
    }
    toast.success(`${product.name} agregado a la factura`);
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    const item = invoiceItems.find(i => i.productId === productId);
    if (!item) return;

    if (quantity > item.stock) {
      toast.error(`Solo hay ${item.stock} unidades disponibles`);
      return;
    }

    if (quantity <= 0) {
      setInvoiceItems(invoiceItems.filter(item => item.productId !== productId));
      return;
    }
    setInvoiceItems(invoiceItems.map(item =>
      item.productId === productId
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.productId !== productId));
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomer) {
      toast.error('Seleccione un cliente');
      return;
    }
    if (invoiceItems.length === 0) {
      toast.error('Agregue al menos un producto');
      return;
    }
    if (!dueDate) {
      toast.error('Seleccione una fecha de vencimiento');
      return;
    }

    const { subtotal, tax, total, taxRate } = calculateTotals();

    const result = await addInvoice({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address,
      items: invoiceItems.map(({ stock, ...item }) => item),
      subtotal,
      discountAmount: 0,
      tax,
      total,
      status: 'draft',
      issueDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes,
      taxRate,
    });

    if (result.success) {
      toast.success('Factura creada exitosamente');
      resetForm();
      setIsNewInvoiceOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, method: 'cash' | 'card' | 'transfer') => {
    const result = await markAsPaid(invoiceId, method);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };



  const handleDeleteInvoice = async (invoiceId: string) => {
    const pin = prompt('Ingrese su PIN para eliminar esta factura:');
    if (pin) {
      const isValid = await verifyOwnerPin(pin);
      if (isValid) {
        const result = await deleteInvoice(invoiceId);
        if (result.success) {
          toast.success('Factura eliminada');
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('PIN incorrecto');
      }
    }
  };

  const openTicket = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsTicketOpen(true);
  };

  const openDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setInvoiceItems([]);
    setProductSearch('');
    setDueDate('');
    setNotes('');
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-CO')}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const { subtotal, tax, total } = calculateTotals();

  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const draftAmount = invoices.filter(i => i.status === 'draft').reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
    const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    return { totalInvoices, draftAmount, pendingAmount, paidAmount, paidCount };
  }, [invoices]);

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400',
      sent: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400',
      paid: 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white',
      overdue: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400',
      cancelled: 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-900 text-zinc-300 dark:text-zinc-700',
    };
    const labels = {
      draft: 'BORRADOR',
      sent: 'ENVIADA',
      paid: 'PAGADA',
      overdue: 'VENCIDA',
      cancelled: 'CANCELADA',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };



  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-light text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">Registro de Facturación</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mt-1">SISTEMA INTEGRAL DE DOCUMENTACIÓN</p>
        </div>
        <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800 dark:hover:bg-white rounded-none shadow-lg h-11 px-8 text-xs font-bold uppercase tracking-widest transition-all border-none">
              <Plus className="w-4 h-4 mr-2 stroke-[2]" />
              Nueva factura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl bg-white dark:bg-zinc-950 p-0 gap-0 flex flex-col focus-visible:outline-none">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
              <DialogTitle className="text-lg font-light tracking-widest uppercase text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                <Receipt className="w-5 h-5 text-zinc-500 stroke-[1.5]" />
                Emisión de Factura
              </DialogTitle>
              <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mt-2">DILIGENCIE LOS DATOS DEL COMPROBANTE</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-0 flex-1 overflow-hidden">
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar border-r border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30">
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3 block">Asignar Cliente</label>
                  <select 
                    className="w-full h-12 px-4 border border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest focus:outline-none focus:border-zinc-900 transition-colors" 
                    value={selectedCustomer?.id || ''} 
                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                  >
                    <option value="">SELECCIONAR CLIENTE</option>
                    {customers.map(customer => (<option key={customer.id} value={customer.id}>{customer.name.toUpperCase()}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3 block">Fecha de Vencimiento</label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-12 border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs tracking-widest uppercase" />
                </div>
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3 block">Búsqueda de Catálogo</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.5]" />
                    <Input placeholder="BUSCAR PRODUCTO..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-12 h-12 border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest" />
                  </div>
                  {productSearch && (
                    <div className="mt-2 border border-zinc-100 dark:border-zinc-900 overflow-hidden max-h-64 overflow-auto bg-white dark:bg-zinc-950 shadow-xl ring-1 ring-black/5 z-20">
                      {filteredProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 cursor-pointer border-b border-zinc-50 last:border-b-0 transition-colors" onClick={() => { addItemToInvoice(product); setProductSearch(''); }}>
                          <div>
                            <span className="text-xs font-medium uppercase tracking-widest text-zinc-800">{product.name}</span>
                            <p className="text-xs text-zinc-500 tracking-wider mt-1.5 uppercase">STOCK DISPONIBLE: {product.stock}</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(product.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3 block">Observaciones</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="NOTAS ADICIONALES PARA LA FACTURA..." 
                    className="w-full p-4 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 rounded-none text-xs uppercase tracking-widest min-h-[100px] outline-none transition-colors overflow-hidden" 
                  />
                </div>
              </div>

              <div className="flex flex-col h-full bg-white dark:bg-zinc-950 relative overflow-hidden">
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-6 border-b border-zinc-50 pb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Ítems Detallados</h3>
                    <span className="text-xs tracking-widest text-zinc-500 uppercase font-medium">{invoiceItems.length} CONCEPTOS</span>
                  </div>
                  
                  {invoiceItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                      <Receipt className="w-10 h-10 mb-4 stroke-[1]" />
                      <p className="text-xs font-semibold tracking-[0.1em] uppercase">Factura en Blanco</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {invoiceItems.map(item => (
                        <div key={item.productId} className="flex items-center justify-between bg-transparent border-b border-zinc-50 pb-6 group">
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 truncate">{item.name}</p>
                            <p className="text-sm font-mono font-medium text-zinc-500 mt-2">{formatCurrency(item.price)} C/U</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 border border-zinc-100 dark:border-zinc-900 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/50">
                              <button onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors text-lg">-</button>
                              <span className="w-4 text-center text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">{item.quantity}</span>
                              <button onClick={() => updateItemQuantity(item.productId, item.quantity + 1)} className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors text-lg">+</button>
                            </div>
                            <button onClick={() => removeItem(item.productId)} className="text-zinc-300 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4 stroke-[1.5]" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-8 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/30 shrink-0">
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
                      <span>Subtotal</span>
                      <span className="font-mono text-xs">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold uppercase tracking-widest text-zinc-500">
                      <span>IVA ({calculateTotals().taxRate}%)</span>
                      <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Total a Facturar</span>
                      <span className="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <Button variant="outline" onClick={() => setIsNewInvoiceOpen(false)} className="h-12 border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-none hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 font-semibold uppercase tracking-wider text-sm shadow-none">
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateInvoice} disabled={!selectedCustomer || invoiceItems.length === 0} className="h-12 bg-zinc-900 text-white hover:bg-zinc-800 rounded-none shadow-none text-sm font-semibold uppercase tracking-wider disabled:opacity-50">
                      Emitir Factura
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'TOTAL DOCS.', value: stats.totalInvoices, icon: FileText },
          { label: 'BORRADORES', value: formatCurrency(stats.draftAmount), icon: Clock },
          { label: 'POR COBRAR', value: formatCurrency(stats.pendingAmount), icon: TrendingUp },
          { label: 'RECAUDADO', value: formatCurrency(stats.paidAmount), icon: CheckCircle }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-950 p-8 border border-zinc-200/50 dark:border-white/5 flex items-center gap-6 glass-light dark:glass-dark border-glow-light dark:border-glow group hover:border-zinc-900 dark:hover:border-white transition-all">
            <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-500 flex items-center justify-center shadow-sm">
              <stat.icon className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[1.5]" />
          <Input placeholder="BUSCAR POR NRO, CLIENTE O EMAIL..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-11 border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-zinc-900 bg-white dark:bg-zinc-950 text-xs uppercase tracking-widest placeholder:text-zinc-500 shadow-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-6 border border-zinc-200 dark:border-zinc-800 rounded-none h-11 bg-white dark:bg-zinc-950 text-xs font-bold uppercase tracking-widest outline-none focus:border-zinc-900 transition-colors">
          <option value="all">TODOS LOS ESTADOS</option>
          <option value="draft">BORRADORES</option>
          <option value="paid">PAGADAS</option>
          <option value="overdue">VENCIDAS</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-white/5 overflow-hidden glass-light dark:glass-dark border-glow-light dark:border-glow">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">NRO. FACTURA</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">CLIENTE</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">ESTADO</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">TOTAL</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredInvoices.map(invoice => (
              <tr key={invoice.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                <td className="px-6 py-4 text-xs font-mono font-bold tracking-[0.2em] text-zinc-900 dark:text-zinc-100 uppercase">#{invoice.invoiceNumber}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-white/5 flex items-center justify-center font-bold text-zinc-900 dark:text-zinc-100 text-[10px]">{invoice.customerName.charAt(0)}</div>
                    <span className="font-bold text-[10px] tracking-widest uppercase text-zinc-900 dark:text-zinc-100">{invoice.customerName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">{getStatusBadge(invoice.status)}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">{formatCurrency(invoice.total)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openTicket(invoice)} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 transition-colors" title="Imprimir Ticket"><Printer className="w-4 h-4 stroke-[1.5]" /></button>
                    <button onClick={() => openDetail(invoice)} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 transition-colors" title="Ver Detalle"><Eye className="w-4 h-4 stroke-[1.5]" /></button>
                    {invoice.status !== 'paid' && (
                      <button onClick={() => handleMarkAsPaid(invoice.id, 'cash')} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 transition-colors" title="Marcar como Pagada"><Banknote className="w-4 h-4 stroke-[1.5]" /></button>
                    )}
                    {canDeleteInvoice && (<button onClick={() => handleDeleteInvoice(invoice.id)} className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4 stroke-[1.5]" /></button>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceTicket invoice={selectedInvoice} isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} />
      {showDetailModal && selectedInvoice && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-xl border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl bg-white dark:bg-zinc-950 p-0 gap-0 focus-visible:outline-none overflow-hidden">
             <div className="p-8 border-b border-zinc-100 dark:border-zinc-900">
               <DialogTitle className="flex items-center gap-3 text-lg font-light tracking-widest uppercase text-zinc-900 dark:text-zinc-100">
                 <Receipt className="w-5 h-5 text-zinc-500 stroke-[1.5]" />
                 Comprobante #{selectedInvoice.invoiceNumber}
               </DialogTitle>
               <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mt-2">DETALLE DOCUMENTO MERCANTIL</p>
             </div>
             <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-0 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
                  <div className="p-6 border-r border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Cliente Asignado</p>
                    <p className="font-medium text-xs tracking-wider uppercase text-zinc-900 dark:text-zinc-100">{selectedInvoice.customerName}</p>
                    <p className="text-sm text-zinc-500 mt-1 uppercase truncate">{selectedInvoice.customerEmail}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Fecha Vencimiento</p>
                    <p className="font-mono text-xs tracking-wider text-zinc-900 dark:text-zinc-100">{formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Desglose de Conceptos</h4>
                  <div className="border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                    <table className="w-full">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="p-4 text-left text-xs tracking-widest text-zinc-500">DESCRIPCIÓN</th>
                          <th className="p-4 text-center text-xs tracking-widest text-zinc-500">CANT</th>
                          <th className="p-4 text-right text-xs tracking-widest text-zinc-500">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-4 text-xs tracking-wide uppercase text-zinc-900 dark:text-zinc-100">{item.name}</td>
                            <td className="p-4 text-center font-mono text-xs text-zinc-600">{item.quantity}</td>
                            <td className="p-4 text-right font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <div className="w-full max-w-[280px] space-y-3 bg-zinc-50 dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center text-sm font-semibold text-zinc-500 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    {selectedInvoice.discountAmount ? (
                      <div className="flex justify-between items-center text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                        <span>Descuento</span>
                        <span className="font-mono">-{formatCurrency(selectedInvoice.discountAmount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between items-center text-sm font-semibold text-zinc-500 uppercase tracking-widest">
                      <span>Impuestos</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Total Final</span>
                      <span className="text-xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="p-6 border-l-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Observaciones Internas</p>
                    <p className="text-xs uppercase tracking-widest text-zinc-600 leading-relaxed italic">{selectedInvoice.notes}</p>
                  </div>
                )}
             </div>
             <div className="p-8 border-t border-zinc-100 dark:border-zinc-900 shrink-0 flex justify-end">
               <Button onClick={() => setShowDetailModal(false)} className="h-10 px-8 bg-zinc-900 text-white rounded-none shadow-none text-sm font-semibold uppercase tracking-wider">Cerrar Detalle</Button>
             </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


