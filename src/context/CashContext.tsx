import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import { useLocation } from './LocationContext';
import { useSales } from './SalesContext';
import { CashRegisterRepository } from '@/services/repositories/CashRegisterRepository';
import type { CashRegister } from '@/types';

interface CashContextType {
  isOpen: boolean;
  currentRegister: CashRegister | null;
  loading: boolean;
  openRegister: (initialAmount: number) => Promise<{ success: boolean; message: string }>;
  closeRegister: (actualAmount: number, notes?: string) => Promise<{ success: boolean; message: string; diff: number }>;
  refreshRegister: () => Promise<void>;
  expectedCash: number;
}

const CashContext = createContext<CashContextType | undefined>(undefined);
const repository = new CashRegisterRepository();

export function CashProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { businessId } = useBusiness();
  const { currentLocation } = useLocation();
  const { sales } = useSales();
  
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);

  // El efectivo "esperado" es la Base Inicial + Las Ventas en EFECTIVO hechas DURANTE el turno abierto.
  const [expectedCash, setExpectedCash] = useState(0);

  useEffect(() => {
    refreshRegister();
  }, [user?.id, businessId, currentLocation?.id]);

  useEffect(() => {
    if (!currentRegister) {
      setExpectedCash(0);
      return;
    }

    // Calcula todas las ventas hechas en "cash", que no esten reversadas, creadas despues de abrir la caja.
    const openTime = new Date(currentRegister.openedAt).getTime();
    
    const cashSalesAmount = sales
      .filter(s => {
        const saleTime = new Date(s.date).getTime();
        return s.paymentMethod === 'cash' && !s.isReversed && saleTime >= openTime && s.locationId === currentRegister.locationId;
      })
      .reduce((sum, s) => sum + s.total, 0);
      
    setExpectedCash(currentRegister.initialAmount + cashSalesAmount);
    
  }, [currentRegister, sales]);

  const refreshRegister = async () => {
    if (!user || !businessId || !currentLocation?.id) {
      setCurrentRegister(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const openReg = await repository.getOpenRegister(businessId, currentLocation.id, user.id);
      setCurrentRegister(openReg);
    } catch (err) {
      console.error('Error in refreshRegister:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRegister = async (initialAmount: number) => {
    if (!user || !businessId || !currentLocation?.id) {
      return { success: false, message: 'No se encontraron las credenciales del sistema.' };
    }
    if (currentRegister) {
      return { success: false, message: 'Ya existe una caja abierta en esta sede.' };
    }

    try {
      const newReg = await repository.create({
        businessId,
        locationId: currentLocation.id,
        openedBy: user.id,
        initialAmount,
        expectedAmount: initialAmount, // Starts equal to initial 
        status: 'open'
      });
      setCurrentRegister(newReg);
      return { success: true, message: 'Caja abierta exitosamente. ¡Que tengas un excelente turno!' };
    } catch (error: any) {
      console.error('Error al abrir caja:', error);
      return { success: false, message: error.message || 'Error técnico al abrir la caja.' };
    }
  };

  const closeRegister = async (actualAmount: number, notes?: string) => {
    if (!currentRegister) {
      return { success: false, message: 'No hay ninguna caja abierta', diff: 0 };
    }

    const difference = actualAmount - expectedCash;

    try {
      await repository.update(currentRegister.id, {
        actualAmount,
        expectedAmount: expectedCash,
        difference,
        status: 'closed',
        closedAt: new Date().toISOString(),
        notes
      });

      setCurrentRegister(null); // Caja ya no está abierta
      
      let msg = `Caja Cerrada (Diferencia: $${difference.toLocaleString('es-CO')})`;
      if (difference === 0) msg = '¡Caja Cuadrada Perfectamente! Turno cerrado.';
      else if (difference < 0) msg = `Caja Cerrada con un FALTANTE de ${Math.abs(difference).toLocaleString('es-CO')} COP.`;
      else msg = `Caja Cerrada con un SOBRANTE de ${difference.toLocaleString('es-CO')} COP.`;
      
      return { success: true, message: msg, diff: difference };
    } catch (error: any) {
      console.error('Error al cerrar caja:', error);
      return { success: false, message: 'Error al cerrar la caja en el servidor.', diff: 0 };
    }
  };

  return (
    <CashContext.Provider value={{
      isOpen: !!currentRegister,
      currentRegister,
      loading,
      expectedCash,
      openRegister,
      closeRegister,
      refreshRegister
    }}>
      {children}
    </CashContext.Provider>
  );
}

export const useCash = () => {
  const context = useContext(CashContext);
  if (context === undefined) {
    throw new Error('useCash must be used within a CashProvider');
  }
  return context;
};
