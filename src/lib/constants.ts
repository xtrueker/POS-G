import type { Permission, UserRole, Product, Customer, Promotion, Location } from '@/types';

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEY = 'posgAppState';
export const USERS_KEY = 'posgUsers';
export const LOYALTY_POINTS_PER_CURRENCY = 1000; // 1 punto por cada $1000

// ============================================
// ROLE PERMISSIONS
// ============================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'sales.view', 'sales.create', 'sales.reverse', 'sales.delete',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
    'reports.view', 'reports.export',
    'promotions.view', 'promotions.create', 'promotions.edit', 'promotions.delete',
    'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'audit.view', 'settings.view', 'settings.edit',
  ],
  admin: [
    'sales.view', 'sales.create', 'sales.reverse',
    'inventory.view', 'inventory.create', 'inventory.edit',
    'customers.view', 'customers.create', 'customers.edit',
    'invoices.view', 'invoices.create', 'invoices.edit',
    'expenses.view', 'expenses.create', 'expenses.edit',
    'reports.view', 'reports.export',
    'promotions.view', 'promotions.create', 'promotions.edit',
    'staff.view', 'staff.create', 'staff.edit',
    'locations.view', 'locations.create', 'locations.edit',
    'audit.view', 'settings.view',
  ],
  supervisor: [
    'sales.view', 'sales.create', 'sales.reverse',
    'inventory.view', 'inventory.create', 'inventory.edit',
    'customers.view', 'customers.create', 'customers.edit',
    'invoices.view', 'invoices.create',
    'expenses.view', 'expenses.create',
    'reports.view',
    'promotions.view', 'promotions.create',
    'staff.view',
  ],
  cashier: [
    'sales.view', 'sales.create',
    'inventory.view',
    'customers.view', 'customers.create',
    'invoices.view', 'invoices.create',
  ],
  superadmin: [
    'sales.view', 'sales.create', 'sales.reverse', 'sales.delete',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete',
    'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
    'reports.view', 'reports.export',
    'promotions.view', 'promotions.create', 'promotions.edit', 'promotions.delete',
    'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
    'locations.view', 'locations.create', 'locations.edit', 'locations.delete',
    'audit.view', 'settings.view', 'settings.edit',
  ],
};

// ============================================
// SAMPLE / DEMO DATA
// ============================================

export const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Pan Artesanal', description: 'Pan recién horneado', price: 3500, cost: 1500, stock: 50, category: 'Panadería', minStock: 10, barcode: '712345678901', sku: 'PA-001', unit: 'unidad', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'Croissant', description: 'Croissant de mantequilla', price: 4500, cost: 2000, stock: 30, category: 'Panadería', minStock: 5, barcode: '712345678902', sku: 'CR-001', unit: 'unidad', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'Café Americano', description: 'Café 100% arábica', price: 5500, cost: 1500, stock: 100, category: 'Bebidas', minStock: 20, barcode: '712345678903', sku: 'CA-001', unit: 'taza', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', name: 'Galletas de Chocolate', description: 'Pack de 6 galletas', price: 8900, cost: 4000, stock: 8, category: 'Repostería', minStock: 10, barcode: '712345678904', sku: 'GC-001', unit: 'pack', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const SAMPLE_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Juan Pérez', email: 'juan@email.com', phone: '3001234567', totalPurchases: 3, totalSpent: 45000, balance: 0, loyaltyPoints: 150, lifetimePoints: 450, tier: 'silver', createdAt: new Date().toISOString() },
  { id: '2', name: 'María García', email: 'maria@email.com', phone: '3109876543', totalPurchases: 5, totalSpent: 125000, balance: 25000, loyaltyPoints: 320, lifetimePoints: 1250, tier: 'gold', createdAt: new Date().toISOString() },
  { id: '3', name: 'Carlos López', email: 'carlos@email.com', phone: '3204567890', totalPurchases: 1, totalSpent: 8000, balance: 0, loyaltyPoints: 50, lifetimePoints: 80, tier: 'bronze', createdAt: new Date().toISOString() },
];

export const SAMPLE_PROMOTIONS: Promotion[] = [
  { id: '1', name: 'Descuento de Bienvenida', type: 'percentage', value: 10, minPurchase: 50000, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000 * 30).toISOString(), isActive: true, code: 'BIENVENIDO', usageLimit: 100, usageCount: 15, requiresPin: false },
  { id: '2', name: 'Descuento Especial 20%', type: 'percentage', value: 20, minPurchase: 100000, maxDiscount: 50000, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000 * 7).toISOString(), isActive: true, code: 'ESPECIAL20', usageCount: 5, requiresPin: true },
  { id: '3', name: 'Descuento Fijo', type: 'fixed', value: 5000, minPurchase: 30000, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000 * 14).toISOString(), isActive: true, code: 'DESC5000', usageCount: 8, requiresPin: false },
];

export const SAMPLE_LOCATIONS: Location[] = [
  { id: '1', name: 'Sede Principal', address: 'Calle Principal 123, Bogotá', phone: '6012345678', isActive: true, createdAt: new Date().toISOString() },
  { id: '2', name: 'Sucursal Norte', address: 'Av. Norte 456, Bogotá', phone: '6012345679', isActive: true, createdAt: new Date().toISOString() },
];

// ============================================
// TIER THRESHOLDS
// ============================================

export const TIER_THRESHOLDS = {
  platinum: 5000,
  gold: 2500,
  silver: 1000,
  bronze: 0,
} as const;

// ============================================
// VERTICAL SPECIFIC SERVICES
// ============================================

export const VERTICAL_SERVICES: Record<string, string[]> = {
  general: [
    'Consulta de Negocio',
    'Revisión de Inventario',
    'Capacitación',
    'Soporte Técnico',
    'Demostración',
    'Otro',
  ],
  bakery: [
    'Asesoría en Panadería',
    'Taller de Repostería',
    'Degustación de Productos',
    'Pedido Especial Evento',
  ],
  retail: [
    'Asesoría de Compra',
    'Devolución/Garantía',
    'Pedido por Encargo',
  ],
  gastronomy: [
    'Reserva de Mesa',
    'Evento Privado',
    'Catering',
  ],
  beauty: [
    'Corte de Cabello',
    'Barba / Afeitado',
    'Manicura',
    'Pedicura',
    'Tintura / Coloración',
    'Tratamiento Facial',
    'Masaje Relajante',
    'Maquillaje Profesional',
  ],
};
