import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { MainProvider } from './context/MainProvider';
import { useAuth } from './context/AuthContext';
import LazyFallback from './components/common/LazyFallback';
import { Toaster } from 'sonner';

// Landing page sections
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import Categories from './sections/Categories';
import Sectors from './sections/Sectors';
import Pricing from './sections/Pricing';
import Integrations from './sections/Integrations';
import Testimonials from './sections/Testimonials';
import FAQ from './sections/FAQ';
import Blog from './sections/Blog';
import Footer from './sections/Footer';

// Auth pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Dashboard pages
const DashboardLayout = lazy(() => import('./pages/dashboard/Layout'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Ventas = lazy(() => import('./pages/dashboard/Ventas'));
const Facturas = lazy(() => import('./pages/dashboard/Facturas'));
const Gastos = lazy(() => import('./pages/dashboard/Gastos'));
const Inventario = lazy(() => import('./pages/dashboard/Inventario'));
const Clientes = lazy(() => import('./pages/dashboard/Clientes'));
const Proveedores = lazy(() => import('./pages/dashboard/Proveedores'));
const Reportes = lazy(() => import('./pages/dashboard/Reportes'));
const Configuracion = lazy(() => import('./pages/dashboard/Configuracion'));

// New Premium Features
const Personal = lazy(() => import('./pages/dashboard/Personal'));
const Ubicaciones = lazy(() => import('./pages/dashboard/Ubicaciones'));
const Promociones = lazy(() => import('./pages/dashboard/Promociones'));
const Citas = lazy(() => import('./pages/dashboard/Citas'));
const BarcodeScanner = lazy(() => import('./pages/dashboard/BarcodeScanner'));
const Auditoria = lazy(() => import('./pages/dashboard/Auditoria'));
const Fidelizacion = lazy(() => import('./pages/dashboard/Fidelizacion'));
const Recetas = lazy(() => import('./pages/dashboard/Recetas'));
const Produccion = lazy(() => import('./pages/dashboard/Produccion'));
const Insumos = lazy(() => import('./pages/dashboard/Insumos'));
const Checklists = lazy(() => import('./pages/dashboard/Checklists'));

// SuperAdmin Console
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <LazyFallback />;
  return session ? <>{children}</> : <Navigate to="/login" />;
}

// Public Route - redirect to dashboard if authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, user } = useAuth();
  if (loading) return <LazyFallback />;
  
  if (session) {
    const role = (user as any)?.user_metadata?.role;
    if (role === 'superadmin') return <Navigate to="/sadmin" />;
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}

// SuperAdmin Route Guarantee
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, user } = useAuth();
  if (loading) return <LazyFallback />;
  
  const role = (user as any)?.user_metadata?.role;
  if (!session || role !== 'superadmin') {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
}

// Landing Page
function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <Sectors />
        <Pricing />
        <Integrations />
        <Testimonials />
        <FAQ />
        <Blog />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <MainProvider>
      <BrowserRouter>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* SuperAdmin Master Console Route */}
            <Route path="/sadmin" element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            } />

            {/* Protected dashboard routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="ventas" element={<Ventas />} />
              <Route path="facturas" element={<Facturas />} />
              <Route path="gastos" element={<Gastos />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="proveedores" element={<Proveedores />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="configuracion" element={<Configuracion />} />
              {/* New Premium Routes */}
              <Route path="personal" element={<Personal />} />
              <Route path="ubicaciones" element={<Ubicaciones />} />
              <Route path="promociones" element={<Promociones />} />
              <Route path="citas" element={<Citas />} />
              <Route path="escaner" element={<BarcodeScanner />} />
              <Route path="auditoria" element={<Auditoria />} />
              <Route path="fidelizacion" element={<Fidelizacion />} />
              <Route path="recetas" element={<Recetas />} />
              <Route path="produccion" element={<Produccion />} />
              <Route path="insumos" element={<Insumos />} />
              <Route path="checklists" element={<Checklists />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </Suspense>
      </BrowserRouter>
    </MainProvider>
  );
}

export default App;
