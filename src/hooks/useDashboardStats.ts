import { useMemo } from 'react';
import type { Sale, Expense, Invoice, Location } from '@/types';

interface UseDashboardStatsParams {
  sales: Sale[];
  expenses: Expense[];
  invoices: Invoice[];
  currentLocation: Location | null;
}

/**
 * Extracts all heavy useMemo calculations from Dashboard.tsx
 * so the component stays clean and these can be tested independently.
 */
export function useDashboardStats({ sales, expenses, invoices, currentLocation }: UseDashboardStatsParams) {
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter(s => {
      const matchesDate = new Date(s.date).toDateString() === today;
      const matchesLocation = currentLocation ? s.locationId === currentLocation.id : true;
      return matchesDate && matchesLocation && !s.isReversed;
    }).reduce((sum, s) => sum + s.total, 0);
  }, [sales, currentLocation]);

  const salesByHour = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am–8pm
    const today = new Date().toDateString();
    return hours.map(hour => {
      const total = sales.filter(s => {
        const d = new Date(s.date);
        return d.toDateString() === today && d.getHours() >= hour && d.getHours() < hour + 1 && !s.isReversed;
      }).reduce((sum, s) => sum + s.total, 0);
      return { hour: `${hour}:00`, sales: total };
    });
  }, [sales]);

  const weeklyData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toDateString();
      const daySalesList = sales.filter(s => new Date(s.date).toDateString() === dateStr && !s.isReversed);
      const Ventas = daySalesList.reduce((sum, s) => sum + s.total, 0);
      const Costos = daySalesList.reduce((sum, s) => sum + s.products.reduce((acc, p) => acc + (p.cost || 0) * p.quantity, 0), 0);
      const Gastos = expenses.filter(e => new Date(e.date).toDateString() === dateStr).reduce((sum, e) => sum + e.amount, 0);
      return { name: days[date.getDay()], Ventas, Gastos, Ganancia: Ventas - Costos - Gastos };
    });
  }, [sales, expenses]);

  const paymentMethodData = useMemo(() => {
    const methods = { cash: 0, card: 0, transfer: 0 };
    sales.filter(s => !s.isReversed).forEach(s => { methods[s.paymentMethod] += s.total; });
    return [
      { name: 'Efectivo', value: methods.cash, color: '#10B981' },
      { name: 'Tarjeta', value: methods.card, color: '#3B82F6' },
      { name: 'Transferencia', value: methods.transfer, color: '#8B5CF6' },
    ].filter(m => m.value > 0);
  }, [sales]);

  const topProductsData = useMemo(() => {
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    sales.filter(s => !s.isReversed).forEach(sale => {
      sale.products.forEach(product => {
        const current = productSales.get(product.productId) || { name: product.name, quantity: 0, revenue: 0 };
        current.quantity += product.quantity;
        current.revenue += product.price * product.quantity;
        productSales.set(product.productId, current);
      });
    });
    return Array.from(productSales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  const invoiceStatusData = useMemo(() => {
    const status: Record<string, number> = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
    invoices.forEach(inv => { if (status[inv.status] !== undefined) status[inv.status] += inv.total; });
    return [
      { name: 'Pagadas', value: status.paid, color: '#10B981' },
      { name: 'Por cobrar', value: status.sent + status.overdue, color: '#F59E0B' },
      { name: 'Borradores', value: status.draft, color: '#6B7280' },
    ].filter(s => s.value > 0);
  }, [invoices]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    sales.filter(s => !s.isReversed).forEach(sale => {
      sale.products.forEach(p => {
        // We might need to fetch the actual product category if it's not in the sale item
        // For now using a placeholder or a default
        const cat = 'General'; 
        categories[cat] = (categories[cat] || 0) + (p.price * p.quantity);
      });
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const projections = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    
    // --- 1. SEPARATE CURRENT MONTH VS HISTORICAL ---
    const monthlySalesData = sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && !s.isReversed;
    });
    const historicalSalesData = sales.filter(s => {
      const d = new Date(s.date);
      return (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) && !s.isReversed;
    });

    const monthlySales = monthlySalesData.reduce((sum, s) => sum + s.total, 0);
    const monthlyCosts = monthlySalesData.reduce((sum, s) => sum + s.products.reduce((acc, p) => acc + (p.cost || 0) * p.quantity, 0), 0);
    
    // --- 2. INTELLIGENT HEURISTIC MODEL (Day of Week Weights) ---
    // Calculate total historical sales per day of the week
    const dowSales = [0, 0, 0, 0, 0, 0, 0];
    const dowCounts = [0, 0, 0, 0, 0, 0, 0];
    const recordedDays = new Set<string>();

    historicalSalesData.forEach(s => {
      const d = new Date(s.date);
      const dateStr = d.toDateString();
      if (!recordedDays.has(dateStr)) {
        recordedDays.add(dateStr);
        dowCounts[d.getDay()] += 1;
      }
      dowSales[d.getDay()] += s.total;
    });

    // Calculate historical DOW averages
    const dowAverages = dowSales.map((total, i) => dowCounts[i] > 0 ? total / dowCounts[i] : 0);
    const validAverages = dowAverages.filter(avg => avg > 0);
    const globalHistoricalAvg = validAverages.length > 0 ? validAverages.reduce((a, b) => a + b, 0) / validAverages.length : 0;

    // Calculate DOW Multipliers (e.g. Friday is 1.2x the average, Monday is 0.8x)
    const dowMultipliers = dowAverages.map(avg => globalHistoricalAvg > 0 && avg > 0 ? avg / globalHistoricalAvg : 1);

    // Current month base velocity
    const currentMonthDailyAvg = currentDay > 0 ? monthlySales / currentDay : 0;
    const currentMonthDailyCostAvg = currentDay > 0 ? monthlyCosts / currentDay : 0;

    // --- 3. PROJECT REST OF THE MONTH ---
    let remainingProjectedSales = 0;
    let remainingProjectedCosts = 0;

    for (let day = currentDay + 1; day <= daysInMonth; day++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth(), day);
      const m = dowMultipliers[futureDate.getDay()];
      remainingProjectedSales += currentMonthDailyAvg * m;
      remainingProjectedCosts += currentMonthDailyCostAvg * m;
    }

    const projectedSales = monthlySales + remainingProjectedSales;
    const projectedCosts = monthlyCosts + remainingProjectedCosts;
    
    // --- 4. EXPENSES (Linear Projection - Expenses are usually fixed, not DOW dependent) ---
    const monthlyExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);

    const projectedExpenses = (monthlyExpenses / currentDay) * daysInMonth;

    return {
      monthlySales,
      projectedSales,
      monthlyExpenses,
      projectedExpenses,
      projectedProfit: projectedSales - projectedCosts - projectedExpenses,
      growth: monthlySales > 0 ? ((projectedSales / monthlySales) - 1) * 100 : 0
    };
  }, [sales, expenses]);

  return { 
    todaySales, 
    salesByHour, 
    weeklyData, 
    paymentMethodData, 
    topProductsData, 
    invoiceStatusData,
    categoryData,
    projections
  };
}
