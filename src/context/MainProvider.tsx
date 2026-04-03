import { type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './AuthContext';
import { AppProvider } from './AppContext';
import { InventoryProvider } from './InventoryContext';
import { CustomerProvider } from './CustomerContext';
import { SalesProvider } from './SalesContext';
import { InvoiceProvider } from './InvoiceContext';
import { StaffProvider } from './StaffContext';
import { LocationProvider } from './LocationContext';
import { PromotionProvider } from './PromotionContext';
import { BusinessProvider } from './BusinessContext';
import { SecurityProvider } from './SecurityContext';
import { SupplierProvider } from './SupplierContext';
import { ExpenseProvider } from './ExpenseContext';
import { AppointmentProvider } from './AppointmentContext';
import { CashProvider } from './CashContext';

/**
 * MainProvider — Hierarchical Dependency Injection Tree
 */
export function MainProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AppProvider>
          <BusinessProvider>
            <InventoryProvider>
              <SupplierProvider>
                <ExpenseProvider>
                  <CustomerProvider>
                    <LocationProvider>
                      <PromotionProvider>
                        <SecurityProvider>
                          <AppointmentProvider>
                            <InvoiceProvider>
                              <SalesProvider>
                                <StaffProvider>
                                  <CashProvider>
                                    {children}
                                  </CashProvider>
                                </StaffProvider>
                              </SalesProvider>
                            </InvoiceProvider>
                          </AppointmentProvider>
                        </SecurityProvider>
                      </PromotionProvider>
                    </LocationProvider>
                  </CustomerProvider>
                </ExpenseProvider>
              </SupplierProvider>
            </InventoryProvider>
          </BusinessProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
