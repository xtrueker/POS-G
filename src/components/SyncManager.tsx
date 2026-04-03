import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useInventory } from '@/context/InventoryContext';
import { useCustomer } from '@/context/CustomerContext';
import { useSales } from '@/context/SalesContext';
import { useBusiness } from '@/context/BusinessContext';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudUpload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SyncManager() {
  const { products: localProducts, customers: localCustomers, sales: localSales, businessInfo: localBusiness } = useApp();
  const { addProduct } = useInventory();
  const { addCustomer } = useCustomer();
  const { addSale } = useSales();
  const { updateBusinessInfo } = useBusiness();
  
  const [hasLocalData, setHasLocalData] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    if (localProducts.length > 5 || localSales.length > 0 || localCustomers.length > 5) {
      setHasLocalData(true);
    }
  }, [localProducts, localSales, localCustomers]);

  if (!hasLocalData || migrated) return null;

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      // 1. Sync Business Info
      if (localBusiness) {
        await updateBusinessInfo(localBusiness);
      }

      // 2. Sync Products
      for (const p of localProducts) {
         await addProduct(p as any);
      }

      // 3. Sync Customers
      for (const c of localCustomers) {
         await addCustomer(c as any);
      }

      // 4. Sync Sales
      for (const s of localSales) {
         await addSale(s as any);
      }

      toast.success('Legacy data migrated successfully');
      setMigrated(true);
    } catch (error) {
      toast.error('Migration failed. Partial data might have been synced.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="w-80 shadow-2xl border-none bg-black text-white rounded-3xl overflow-hidden ring-4 ring-[#F2CB05]/20">
        <CardHeader className="pb-3 text-center">
           <div className="w-12 h-12 bg-[#F2CB05] rounded-2xl flex items-center justify-center mx-auto mb-4 text-black shadow-lg shadow-[#F2CB05]/20"><CloudUpload className="h-6 w-6" /></div>
           <CardTitle className="text-lg font-black font-['Poppins']">Migración Cloud</CardTitle>
           <CardDescription className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Detectamos datos locales. ¿Deseas subirlos a tu nueva infraestructura doctoral?</CardDescription>
        </CardHeader>
        <CardFooter className="p-6 pt-2">
          <Button onClick={handleMigrate} disabled={isMigrating} className="w-full h-12 bg-white dark:bg-zinc-950 text-black font-black rounded-2xl hover:bg-gray-100 transition-all">{isMigrating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CloudUpload className="h-5 w-5 mr-2" />}{isMigrating ? 'Sincronizando...' : 'SINCRONIZAR AHORA'}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

