import { useRef, useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness } from '@/context/BusinessContext';
import QRCode from 'qrcode';

interface InvoiceTicketProps {
  invoice: {
    id: string;
    invoiceNumber?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    items: {
      name: string;
      quantity: number;
      price: number;
      total: number;
    }[];
    subtotal: number;
    discountAmount?: number;
    discountCode?: string;
    tax: number;
    total: number;
    issueDate: string;
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'split';
    paidDate?: string;
    status?: string;
    cufe?: string;
    taxRate?: number;
    dianStatus?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceTicket({ 
  invoice, 
  isOpen, 
  onClose
}: InvoiceTicketProps) {
  const { businessInfo } = useBusiness();
  const businessName = businessInfo?.legalName || 'SISTEMA POS-G';
  const ticketRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (invoice) {
      const qrData = invoice.cufe 
        ? `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentKey=${invoice.cufe}`
        : JSON.stringify({
            invoice: invoice.invoiceNumber || 'N/A',
            business: businessName,
            total: invoice.total,
            date: invoice.issueDate
          });
      
      QRCode.toDataURL(qrData, { width: 120, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Error generating QR:', err));
    }
  }, [invoice, businessName]);

  if (!invoice) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && ticketRef.current) {
      const ticketHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Factura ${invoice.invoiceNumber || ''}</title>
          <style>
            @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
            body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; max-width: 300px; margin: 0 auto; padding: 10px; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>${ticketRef.current.innerHTML}</body>
        </html>
      `;
      printWindow.document.write(ticketHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle className="text-xl font-bold">Ticket de Venta</DialogTitle></DialogHeader>
        <div ref={ticketRef} className="bg-white dark:bg-zinc-950 p-6 font-mono text-xs border border-gray-100 shadow-inner" style={{ maxWidth: '300px', margin: '0 auto' }}>
           <div className="text-center mb-6">
              <p className="font-black text-lg">{businessName.toUpperCase()}</p>
              {businessInfo?.nit && <p className="text-[10px]">NIT: {businessInfo.nit}-{businessInfo.verificationDigit}</p>}
              <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Representación Física</p>
           </div>
           <div className="space-y-1 mb-4">
              <div className="flex justify-between"><span>FACTURA NO:</span><span className="font-bold">{invoice.invoiceNumber || 'TICKET-TEMP'}</span></div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>{new Date(invoice.issueDate).toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between"><span>CLIENTE:</span><span className="font-bold">{invoice.customerName}</span></div>
           </div>
           <div className="border-t border-dashed border-gray-200 my-4" />
           <div className="space-y-2 mb-4">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                   <div className="flex-1 pr-2"><p className="font-bold">{item.name}</p><p className="text-[10px] text-gray-400">${item.price.toLocaleString()} x {item.quantity}</p></div>
                   <span className="font-bold">${item.total.toLocaleString()}</span>
                </div>
              ))}
           </div>
           <div className="border-t-2 border-black my-4" />
           <div className="space-y-1">
              <div className="flex justify-between text-base font-black"><span>TOTAL A PAGAR:</span><span>${invoice.total.toLocaleString()}</span></div>
              <div className="flex justify-between text-[10px] text-gray-400"><span>BASE IMPONIBLE:</span><span>${(invoice.subtotal).toLocaleString()}</span></div>
              {invoice.discountAmount ? (
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>DESC. 🎫 ({invoice.discountCode}):</span><span>-${invoice.discountAmount.toLocaleString()}</span></div>
              ) : null}
              {invoice.tax ? (
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>IMPUESTOS (IVA):</span><span>${invoice.tax.toLocaleString()}</span></div>
              ) : null}
           </div>
           <div className="mt-8 text-center">{qrDataUrl && <img src={qrDataUrl} className="w-24 h-24 mx-auto mb-2 opacity-80" />}<p className="text-[8px] text-gray-400 uppercase tracking-widest leading-tight">Valide su factura electrónica en el portal de la DIAN</p></div>
        </div>
        <div className="flex gap-3 mt-6"><Button onClick={handlePrint} className="flex-1 bg-black text-white h-12 rounded-2xl font-bold"><Printer className="w-5 h-5 mr-2" />IMPRIMIR</Button></div>
      </DialogContent>
    </Dialog>
  );
}

