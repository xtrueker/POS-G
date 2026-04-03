import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

import {
  STORAGE_KEY,
  USERS_KEY,
  ROLE_PERMISSIONS,
  SAMPLE_PRODUCTS,
  SAMPLE_CUSTOMERS,
  SAMPLE_PROMOTIONS,
  SAMPLE_LOCATIONS,
  LOYALTY_POINTS_PER_CURRENCY,
} from '@/lib/constants';
import { storage } from '@/lib/storage';
import {
  generateId,
  generateBarcode,
  getDeviceInfo,
  getCustomerTier,
} from '@/lib/utils';
import { generateCUFE } from '@/lib/dian';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

import type {
  AppState,
  User,
  Permission,
  Product,
  Sale,
  Expense,
  Customer,
  Supplier,
  Invoice,
  StaffMember,
  Location,
  Promotion,
  Appointment,
  AuditLog,
  AuditAction,
  SecurityAlert,
  DashboardStats,
  BusinessInfo,
} from '@/types';

// Re-export types so consumers don't need to change imports
export type {
  User,
  Permission,
  Product,
  Sale,
  SaleItem,
  Expense,
  Customer,
  Supplier,
  Invoice,
  StaffMember,
  Location,
  Promotion,
  Appointment,
  AuditLog,
  AuditAction,
  SecurityAlert,
  UserRole,
  DashboardStats,
  AppState,
  BusinessInfo,
} from '@/types';
export { ROLE_PERMISSIONS } from '@/lib/constants';

// ============================================
// CONTEXT TYPE
// ============================================

interface AppContextType extends AppState {
  login: (email: string, password: string) => { success: boolean; message: string };
  register: (name: string, email: string, password: string, businessName: string, ownerPin: string) => { success: boolean; message: string };
  logout: () => void;
  verifyOwnerPin: (pin: string) => boolean;
  hasPermission: (permission: Permission) => boolean;
  requirePinForAction: (action: string, callback: () => void) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, pin?: string) => Promise<{ success: boolean; message: string }>;
  updateProduct: (id: string, product: Partial<Product>, pin?: string) => Promise<{ success: boolean; message: string }>;
  deleteProduct: (id: string, pin: string) => Promise<{ success: boolean; message: string }>;
  addSale: (sale: Omit<Sale, 'id' | 'date' | 'staffId' | 'staffName'>) => Promise<{ success: boolean; sale?: Sale; message: string }>;
  reverseSale: (id: string, pin: string, reason: string) => Promise<{ success: boolean; message: string }>;
  deleteSale: (id: string, pin: string) => Promise<{ success: boolean; message: string }>;
  addExpense: (expense: Omit<Expense, 'id' | 'date' | 'createdBy'>) => Promise<{ success: boolean; message: string }>;
  deleteExpense: (id: string, pin?: string) => Promise<{ success: boolean; message: string }>;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalSpent' | 'balance' | 'loyaltyPoints' | 'lifetimePoints' | 'tier' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<{ success: boolean; message: string }>;
  deleteCustomer: (id: string, pin?: string) => Promise<{ success: boolean; message: string }>;
  addLoyaltyPoints: (customerId: string, points: number, reason: string) => Promise<void>;
  redeemLoyaltyPoints: (customerId: string, points: number) => Promise<{ success: boolean; message: string }>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'balance' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<{ success: boolean; message: string }>;
  deleteSupplier: (id: string, pin?: string) => Promise<{ success: boolean; message: string }>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdBy' | 'isEditable'>) => Promise<{ success: boolean; message: string }>;
  markInvoiceAsPaid: (id: string, paymentMethod: 'cash' | 'card' | 'transfer') => Promise<{ success: boolean; message: string }>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<{ success: boolean; message: string }>;
  deleteInvoice: (id: string, pin?: string) => Promise<{ success: boolean; message: string }>;
  addStaff: (staff: Omit<StaffMember, 'id' | 'createdAt' | 'createdBy'>, pin?: string) => Promise<{ success: boolean; message: string }>;
  updateStaff: (id: string, staff: Partial<StaffMember>, pin?: string) => Promise<{ success: boolean; message: string }>;
  deleteStaff: (id: string, pin: string) => Promise<{ success: boolean; message: string }>;
  addLocation: (location: Omit<Location, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateLocation: (id: string, location: Partial<Location>) => Promise<{ success: boolean; message: string }>;
  deleteLocation: (id: string, pin?: string) => Promise<{ success: boolean; message: string }>;
  setCurrentLocation: (location: Location | null) => void;
  addPromotion: (promotion: Omit<Promotion, 'id' | 'usageCount' | 'createdBy'>, pin?: string) => Promise<{ success: boolean; message: string }>;
  updatePromotion: (id: string, promotion: Partial<Promotion>, pin?: string) => Promise<{ success: boolean; message: string }>;
  deletePromotion: (id: string, pin: string) => Promise<{ success: boolean; message: string }>;
  validatePromoCode: (code: string, cartTotal: number, items: { productId: string; category: string }[]) => { valid: boolean; promotion?: Promotion; discountAmount: number; message: string; requiresPin?: boolean };
  addAppointment: (appointment: Omit<Appointment, 'id'>) => { success: boolean; message: string };
  updateAppointment: (id: string, appointment: Partial<Appointment>) => { success: boolean; message: string };
  deleteAppointment: (id: string) => { success: boolean; message: string };
  getAuditLogs: (filters?: { userId?: string; action?: AuditAction; startDate?: string; endDate?: string }) => AuditLog[];
  getSecurityAlerts: (unreadOnly?: boolean) => SecurityAlert[];
  markAlertAsRead: (alertId: string) => void;
  clearAllAlerts: (pin: string) => { success: boolean; message: string };
  updateBusinessInfo: (info: BusinessInfo) => void;
  getDashboardStats: (locationId?: string) => DashboardStats;
  getProductByBarcode: (barcode: string) => Product | undefined;
  generateBarcode: () => string;
  isSyncing: boolean;
  uploadFile: (bucket: 'logos' | 'products', path: string, file: File) => Promise<{ publicUrl: string | null; error: any }>;
}

const EMPTY_STATE: AppState = {
  user: null,
  products: [],
  sales: [],
  expenses: [],
  customers: [],
  suppliers: [],
  invoices: [],
  staff: [],
  locations: [],
  promotions: [],
  appointments: [],
  auditLogs: [],
  securityAlerts: [],
  offlineTransactions: [],
  currentLocation: null,
  businessInfo: null,
  isAuthenticated: false,
  isOffline: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [isSyncing, setIsSyncing] = useState(false);

  // Debounce ref for localStorage saves
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize base listeners without localStorage
  useEffect(() => {

    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setState(prev => ({ ...prev, isOffline: !navigator.onLine }));
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync with Supabase when authUser changes
  useEffect(() => {
    if (authUser && !authLoading) {
      loadDataFromSupabase();
    }
  }, [authUser, authLoading]);

  const loadDataFromSupabase = async () => {
    if (!authUser) return;
    setIsSyncing(true);
    try {
      // 1. Fetch Business Info
      const { data: profile, error: _profileError } = await (supabase
        .from('profiles')
        .select('*, businesses(*)')
        .eq('id', authUser.id)
        .single() as any);

      if (profile && profile.businesses) {
        const bus = profile.businesses;
        setState(prev => ({
          ...prev,
          businessInfo: {
            legalName: bus.legal_name || '',
            nit: bus.nit || '',
            verificationDigit: bus.verification_digit || 0,
            address: bus.address || '',
            city: bus.city || '',
            department: bus.department || '',
            phone: bus.phone || '',
            email: bus.email || '',
            regimen: bus.regimen as any,
            resolutionNumber: bus.resolution_number || '',
            prefix: bus.prefix || '',
          }
        }));
      }

      // 2. Fetch Products
      const { data: products, error: _productsError } = await (supabase
        .from('products')
        .select('*')
        .eq('is_active', true) as any);

      if (products) {
        setState(prev => ({
          ...prev,
          products: (products as any[]).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            sku: p.sku || '',
            barcode: p.barcode || '',
            category: p.category || 'General',
            price: Number(p.price),
            cost: Number(p.cost),
            stock: p.stock,
            minStock: p.min_stock || 5,
            unit: p.unit || 'unidad',
            image: p.image_url || '',
            createdAt: p.created_at,
            updatedAt: p.updated_at || p.created_at,
          }))
        }));
      }
      
      // ... Load other entities similarly
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Keep state.user and state.isAuthenticated in sync with authUser
  useEffect(() => {
    if (authUser) {
      setState(prev => ({
        ...prev,
        user: {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
          email: authUser.email || '',
          businessName: authUser.user_metadata?.business_name || '',
          role: 'owner',
          avatar: authUser.user_metadata?.avatar_url,
          plan: 'free',
          permissions: (ROLE_PERMISSIONS as any).owner,
          loginAttempts: 0,
          isLocked: false,
          createdAt: authUser.created_at
        },
        isAuthenticated: true
      }));
    } else {
      setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
    }
  }, [authUser]);



  // ─── Internal helpers ─────────────────────────────────────────────────────

  const logAudit = useCallback((
    log: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole' | 'deviceInfo'>,
    currentUser: User | null,
  ) => {
    const entry: AuditLog = {
      ...log,
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id ?? 'system',
      userName: currentUser?.name ?? 'Sistema',
      userRole: currentUser?.role ?? 'owner',
      deviceInfo: getDeviceInfo(),
    };
    setState(prev => ({ ...prev, auditLogs: [entry, ...prev.auditLogs] }));
  }, []);

  const addAlert = useCallback((alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'isRead'>) => {
    const entry: SecurityAlert = {
      ...alert,
      id: generateId(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setState(prev => ({ ...prev, securityAlerts: [entry, ...prev.securityAlerts] }));
  }, []);

  const verifyOwnerPin = useCallback((pin: string): boolean => {
    return state.user?.ownerPin === pin;
  }, [state.user]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return state.user?.permissions.includes(permission) || state.user?.role === 'owner' || false;
  }, [state.user]);

  const requirePinForAction = useCallback((_action: string, callback: () => void) => {
    callback();
  }, []);

  // ─── AUTH ─────────────────────────────────────────────────────────────────

  const login = useCallback((email: string, password: string): { success: boolean; message: string } => {
    const users = storage.get<(User & { password: string })[]>(USERS_KEY) ?? [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      if (user.isLocked) {
        addAlert({ type: 'login_failed', severity: 'high', title: 'Cuenta bloqueada', message: `Intento de acceso a cuenta bloqueada: ${email}`, userId: user.id, userName: user.name });
        return { success: false, message: 'Cuenta bloqueada. Contacte al administrador.' };
      }
      const { password: _pw, ...clean } = user;
      clean.lastLogin = new Date().toISOString();
      setState(prev => ({ ...prev, user: clean, isAuthenticated: true, products: SAMPLE_PRODUCTS, customers: SAMPLE_CUSTOMERS, promotions: SAMPLE_PROMOTIONS, locations: SAMPLE_LOCATIONS, currentLocation: SAMPLE_LOCATIONS[0], sessionStartTime: new Date().toISOString() }));
      return { success: true, message: 'Bienvenido a POS-G' };
    }

    if (email === 'demo@pos-g.app' && password === 'demo123') {
      const demoUser: User = { id: 'demo', name: 'Usuario Demo', email: 'demo@pos-g.app', businessName: 'VAPER-G', plan: 'pro', role: 'owner', permissions: (ROLE_PERMISSIONS as any).owner, ownerPin: '123456', loginAttempts: 0, isLocked: false, createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, user: demoUser, isAuthenticated: true, products: SAMPLE_PRODUCTS, customers: SAMPLE_CUSTOMERS, promotions: SAMPLE_PROMOTIONS, locations: SAMPLE_LOCATIONS, currentLocation: SAMPLE_LOCATIONS[0], sessionStartTime: new Date().toISOString() }));
      return { success: true, message: 'Bienvenido (Modo Demo)' };
    }

    addAlert({ type: 'login_failed', severity: 'medium', title: 'Intento de login fallido', message: `Credenciales inválidas: ${email}` });
    return { success: false, message: 'Correo o contraseña incorrectos' };
  }, [addAlert]);

  const register = useCallback((name: string, email: string, password: string, businessName: string, ownerPin: string): { success: boolean; message: string } => {
    const users = storage.get<(User & { password: string })[]>(USERS_KEY) ?? [];
    if (users.some(u => u.email === email)) return { success: false, message: 'El correo ya está registrado' };

    const newUser: User & { password: string } = { id: generateId(), name, email, businessName, plan: 'free', role: 'owner', permissions: (ROLE_PERMISSIONS as any).owner, ownerPin, loginAttempts: 0, isLocked: false, createdAt: new Date().toISOString(), password };
    storage.set(USERS_KEY, [...users, newUser]);

    const { password: _pw, ...clean } = newUser;
    setState(prev => ({ ...prev, user: clean, isAuthenticated: true, products: [], sales: [], expenses: [], customers: [], suppliers: [], invoices: [], staff: [], locations: [{ id: generateId(), name: 'Sede Principal', address: '', isActive: true, createdAt: new Date().toISOString() }], promotions: [], appointments: [], currentLocation: null, sessionStartTime: new Date().toISOString() }));
    return { success: true, message: 'Cuenta creada exitosamente' };
  }, []);

  const logout = useCallback(() => {
    setState(EMPTY_STATE);
  }, []);

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, _pin?: string): Promise<{ success: boolean; message: string }> => {
    if (!state.user?.permissions.includes('inventory.create') && state.user?.role !== 'owner') return { success: false, message: 'No tiene permiso para crear productos' };
    
    const newProduct: Product = { ...product, id: generateId(), barcode: product.barcode || generateBarcode(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: state.user?.id };

    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;

        if (businessId) {
          const { data, error } = await (supabase.from('products') as any).insert({
            business_id: businessId,
            name: newProduct.name,
            description: newProduct.description,
            price: newProduct.price,
            cost: newProduct.cost,
            stock: newProduct.stock,
            category: newProduct.category,
            min_stock: newProduct.minStock,
            barcode: newProduct.barcode,
            sku: newProduct.sku,
            image_url: (newProduct as any).image || ''
          }).select().single() as any;

          if (error) throw error;
          if (data) newProduct.id = data.id;
        }
      } catch (err) {
        console.error('Supabase Prod Create Error:', err);
        return { success: false, message: 'Error al sincronizar con la nube.' };
      }
    }

    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
    logAudit({ action: 'INVENTORY_CREATE', entityType: 'product', entityId: newProduct.id, description: `Producto creado: ${product.name}`, newValue: newProduct, severity: 'info' }, state.user);
    return { success: true, message: 'Producto creado exitosamente' };
  }, [state.user, logAudit, authUser]);

  const updateProduct = useCallback(async (id: string, product: Partial<Product>, pin?: string): Promise<{ success: boolean; message: string }> => {
    if (!state.user?.permissions.includes('inventory.edit') && state.user?.role !== 'owner') return { success: false, message: 'No tiene permiso para editar productos' };
    const existing = state.products.find(p => p.id === id);
    if (!existing) return { success: false, message: 'Producto no encontrado' };
    
    if ((product.price !== undefined || product.cost !== undefined) && pin && state.user?.ownerPin !== pin) {
      addAlert({ type: 'unauthorized_access', severity: 'high', title: 'Intento de modificación de precios', message: `Usuario ${state.user?.name} intentó cambiar precios sin PIN válido`, userId: state.user?.id, userName: state.user?.name });
      return { success: false, message: 'PIN incorrecto.' };
    }

    const updated = { ...existing, ...product, updatedAt: new Date().toISOString(), updatedBy: state.user?.id };

    if (authUser && id.length > 20) {
      try {
        const { error } = await (supabase.from('products') as any).update({
          name: updated.name,
          description: updated.description,
          price: updated.price,
          cost: updated.cost,
          stock: updated.stock,
          category: updated.category,
          min_stock: updated.minStock,
          barcode: updated.barcode,
          sku: updated.sku,
          image_url: (updated as any).image || ''
        }).eq('id', id) as any;
        if (error) throw error;
      } catch (err) {
        console.error('Supabase Prod Update Error:', err);
        return { success: false, message: 'Error al actualizar en la nube.' };
      }
    }

    setState(prev => ({ ...prev, products: prev.products.map(p => p.id === id ? updated : p) }));
    logAudit({ action: 'INVENTORY_UPDATE', entityType: 'product', entityId: id, description: `Producto actualizado: ${existing.name}`, oldValue: existing, newValue: updated, severity: 'info' }, state.user);
    return { success: true, message: 'Producto actualizado exitosamente' };
  }, [state.user, state.products, logAudit, addAlert, authUser]);

  const deleteProduct = useCallback(async (id: string, pin: string): Promise<{ success: boolean; message: string }> => {
    if (state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    const product = state.products.find(p => p.id === id);
    if (!product) return { success: false, message: 'Producto no encontrado' };

    if (authUser && id.length > 20) {
      try {
        const { error } = await (supabase.from('products').update({ is_active: false } as any).eq('id', id) as any);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase Prod Delete Error:', err);
        return { success: false, message: 'Error al eliminar en la nube.' };
      }
    }

    setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    logAudit({ action: 'INVENTORY_DELETE', entityType: 'product', entityId: id, description: `Producto eliminado: ${product.name}`, oldValue: product, severity: 'critical', requiresPin: true, pinVerified: true }, state.user);
    return { success: true, message: 'Producto eliminado exitosamente' };
  }, [state.user, state.products, logAudit, authUser]);

  const getProductByBarcode = useCallback((barcode: string) => state.products.find(p => p.barcode === barcode), [state.products]);

  // ─── SALES ────────────────────────────────────────────────────────────────

  const addSale = useCallback(async (sale: Omit<Sale, 'id' | 'date' | 'staffId' | 'staffName'>): Promise<{ success: boolean; sale?: Sale; message: string }> => {
    if (!state.user?.permissions.includes('sales.create') && state.user?.role !== 'owner') return { success: false, message: 'No tiene permiso para crear ventas' };

    // Validate stock for ALL items
    for (const item of sale.products) {
      const product = state.products.find(p => p.id === item.productId);
      if (!product) return { success: false, message: `Producto no encontrado: ${item.name}` };
      if (product.stock < item.quantity) {
        addAlert({ type: 'inventory_anomaly', severity: 'high', title: 'Stock insuficiente', message: `${product.name} (Stock: ${product.stock}, Solicitado: ${item.quantity})` });
        return { success: false, message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` };
      }
    }

    const newSale: Sale = { ...sale, id: generateId(), date: new Date().toISOString(), staffId: state.user?.id, staffName: state.user?.name, deviceInfo: getDeviceInfo() };

    // Supabase Sync
    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;

        if (businessId) {
          // 1. Insert Sale
          const { error: saleError } = await (supabase.from('sales') as any).insert({
            business_id: businessId,
            subtotal: newSale.subtotal,
            discount_amount: newSale.discountAmount,
            total: newSale.total,
            payment_method: newSale.paymentMethod,
            notes: newSale.notes,
            customer_id: newSale.customerId,
            items: newSale.products
          } as any);

          if (saleError) throw saleError;

          // 2. Update Customer Loyalty in Supabase
          if (newSale.customerId) {
            const customer = state.customers.find(c => c.id === newSale.customerId);
            if (customer) {
              const pointsEarned = Math.floor(newSale.total / LOYALTY_POINTS_PER_CURRENCY);
              const newLifetime = customer.lifetimePoints + pointsEarned;
              
              await (supabase.from('customers') as any).update({
                loyalty_points: customer.loyaltyPoints + pointsEarned,
                lifetime_points: newLifetime,
                tier: getCustomerTier(newLifetime),
                total_spent: customer.totalSpent + newSale.total,
                total_purchases: customer.totalPurchases + 1,
                last_purchase_date: new Date().toISOString()
              } as any).eq('id', newSale.customerId);
            }
          }
        }
      } catch (err) {
        console.error('Supabase Sale/Loyalty Sync Error:', err);
      }
    }

    // Batch state update: deduct stock + update customer + add sale
    setState(prev => {
      let products = prev.products;
      let customers = prev.customers;

      // Deduct stock
      products = products.map(p => {
        const item = sale.products.find(i => i.productId === p.id);
        if (!item) return p;
        return { ...p, stock: p.stock - item.quantity, updatedAt: new Date().toISOString(), updatedBy: state.user?.id };
      });

      // Update customer loyalty
      if (sale.customerId) {
        const pointsEarned = Math.floor(sale.total / LOYALTY_POINTS_PER_CURRENCY);
        customers = customers.map(c => {
          if (c.id !== sale.customerId) return c;
          const newLifetime = c.lifetimePoints + pointsEarned;
          return { ...c, totalPurchases: c.totalPurchases + 1, totalSpent: c.totalSpent + sale.total, loyaltyPoints: c.loyaltyPoints + pointsEarned, lifetimePoints: newLifetime, tier: getCustomerTier(newLifetime), lastPurchaseDate: new Date().toISOString() };
        });
      }

      return { ...prev, products, customers, sales: [newSale, ...prev.sales] };
    });

    logAudit({ action: 'SALE_CREATE', entityType: 'sale', entityId: newSale.id, description: `Venta creada: $${sale.total.toLocaleString('es-CO')}`, newValue: newSale, severity: 'info' }, state.user);

    // Low stock alerts (post-update)
    sale.products.forEach(item => {
      const product = state.products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        if (newStock <= product.minStock) addAlert({ type: 'low_stock', severity: newStock === 0 ? 'critical' : 'medium', title: newStock === 0 ? 'Producto sin stock' : 'Stock bajo', message: `${product.name} - Stock: ${newStock} (Mín: ${product.minStock})`, entityId: product.id, entityType: 'product' });
      }
    });

    return { success: true, sale: newSale, message: 'Venta completada exitosamente' };
  }, [state.user, state.products, state.customers, logAudit, addAlert, authUser]);

  const reverseSale = useCallback(async (id: string, pin: string, reason: string): Promise<{ success: boolean; message: string }> => {
    if (state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    const sale = state.sales.find(s => s.id === id);
    if (!sale || sale.isReversed) return { success: false, message: 'Venta no válida o ya reversada' };

    if (authUser && id.length > 20) {
      try {
        await (supabase.from('sales').update({ is_reversed: true, reversal_reason: reason } as any).eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Reverse Error:', err);
      }
    }

    setState(prev => {
      const products = prev.products.map(p => {
        const item = sale.products.find(i => i.productId === p.id);
        return item ? { ...p, stock: p.stock + item.quantity, updatedAt: new Date().toISOString() } : p;
      });
      const sales = prev.sales.map(s => s.id === id ? { ...s, isReversed: true, reversalReason: reason, reversedAt: new Date().toISOString() } : s);
      return { ...prev, products, sales };
    });

    logAudit({ action: 'SALE_REVERSE', entityType: 'sale', entityId: id, description: `Venta reversada: ${reason}`, severity: 'warning' }, state.user);
    return { success: true, message: 'Venta reversada' };
  }, [state.user, state.sales, logAudit, authUser]);

  const deleteSale = useCallback(async (id: string, pin: string): Promise<{ success: boolean; message: string }> => {
    if (state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    const sale = state.sales.find(s => s.id === id);
    if (!sale) return { success: false, message: 'Venta no encontrada' };

    if (authUser && id.length > 20) {
      try {
        await (supabase.from('sales').delete().eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Delete Sale Error:', err);
      }
    }

    setState(prev => ({ ...prev, sales: prev.sales.filter(s => s.id !== id) }));
    return { success: true, message: 'Venta eliminada' };
  }, [state.user, state.sales, authUser]);

  // ─── EXPENSES ───────────────────────────────────────────────────────────

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'date' | 'createdBy'>): Promise<{ success: boolean; message: string }> => {
    if (!state.user?.permissions.includes('expenses.create') && state.user?.role !== 'owner') return { success: false, message: 'Sin permiso' };
    const newExpense: Expense = { ...expense, id: generateId(), date: new Date().toISOString(), createdAt: new Date().toISOString(), createdBy: state.user?.id };

    // Supabase Sync
    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;
        if (businessId) {
          const { error } = await (supabase.from('expenses') as any).insert({
            business_id: businessId,
            description: newExpense.description,
            amount: newExpense.amount,
            category: newExpense.category,
            notes: newExpense.notes
          } as any);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Supabase Expense Create Error:', err);
      }
    }

    setState(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
    logAudit({ action: 'EXPENSE_CREATE', entityType: 'expense', entityId: newExpense.id, description: `Gasto: $${expense.amount.toLocaleString('es-CO')} - ${expense.description}`, newValue: newExpense, severity: 'info' }, state.user);
    return { success: true, message: 'Gasto registrado exitosamente' };
  }, [state.user, logAudit, authUser]);

  const deleteExpense = useCallback(async (id: string, pin?: string): Promise<{ success: boolean; message: string }> => {
    if (pin && state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('expenses').delete().eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Delete Expense Error:', err);
      }
    }

    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    return { success: true, message: 'Gasto eliminado' };
  }, [state.user, authUser]);

  // ─── CUSTOMERS ───────────────────────────────────────────────────────────

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalSpent' | 'balance' | 'loyaltyPoints' | 'lifetimePoints' | 'tier' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    const newCustomer: Customer = { ...customer, id: generateId(), totalPurchases: 0, totalSpent: 0, balance: 0, loyaltyPoints: 0, lifetimePoints: 0, tier: 'bronze', createdAt: new Date().toISOString() };

    // Supabase Sync
    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;
        if (businessId) {
          const { error } = await (supabase.from('customers') as any).insert({
            business_id: businessId,
            name: newCustomer.name,
            email: newCustomer.email,
            phone: newCustomer.phone,
            address: newCustomer.address,
            notes: newCustomer.notes
          } as any);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Supabase Customer Create Error:', err);
      }
    }

    setState(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
    logAudit({ action: 'CUSTOMER_CREATE', entityType: 'customer', entityId: newCustomer.id, description: `Cliente registrado: ${customer.name}`, newValue: newCustomer, severity: 'info' }, state.user);
    return { success: true, message: 'Cliente registrado exitosamente' };
  }, [state.user, logAudit, authUser]);

  const updateCustomer = useCallback(async (id: string, customer: Partial<Customer>): Promise<{ success: boolean; message: string }> => {
    const existing = state.customers.find(c => c.id === id);
    if (!existing) return { success: false, message: 'Cliente no encontrado' };
    const updated = { ...existing, ...customer };

    if (authUser && id.length > 20) {
      try {
        await (supabase.from('customers').update({ name: updated.name, email: updated.email, phone: updated.phone } as any).eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Update Customer Error:', err);
      }
    }

    setState(prev => ({ ...prev, customers: prev.customers.map(c => c.id === id ? updated : c) }));
    return { success: true, message: 'Cliente actualizado' };
  }, [state.customers, authUser]);

  const deleteCustomer = useCallback(async (id: string, pin?: string): Promise<{ success: boolean; message: string }> => {
    if (pin && state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('customers').delete().eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Delete Customer Error:', err);
      }
    }

    setState(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
    return { success: true, message: 'Cliente eliminado' };
  }, [state.user, authUser]);

  const addLoyaltyPoints = useCallback(async (customerId: string, points: number, reason: string) => {
    setState(prev => ({
      ...prev,
      customers: prev.customers.map(c => {
        if (c.id !== customerId) return c;
        const newLifetime = c.lifetimePoints + points;
        return { ...c, loyaltyPoints: c.loyaltyPoints + points, lifetimePoints: newLifetime, tier: getCustomerTier(newLifetime) };
      }),
    }));

    // Supabase Sync
    if (authUser && customerId.length > 20) {
      try {
        const customer = state.customers.find(c => c.id === customerId);
        if (customer) {
          const newTotal = customer.loyaltyPoints + points;
          const newLifetime = customer.lifetimePoints + points;
          await (supabase.from('customers') as any).update({
            loyalty_points: newTotal,
            lifetime_points: newLifetime,
            tier: getCustomerTier(newLifetime)
          }).eq('id', customerId);
        }
      } catch (err) {
        console.error('Supabase Loyalty Add Error:', err);
      }
    }

    const customer = state.customers.find(c => c.id === customerId);
    if (customer) logAudit({ action: 'CUSTOMER_UPDATE', entityType: 'customer', entityId: customerId, description: `Puntos añadidos: ${points} a ${customer.name} - ${reason}`, severity: 'info' }, state.user);
  }, [state.user, state.customers, logAudit, authUser]);

  const redeemLoyaltyPoints = useCallback(async (customerId: string, points: number): Promise<{ success: boolean; message: string }> => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return { success: false, message: 'Cliente no encontrado' };
    if (customer.loyaltyPoints < points) return { success: false, message: 'Puntos insuficientes' };

    // Supabase Sync
    if (authUser && customerId.length > 20) {
      try {
        const { error } = await (supabase.from('customers') as any).update({
          loyalty_points: customer.loyaltyPoints - points
        }).eq('id', customerId);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase Loyalty Redeem Error:', err);
      }
    }

    setState(prev => ({ ...prev, customers: prev.customers.map(c => c.id === customerId ? { ...c, loyaltyPoints: c.loyaltyPoints - points } : c) }));
    logAudit({ action: 'CUSTOMER_UPDATE', entityType: 'customer', entityId: customerId, description: `Puntos canjeados: ${points} por ${customer.name}`, severity: 'info' }, state.user);
    return { success: true, message: `Se canjearon ${points} puntos exitosamente` };
  }, [state.user, state.customers, logAudit, authUser]);

  // ─── SUPPLIERS ───────────────────────────────────────────────────────────

  type NewSupplier = Omit<Supplier, 'id' | 'totalPurchases' | 'balance' | 'createdAt'>;

  const addSupplier = useCallback(async (supplier: NewSupplier): Promise<{ success: boolean; message: string }> => {
    const newSupplier: Supplier = { 
      ...supplier, 
      id: generateId(), 
      totalPurchases: 0, 
      balance: 0, 
      createdAt: new Date().toISOString() 
    };
    
    if (authUser) {
      try {
        const { data: profile } = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = profile?.business_id;
        if (businessId) {
          await (supabase.from('suppliers') as any).insert([{ 
            business_id: businessId, 
            name: newSupplier.name, 
            email: newSupplier.email, 
            phone: newSupplier.phone 
          }] as any);
        }
      } catch (err) {
        console.error('Supabase Supplier Error:', err);
      }
    }

    setState(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
    return { success: true, message: 'Proveedor registrado' };
  }, [authUser]);

  const updateSupplier = useCallback(async (id: string, supplier: Partial<Supplier>): Promise<{ success: boolean; message: string }> => {
    const existing = state.suppliers.find(s => s.id === id);
    if (!existing) return { success: false, message: 'Proveedor no encontrado' };

    if (authUser && id.length > 20) {
      try {
        await (supabase.from('suppliers').update({ name: supplier.name, email: supplier.email, phone: supplier.phone } as any).eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Update Supplier Error:', err);
      }
    }

    setState(prev => ({ ...prev, suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...supplier } : s) }));
    return { success: true, message: 'Proveedor actualizado' };
  }, [state.suppliers, authUser]);

  const deleteSupplier = useCallback(async (id: string, pin?: string): Promise<{ success: boolean; message: string }> => {
    if (pin && state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('suppliers').delete().eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Delete Supplier Error:', err);
      }
    }

    setState(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }));
    return { success: true, message: 'Proveedor eliminado' };
  }, [state.user, authUser]);

  // ─── INVOICES ────────────────────────────────────────────────────────────

  const addInvoice = useCallback(async (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdBy' | 'isEditable'>): Promise<{ success: boolean; message: string }> => {
    if (!state.user?.permissions.includes('invoices.create') && state.user?.role !== 'owner') return { success: false, message: 'Sin permiso para crear facturas' };
    
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const issueDate = new Date().toISOString().split('T')[0];
    
    let cufe: string | undefined;
    if (state.businessInfo?.nit) {
      cufe = generateCUFE({
        invoiceNumber,
        issueDate,
        total: invoice.total,
        nit: state.businessInfo.nit
      });
    }

    const newInvoice: Invoice = { 
      ...invoice, 
      id: generateId(), 
      invoiceNumber, 
      createdBy: state.user?.id || '', 
      isEditable: true,
      cufe,
      dianStatus: cufe ? 'pending' : undefined,
      taxRate: 19
    };

    // Supabase Sync
    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;
        if (businessId) {
          await (supabase.from('invoices') as any).insert({
            business_id: businessId,
            invoice_number: invoiceNumber,
            customer_id: invoice.customerId,
            total: invoice.total,
            status: invoice.status,
            due_date: invoice.dueDate,
            issue_date: issueDate,
            items: (invoice as any).items,
            cufe,
            dian_status: cufe ? 'pending' : null
          } as any);
        }
      } catch (err) {
        console.error('Supabase Invoice Sync Error:', err);
      }
    }
    
    setState(prev => ({ ...prev, invoices: [...prev.invoices, newInvoice] }));
    return { success: true, message: 'Factura generada exitosamente' };
  }, [state.user, state.businessInfo, authUser]);

  const markInvoiceAsPaid = useCallback(async (id: string, paymentMethod: 'cash' | 'card' | 'transfer'): Promise<{ success: boolean; message: string }> => {
    const invoice = state.invoices.find(i => i.id === id);
    if (!invoice) return { success: false, message: 'Factura no encontrada' };

    // Supabase Sync
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('invoices') as any).update({ 
          status: 'paid',
          payment_method: paymentMethod 
        }).eq('id', id);
      } catch (err) {
        console.error('Supabase Invoice Update Error:', err);
      }
    }

    setState(prev => ({ ...prev, invoices: prev.invoices.map(i => i.id === id ? { ...i, status: 'paid' } : i) }));
    return { success: true, message: 'Factura marcada como pagada' };
  }, [state.invoices, authUser]);

  const updateInvoice = useCallback(async (id: string, invoice: Partial<Invoice>): Promise<{ success: boolean; message: string }> => {
    // Supabase Sync
    if (authUser && id.length > 20) {
       try {
        await (supabase.from('invoices') as any).update({
          status: invoice.status,
          total: invoice.total,
          due_date: invoice.dueDate
        } as any).eq('id', id);
      } catch (err) {
        console.error('Supabase Invoice Update Error:', err);
      }
    }

    setState(prev => ({ ...prev, invoices: prev.invoices.map(i => i.id === id ? { ...i, ...invoice } : i) }));
    return { success: true, message: 'Factura actualizada exitosamente' };
  }, [authUser]);

  const deleteInvoice = useCallback(async (id: string, pin?: string): Promise<{ success: boolean; message: string }> => {
    if (state.user?.ownerPin !== (pin ?? '')) return { success: false, message: 'PIN incorrecto' };

    // Supabase Sync
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('invoices').delete().eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Invoice Delete Error:', err);
      }
    }

    setState(prev => ({ ...prev, invoices: prev.invoices.filter(i => i.id !== id) }));
    return { success: true, message: 'Factura eliminada' };
  }, [state.user, authUser]);

  // ─── STAFF ───────────────────────────────────────────────────────────────

  const addStaff = useCallback(async (staff: Omit<StaffMember, 'id' | 'createdAt' | 'createdBy'>, _pin?: string): Promise<{ success: boolean; message: string }> => {
    if (!state.user?.permissions.includes('staff.create') && state.user?.role !== 'owner') return { success: false, message: 'Sin permiso para crear personal' };
    const newId = generateId();
    
    // Supabase Sync
    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;
        if (businessId) {
          await (supabase.from('profiles') as any).insert({
            business_id: businessId,
            full_name: staff.name,
            email: staff.email,
            role: staff.role
          } as any);
        }
      } catch (err) {
        console.error('Supabase Staff Create Error:', err);
      }
    }

    const newStaff: StaffMember = { ...staff, id: newId, createdAt: new Date().toISOString(), createdBy: state.user?.id };
    setState(prev => ({ ...prev, staff: [...prev.staff, newStaff] }));
    logAudit({ action: 'STAFF_CREATE', entityType: 'staff', entityId: newStaff.id, description: `Personal creado: ${staff.name} - ${staff.role}`, newValue: newStaff, severity: 'info' }, state.user);
    return { success: true, message: 'Personal creado exitosamente' };
  }, [state.user, logAudit, authUser]);

  const updateStaff = useCallback(async (id: string, staff: Partial<StaffMember>, _pin?: string): Promise<{ success: boolean; message: string }> => {
    const existing = state.staff.find(s => s.id === id);
    if (!existing) return { success: false, message: 'Personal no encontrado' };

    // Supabase Sync
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('profiles') as any).update({
          full_name: staff.name,
          email: staff.email,
          role: staff.role
        } as any).eq('id', id);
      } catch (err) {
        console.error('Supabase Staff Update Error:', err);
      }
    }

    setState(prev => ({ ...prev, staff: prev.staff.map(s => s.id === id ? { ...s, ...staff } : s) }));
    logAudit({ action: 'STAFF_UPDATE', entityType: 'staff', entityId: id, description: `Personal actualizado: ${existing.name}`, oldValue: existing, severity: 'info' }, state.user);
    return { success: true, message: 'Personal actualizado exitosamente' };
  }, [state.user, state.staff, logAudit, authUser]);

  const deleteStaff = useCallback(async (id: string, pin: string): Promise<{ success: boolean; message: string }> => {
    if (state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    const staff = state.staff.find(s => s.id === id);
    if (!staff) return { success: false, message: 'Personal no encontrado' };

    // Supabase Sync
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('profiles').delete().eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Staff Delete Error:', err);
      }
    }

    setState(prev => ({ ...prev, staff: prev.staff.filter(s => s.id !== id) }));
    logAudit({ action: 'STAFF_DELETE', entityType: 'staff', entityId: id, description: `Personal eliminado: ${staff.name}`, oldValue: staff, severity: 'warning', requiresPin: true, pinVerified: true }, state.user);
    return { success: true, message: 'Personal eliminado exitosamente' };
  }, [state.user, state.staff, logAudit, authUser]);

  // ─── LOCATIONS ───────────────────────────────────────────────────────────

  const addLocation = useCallback(async (location: Omit<Location, 'id' | 'createdAt'>): Promise<{ success: boolean; message: string }> => {
    const newLocation: Location = { ...location, id: generateId(), createdAt: new Date().toISOString() };

    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;
        if (businessId) {
          await (supabase.from('locations') as any).insert({ business_id: businessId, name: location.name, address: location.address } as any);
        }
      } catch (err) {
        console.error('Supabase Location Error:', err);
      }
    }

    setState(prev => ({ ...prev, locations: [...prev.locations, newLocation] }));
    return { success: true, message: 'Ubicación añadida' };
  }, [authUser]);

  const updateLocation = useCallback(async (id: string, location: Partial<Location>): Promise<{ success: boolean; message: string }> => {
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('locations').update({ name: location.name, address: location.address } as any).eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Update Location Error:', err);
      }
    }
    setState(prev => ({ ...prev, locations: prev.locations.map(l => l.id === id ? { ...l, ...location } : l) }));
    return { success: true, message: 'Ubicación actualizada' };
  }, [authUser]);

  const deleteLocation = useCallback(async (id: string, pin?: string): Promise<{ success: boolean; message: string }> => {
    if (pin && state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('locations').delete().eq('id', id) as any);
      } catch (err) {
        console.error('Supabase Delete Location Error:', err);
      }
    }

    setState(prev => ({ ...prev, locations: prev.locations.filter(l => l.id !== id) }));
    return { success: true, message: 'Ubicación eliminada' };
  }, [state.user, authUser]);

  const setCurrentLocation = useCallback((loc: Location | null) => {
    setState(prev => ({ ...prev, currentLocation: loc }));
  }, []);

  // ─── PROMOTIONS ──────────────────────────────────────────────────────────

  const addPromotion = useCallback(async (promotion: Omit<Promotion, 'id' | 'usageCount' | 'createdBy'>, _pin?: string): Promise<{ success: boolean; message: string }> => {
    const newId = generateId();

    // Supabase Sync
    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;
        if (businessId) {
          await (supabase.from('promotions') as any).insert([{
            business_id: businessId,
            name: promotion.name,
            code: promotion.code,
            type: promotion.type,
            value: promotion.value,
            start_date: promotion.startDate,
            end_date: promotion.endDate,
            is_active: promotion.isActive,
            min_purchase: promotion.minPurchase
          }] as any);
        }
      } catch (err) {
        console.error('Supabase Promo Create Error:', err);
      }
    }

    const newPromotion: Promotion = { ...promotion, id: newId, usageCount: 0, createdBy: state.user?.id };
    setState(prev => ({ ...prev, promotions: [...prev.promotions, newPromotion] }));
    logAudit({ action: 'PROMOTION_CREATE', entityType: 'promotion', entityId: newPromotion.id, description: `Promoción creada: ${promotion.name} - ${promotion.code}`, newValue: newPromotion, severity: 'info' }, state.user);
    return { success: true, message: 'Promoción creada exitosamente' };
  }, [state.user, logAudit, authUser]);

  const updatePromotion = useCallback(async (id: string, promotion: Partial<Promotion>, _pin?: string): Promise<{ success: boolean; message: string }> => {
    const existing = state.promotions.find(p => p.id === id);
    if (!existing) return { success: false, message: 'Promoción no encontrada' };

    // Supabase Sync
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('promotions').update({
          name: promotion.name,
          code: promotion.code,
          type: promotion.type,
          value: promotion.value,
          start_date: promotion.startDate,
          end_date: promotion.endDate,
          is_active: promotion.isActive,
          min_purchase: promotion.minPurchase
        } as any).eq('id', id));
      } catch (err) {
        console.error('Supabase Promo Update Error:', err);
      }
    }

    setState(prev => ({ ...prev, promotions: prev.promotions.map(p => p.id === id ? { ...p, ...promotion } : p) }));
    logAudit({ action: 'PROMOTION_UPDATE', entityType: 'promotion', entityId: id, description: `Promoción actualizada: ${existing.name}`, oldValue: existing, severity: 'info' }, state.user);
    return { success: true, message: 'Promoción actualizada exitosamente' };
  }, [state.user, state.promotions, logAudit, authUser]);

  const deletePromotion = useCallback(async (id: string, pin: string): Promise<{ success: boolean; message: string }> => {
    if (state.user?.ownerPin !== pin) return { success: false, message: 'PIN incorrecto' };
    const promotion = state.promotions.find(p => p.id === id);
    if (!promotion) return { success: false, message: 'Promoción no encontrada' };

    // Supabase Sync
    if (authUser && id.length > 20) {
      try {
        await (supabase.from('promotions') as any).delete().eq('id', id);
      } catch (err) {
        console.error('Supabase Promo Delete Error:', err);
      }
    }

    setState(prev => ({ ...prev, promotions: prev.promotions.filter(p => p.id !== id) }));
    logAudit({ action: 'PROMOTION_DELETE', entityType: 'promotion', entityId: id, description: `Promoción eliminada: ${promotion.name}`, oldValue: promotion, severity: 'warning', requiresPin: true, pinVerified: true }, state.user);
    return { success: true, message: 'Promoción eliminada exitosamente' };
  }, [state.user, state.promotions, logAudit, authUser]);

  const validatePromoCode = useCallback((code: string, cartTotal: number, _items: { productId: string; category: string }[]): { valid: boolean; promotion?: Promotion; discountAmount: number; message: string; requiresPin?: boolean } => {
    const promotion = state.promotions.find(p => p.code.toLowerCase() === code.toLowerCase() && p.isActive && new Date(p.endDate) > new Date() && new Date(p.startDate) <= new Date());
    if (!promotion) return { valid: false, discountAmount: 0, message: 'Código no válido o expirado' };
    if (promotion.minPurchase && cartTotal < promotion.minPurchase) return { valid: false, discountAmount: 0, message: `Compra mínima: $${promotion.minPurchase.toLocaleString()}` };
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) return { valid: false, discountAmount: 0, message: 'Código agotado' };
    let discountAmount = promotion.type === 'percentage' ? cartTotal * (promotion.value / 100) : promotion.value;
    if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) discountAmount = promotion.maxDiscount;
    return { valid: true, promotion, discountAmount, message: `Descuento: $${discountAmount.toLocaleString()}`, requiresPin: promotion.requiresPin };
  }, [state.promotions]);

  // ─── APPOINTMENTS ────────────────────────────────────────────────────────

  const addAppointment = useCallback((appointment: Omit<Appointment, 'id'>) => {
    setState(prev => ({ ...prev, appointments: [...prev.appointments, { ...appointment, id: generateId() }] }));
    return { success: true, message: 'Cita agendada' };
  }, []);

  const updateAppointment = useCallback((id: string, appointment: Partial<Appointment>) => {
    setState(prev => ({ ...prev, appointments: prev.appointments.map(a => a.id === id ? { ...a, ...appointment } : a) }));
    return { success: true, message: 'Cita actualizada' };
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setState(prev => ({ ...prev, appointments: prev.appointments.filter(a => a.id !== id) }));
    return { success: true, message: 'Cita eliminada' };
  }, []);

  const updateBusinessInfo = useCallback(async (info: BusinessInfo) => {
    // Supabase Sync
    if (authUser) {
      try {
        const response = await (supabase.from('profiles').select('business_id').eq('id', authUser.id).single() as any);
        const businessId = response.data?.business_id;
        if (businessId) {
          await (supabase.from('businesses').update({
            legal_name: info.legalName,
            nit: info.nit,
            verification_digit: info.verificationDigit,
            address: info.address,
            city: info.city,
            department: info.department,
            phone: info.phone,
            email: info.email,
            regimen: info.regimen,
            resolution_number: info.resolutionNumber,
            prefix: info.prefix
          } as any).eq('id', businessId) as any);
        }
      } catch (err) {
        console.error('Supabase Business Update Error:', err);
      }
    }

    setState(prev => ({ ...prev, businessInfo: info }));
    logAudit({ action: 'SETTINGS_UPDATE', entityType: 'settings', description: 'Información fiscal del negocio actualizada', newValue: info, severity: 'info' }, state.user);
  }, [state.user, logAudit, authUser]);

  // ─── AUDIT & SECURITY ────────────────────────────────────────────────────

  const getAuditLogs = useCallback(() => state.auditLogs, [state.auditLogs]);
  const getSecurityAlerts = useCallback(() => state.securityAlerts, [state.securityAlerts]);
  const markAlertAsRead = useCallback((alertId: string) => {
    setState(prev => ({ ...prev, securityAlerts: prev.securityAlerts.map(a => a.id === alertId ? { ...a, isRead: true } : a) }));
  }, []);
  const clearAllAlerts = useCallback((pin: string) => {
    if (state.user?.ownerPin === pin) {
      setState(prev => ({ ...prev, securityAlerts: [] }));
      return { success: true, message: 'Alertas limpiadas' };
    }
    return { success: false, message: 'PIN incorrecto' };
  }, [state.user]);

  // ─── DASHBOARD STATS ─────────────────────────────────────────────────────

  const getDashboardStats = useCallback((locationId?: string): DashboardStats => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const filteredSales = state.sales.filter(s => !s.isReversed && (locationId ? s.locationId === locationId : true));
    const recentSales = filteredSales.filter(s => new Date(s.date) >= thirtyDaysAgo);
    
    const totalSales = recentSales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = state.expenses.filter(e => new Date(e.date) >= thirtyDaysAgo).reduce((sum, e) => sum + e.amount, 0);
    
    return {
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      totalProducts: state.products.length,
      lowStockProducts: state.products.filter(p => p.stock <= p.minStock),
      recentSales: filteredSales.slice(0, 5),
      monthlySales: [],
      pendingInvoices: state.invoices.filter(i => i.status !== 'paid').length,
      overdueInvoices: 0,
      totalCustomers: state.customers.length,
      loyaltyPointsIssued: state.customers.reduce((sum, c) => sum + c.lifetimePoints, 0),
      topProducts: [],
      securityAlertsCount: state.securityAlerts.filter(a => !a.isRead).length,
      unreversedSales: filteredSales.length
    };
  }, [state.sales, state.expenses, state.products, state.invoices, state.customers, state.securityAlerts]);

  const uploadFile = useCallback(async (bucket: string, path: string, file: File) => {
    if (!authUser) return { publicUrl: null, error: 'No auth' };
    const filePath = `${authUser.id}/${path}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) return { publicUrl: null, error };
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { publicUrl: data.publicUrl, error: null };
  }, [authUser]);

  return (
    <AppContext.Provider value={{
      ...state,
      login, register, logout,
      verifyOwnerPin, hasPermission, requirePinForAction,
      addProduct, updateProduct, deleteProduct,
      addSale, reverseSale, deleteSale,
      addExpense, deleteExpense,
      addCustomer, updateCustomer, deleteCustomer, addLoyaltyPoints, redeemLoyaltyPoints,
      addSupplier, updateSupplier, deleteSupplier,
      addInvoice, markInvoiceAsPaid, updateInvoice, deleteInvoice,
      addStaff, updateStaff, deleteStaff,
      addLocation, updateLocation, deleteLocation, setCurrentLocation,
      addPromotion, updatePromotion, deletePromotion, validatePromoCode,
      addAppointment, updateAppointment, deleteAppointment,
      getAuditLogs, getSecurityAlerts, markAlertAsRead, clearAllAlerts,
      updateBusinessInfo,
      getDashboardStats,
      getProductByBarcode, generateBarcode,
      uploadFile,
      isSyncing,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
}
