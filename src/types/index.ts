// ============================================
// CORE TYPES — POS-G
// ============================================

export type UserRole = 'superadmin' | 'owner' | 'admin' | 'supervisor' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  businessName: string;
  plan: 'free' | 'essential' | 'pro' | 'enterprise';
  role: UserRole;
  permissions: Permission[];
  ownerPin?: string;
  lastLogin?: string;
  loginAttempts: number;
  isLocked: boolean;
  createdAt: string;
}

export type Permission =
  | 'sales.view' | 'sales.create' | 'sales.reverse' | 'sales.delete'
  | 'inventory.view' | 'inventory.create' | 'inventory.edit' | 'inventory.delete'
  | 'customers.view' | 'customers.create' | 'customers.edit' | 'customers.delete'
  | 'invoices.view' | 'invoices.create' | 'invoices.edit' | 'invoices.delete'
  | 'expenses.view' | 'expenses.create' | 'expenses.edit' | 'expenses.delete'
  | 'suppliers.view' | 'suppliers.create' | 'suppliers.edit' | 'suppliers.delete'
  | 'reports.view' | 'reports.export'
  | 'promotions.view' | 'promotions.create' | 'promotions.edit' | 'promotions.delete'
  | 'staff.view' | 'staff.create' | 'staff.edit' | 'staff.delete'
  | 'locations.view' | 'locations.create' | 'locations.edit' | 'locations.delete'
  | 'audit.view' | 'settings.view' | 'settings.edit';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  minStock: number;
  barcode?: string;
  sku?: string;
  imageUrl?: string;
  locationId?: string;
  isIngredient?: boolean; // MATERIA PRIMA (Harina, Azúcar, etc.)
  isCombo?: boolean;      // COMBO/PACK (Promociones armadas)
  comboItems?: {          // Ítems que componen el combo
    productId: string;
    quantity: number;
  }[];
  unit: string;           // Unidad de medida (Kg, L, pack, etc.)
  isService?: boolean;    // Si es un servicio (no maneja inventario físico)
  duration?: number;      // Duración estimada en minutos (para industria belleza)
  usageType?: 'retail' | 'professional'; // Tipo de uso: Venta o Insumo
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
  originalPrice?: number;
  staffId?: string;      // Profesional que realizó el servicio (para comisiones)
  staffName?: string;    // Nombre del profesional
}

export interface SalePaymentLine {
  method: 'cash' | 'card' | 'transfer' | 'qr' | 'other';
  amount: number;
  reference?: string;
}

export interface Sale {
  id: string;
  products: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  total: number;
  customerId?: string;
  customerName?: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'split'; // 'split' si hay múltiples
  paymentLines: SalePaymentLine[]; // SOPORTE MULTICOBRO
  date: string;
  notes?: string;
  locationId?: string;
  staffId?: string;
  staffName?: string;
  isOffline?: boolean;
  isReversed?: boolean;
  reversedAt?: string;
  reversedBy?: string;
  reversedById?: string;
  reversalReason?: string;
  reversalPinVerified?: boolean;
  deviceInfo?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  locationId?: string;
  staffId?: string;
  staffName?: string;
  createdBy?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalPurchases: number;
  totalSpent: number;
  balance: number;
  loyaltyPoints: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  birthdate?: string;
  notes?: string;
  technicalNotes?: string; // Ficha Técnica de Belleza (Fórmulas, Alergias, etc.)
  hairHistory?: string;    // Historial de químicos, tintes, etc.
  allergies?: string;      // Registro de contraindicaciones
  preferences?: string[];
  tags?: string[];
  lastPurchaseDate?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalPurchases: number;
  balance: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: {
    productId: string;
    name: string;
    description?: string;
    quantity: number;
    price: number;
    cost: number;
    total: number;
  }[];
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  notes?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'split';
  paidDate?: string;
  createdBy?: string;
  isEditable: boolean;
  saleId?: string;
  // DIAN Colombia Fields
  cufe?: string;
  dianStatus?: 'pending' | 'accepted' | 'rejected';
  qrCode?: string;
  taxRate?: number; // e.g., 19
}

export interface BusinessInfo {
  id?: string;
  nit: string;
  verificationDigit: number;
  legalName: string;
  address: string;
  city: string;
  department: string;
  phone: string;
  email: string;
  regimen: 'simplificado' | 'comun';
  ciiu?: string;
  resolutionNumber?: string;
  resolutionDate?: string;
  prefix?: string;
  rangeFrom?: number;
  rangeTo?: number;
  vertical?: string;
  settings?: {
    payment_info?: string;
    enable_loyalty?: boolean;
    enable_bakery?: boolean;
    notifications?: {
      low_stock?: boolean;
      security?: boolean;
      weekly_report?: boolean;
    };
    checklists?: {
      apertura?: string[];
      cierre?: string[];
    };
    beauty?: {
      defaultDuration?: number;
      globalCommission?: number;
      categories?: string[];
      bufferTime?: number;
    },
    loyalty?: {
      enabled: boolean;
      moneyToPointsRatio: number; // e.g. 1000
      pointsName?: string;        // e.g. "Estrellas"
    }
  };
  subscriptionEndDate?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled';
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions: Permission[];
  pin: string;
  isActive: boolean;
  commissionRate?: number;
  locationId?: string;
  lastLogin?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Recipe {
  id: string;
  businessId: string;
  finalProductId: string;
  yieldQuantity: number;
  ingredients: {
    ingredientProductId: string;
    quantityRequired: number;
  }[];
  notes?: string;
  createdAt: string;
}

export interface ProductionLog {
  id: string;
  recipeId: string;
  batches: number;
  locationId: string;
  staffId: string;
  date: string;
  notes?: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
  code: string;
  usageLimit?: number;
  usageCount: number;
  requiresPin: boolean;
  createdBy?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  service: string;
  staffId?: string;
  staffName?: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  price?: number;
  productId?: string;
}

// ============================================
// AUDIT LOG SYSTEM
// ============================================

export type AuditAction =
  | 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE'
  | 'SALE_CREATE' | 'SALE_REVERSE' | 'SALE_DELETE'
  | 'INVENTORY_CREATE' | 'INVENTORY_UPDATE' | 'INVENTORY_DELETE'
  | 'CUSTOMER_CREATE' | 'CUSTOMER_UPDATE' | 'CUSTOMER_DELETE'
  | 'INVOICE_CREATE' | 'INVOICE_UPDATE' | 'INVOICE_DELETE' | 'INVOICE_PAY'
  | 'EXPENSE_CREATE' | 'EXPENSE_UPDATE' | 'EXPENSE_DELETE'
  | 'PROMOTION_CREATE' | 'PROMOTION_APPLY' | 'PROMOTION_UPDATE' | 'PROMOTION_DELETE'
  | 'STAFF_CREATE' | 'STAFF_UPDATE' | 'STAFF_DELETE'
  | 'LOCATION_CHANGE' | 'SETTINGS_UPDATE' | 'REPORT_EXPORT'
  | 'SECURITY_ALERT' | 'ANOMALY_DETECTED'
  | 'PRODUCTION_CREATE' | 'WASTE_CREATE';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  deviceInfo?: string;
  locationId?: string;
  severity: 'info' | 'warning' | 'critical';
  requiresPin?: boolean;
  pinVerified?: boolean;
}

// ============================================
// SECURITY ALERTS
// ============================================

export interface SecurityAlert {
  id: string;
  timestamp: string;
  type:
    | 'low_stock'
    | 'suspicious_sale'
    | 'excessive_discount'
    | 'frequent_reversal'
    | 'unauthorized_access'
    | 'login_failed'
    | 'inventory_anomaly'
    | 'pin_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  userName?: string;
  isRead: boolean;
  actionTaken?: string;
}

// ============================================
// CASH REGISTERS (ARQUEOS)
// ============================================

export interface CashRegister {
  id: string;
  businessId: string;
  locationId: string;
  openedBy: string;
  openedAt: string;
  closedAt?: string;
  initialAmount: number;
  expectedAmount: number;
  actualAmount?: number;
  difference?: number;
  notes?: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// ============================================
// APP STATE
// ============================================

export interface AppState {
  user: User | null;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  staff: StaffMember[];
  locations: Location[];
  promotions: Promotion[];
  appointments: Appointment[];
  auditLogs: AuditLog[];
  securityAlerts: SecurityAlert[];
  offlineTransactions: unknown[];
  currentLocation: Location | null;
  businessInfo: BusinessInfo | null;
  isAuthenticated: boolean;
  isOffline: boolean;
  sessionStartTime?: string;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  totalProducts: number;
  lowStockProducts: Product[];
  recentSales: Sale[];
  monthlySales: { month: string; sales: number; expenses: number; profit: number }[];
  pendingInvoices: number;
  overdueInvoices: number;
  totalCustomers: number;
  loyaltyPointsIssued: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  securityAlertsCount: number;
  unreversedSales: number;
}
