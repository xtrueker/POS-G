import { useMemo } from 'react';
import { useSales } from '@/context/SalesContext';
import { useInventory } from '@/context/InventoryContext';
import { useBusiness } from '@/context/BusinessContext';

export interface ProductForecast {
  productId: string;
  name: string;
  stock: number;
  expectedDaily: number;
  expectedCurrentHour: number;
  actualSoldToday: number;
  deviationUnits: number;
  deviationPercent: number; // Positive = selling more than expected, Negative = selling less
  rotationPercent: number; // (actualSoldToday / (stock + actualSoldToday)) * 100
  status: 'critical_low' | 'low' | 'optimal' | 'high' | 'critical_high';
}

export interface RecommendedAction {
  id: string;
  type: 'promo_flash' | 'reduce_production' | 'increase_production' | 'reduce_stock' | 'increase_stock';
  productId: string;
  productName: string;
  reason: string;
  suggestedValue?: string;
  priority: 'high' | 'medium' | 'low';
}

export function useForecastEngine() {
  const { sales } = useSales();
  const { products } = useInventory();
  const { businessInfo } = useBusiness();
  const isBakery = businessInfo?.vertical === 'bakery';

  // Constantes asumidas para el cálculo del horario operativo (6 AM a 8 PM = 14 horas)
  const OP_START_HOUR = 6;
  const OP_END_HOUR = 20;

  const engine = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Calcular horas transcurridas en el turno
    const currentHour = now.getHours();
    let elapsedHours = 0;
    if (currentHour >= OP_START_HOUR && currentHour <= OP_END_HOUR) {
      elapsedHours = currentHour - OP_START_HOUR + 1;
    } else if (currentHour > OP_END_HOUR) {
      elapsedHours = OP_END_HOUR - OP_START_HOUR;
    }

    // Filtrar ventas válidas
    const validSales = sales.filter(s => !s.isReversed);

    // 1. Agrupar ventas históricas por producto de los últimos 7 días (excluyendo hoy)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const historicalSales = validSales.filter(s => {
      const d = new Date(s.date);
      return d >= sevenDaysAgo && d.toDateString() !== todayStr;
    });

    const todaySales = validSales.filter(s => new Date(s.date).toDateString() === todayStr);

    const histByProduct = new Map<string, number>();
    historicalSales.forEach(sale => {
      sale.products.forEach(p => {
        histByProduct.set(p.productId, (histByProduct.get(p.productId) || 0) + p.quantity);
      });
    });

    const todayByProduct = new Map<string, number>();
    todaySales.forEach(sale => {
      sale.products.forEach(p => {
        todayByProduct.set(p.productId, (todayByProduct.get(p.productId) || 0) + p.quantity);
      });
    });

    // 2. Calcular Forecast por Producto
    const forecasts: ProductForecast[] = products.map(product => {
      // Promedio diario = total historia 7 dias / 7
      const expectedDaily = (histByProduct.get(product.id) || 0) / 7;
      
      // Proyección a la hora actual
      const expectedHourlyRate = expectedDaily / (OP_END_HOUR - OP_START_HOUR);
      const expectedCurrentHour = expectedHourlyRate * elapsedHours;

      const actualSoldToday = todayByProduct.get(product.id) || 0;
      
      const deviationUnits = actualSoldToday - expectedCurrentHour;
      const deviationPercent = expectedCurrentHour > 0 
        ? (deviationUnits / expectedCurrentHour) * 100 
        : (actualSoldToday > 0 ? 100 : 0);

      const totalHandled = product.stock + actualSoldToday;
      const rotationPercent = totalHandled > 0 ? (actualSoldToday / totalHandled) * 100 : 0;

      let status: ProductForecast['status'] = 'optimal';
      if (deviationPercent < -30) status = 'critical_low';
      else if (deviationPercent < -10) status = 'low';
      else if (deviationPercent > 30) status = 'critical_high';
      else if (deviationPercent > 10) status = 'high';

      // Fallback: If no history exists, it's optimal until proven otherwise (to avoid false criticals on new products)
      if (expectedDaily === 0 && actualSoldToday === 0) {
        status = 'optimal';
      }

      return {
        productId: product.id,
        name: product.name,
        stock: product.stock,
        expectedDaily,
        expectedCurrentHour,
        actualSoldToday,
        deviationUnits,
        deviationPercent,
        rotationPercent,
        status
      };
    });

    // 3. Generar Recomendaciones de Acción Directa
    const actions: RecommendedAction[] = [];

    forecasts.forEach(f => {
      // Regla 1: Rotación < 90% o Stock actual proyectado a sobrar demasiado (Desviación < -15%)
      // Para simular la regla del prompt (Rotación < 90%), pero siendo realistas, medimos la desviación del momento.
      if (f.status === 'critical_low' && f.stock > 0) {
        actions.push({
          id: `act_promo_${f.productId}`,
          type: 'promo_flash',
          productId: f.productId,
          productName: f.name,
          reason: `Rotación muy lenta (${f.deviationPercent.toFixed(1)}% bajo forecast). Exceso de stock inminente.`,
          suggestedValue: '2x1',
          priority: 'high'
        });
      }

      // Regla 2: Stock > Forecast esperado para el resto del día + 15%
      const remainingExpectedToday = f.expectedDaily - f.expectedCurrentHour;
      if (f.stock > remainingExpectedToday * 1.15 && f.stock > 5) {
         // Ya sugerimos promo arriba si estaba muy mal, si no, sugerimos frenar producción/compras
         if (f.status !== 'critical_low') {
           actions.push({
            id: `act_reduce_${f.productId}`,
            type: isBakery ? 'reduce_production' : 'reduce_stock',
            productId: f.productId,
            productName: f.name,
            reason: isBakery 
              ? `Stock actual (${f.stock}) supera el forecast restante del día (${remainingExpectedToday.toFixed(0)} unidades). Evitar horneado extra.`
              : `Stock estancado. Actual (${f.stock}) pero proyección corta (${remainingExpectedToday.toFixed(0)} unidades). Pausar reabastecimiento.`,
            priority: 'medium'
          });
         }
      }

      // Regla 3: Stock < Forecast restante - 10% (Se va a acabar pronto)
      if (f.stock < remainingExpectedToday * 0.9 && f.expectedDaily > 5 && f.status !== 'critical_low') {
        actions.push({
          id: `act_increase_${f.productId}`,
          type: isBakery ? 'increase_production' : 'increase_stock',
          productId: f.productId,
          productName: f.name,
          reason: isBakery 
            ? `Quiebre de stock inminente. Faltarán aprox ${(remainingExpectedToday - f.stock).toFixed(0)} unidades para cubrir el turno.`
            : `Necesitas reabastecer en mostrador. Faltarán aprox ${(remainingExpectedToday - f.stock).toFixed(0)} unidades para la demanda de hoy.`,
          suggestedValue: `+${Math.ceil(remainingExpectedToday - f.stock)}`,
          priority: 'high'
        });
      }
    });

    // Global Metrics
    const totalExpectedNow = forecasts.reduce((sum, f) => sum + f.expectedCurrentHour, 0);
    const totalActualNow = forecasts.reduce((sum, f) => sum + f.actualSoldToday, 0);
    const globalDeviation = totalExpectedNow > 0 ? ((totalActualNow - totalExpectedNow) / totalExpectedNow) * 100 : 0;
    
    // Avg rotation
    const globalRotation = forecasts.length > 0 
      ? forecasts.reduce((sum, f) => sum + f.rotationPercent, 0) / forecasts.length 
      : 0;

    return {
      forecasts,
      actions: actions.sort((a, b) => (a.priority === 'high' ? 0 : 1) - (b.priority === 'high' ? 0 : 1)), // High priority first
      globalMetrics: {
        totalExpectedNow,
        totalActualNow,
        globalDeviation,
        globalRotation,
        forecastFulfillment: totalExpectedNow > 0 ? Math.min((totalActualNow / totalExpectedNow) * 100, 100) : 0
      }
    };
  }, [sales, products]);

  return engine;
}
