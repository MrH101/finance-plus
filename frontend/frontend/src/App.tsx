import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './context/AuthContext';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';
import StoresManagement from './components/StoresManagement';

// Pages
import Login from './pages/Login';
import EmployerSignup from './pages/EmployerSignup';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import GeneralLedger from './pages/GeneralLedger';
import HRM from './pages/HRM';
import Payroll from './pages/Payroll';
import Inventory from './pages/Inventory';
import Services from './pages/Services';
import POS from './pages/POS';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import Analytics from './pages/Analytics';
import DocumentTemplates from './pages/DocumentTemplates';
import Letters from './pages/Letters';
import GeneratedDocuments from './pages/GeneratedDocuments';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import CurrencySettings from './pages/CurrencySettings';
import MobileMoney from './pages/MobileMoney';
import ZIMRACompliance from './pages/ZIMRACompliance';
import FiscalisationInvoices from './pages/FiscalisationInvoices';
import AccountsReceivable from './pages/AccountsReceivable';
import AccountsPayable from './pages/AccountsPayable';
import Banking from './pages/Banking';
import Procurement from './pages/Procurement';
import Manufacturing from './pages/Manufacturing';
import VendorManagement from './pages/VendorManagement';
import LeadManagement from './pages/LeadManagement';
import FixedAssetRegister from './pages/FixedAssetRegister';
import PurchaseOrderManagement from './pages/PurchaseOrderManagement';
import LeaveManagement from './pages/LeaveManagement';
import OpportunityPipeline from './pages/OpportunityPipeline';
import BudgetManagement from './pages/BudgetManagement';
import DocumentManagement from './pages/DocumentManagement';
import AttendanceTracking from './pages/AttendanceTracking';
import QuotationManagement from './pages/QuotationManagement';
import MobileMoneyPayments from './pages/MobileMoneyPayments';
import CashTill from './pages/CashTill';

// Private Route Component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main Layout Component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <div className="w-64 h-screen sticky top-0">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
                  </div>
  );
};

// Auth Layout Component (for login/signup)
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen h-screen w-screen flex items-center justify-center p-0 m-0">
      {children}
                    </div>
  );
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
                        <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthLayout>
            <EmployerSignup />
          </AuthLayout>
        }
      />
                          
                          {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <MainLayout>
              <Users />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings/currencies"
        element={
          <PrivateRoute>
            <MainLayout>
              <CurrencySettings />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <PrivateRoute>
            <MainLayout>
              <Transactions />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <PrivateRoute>
            <MainLayout>
              <Budgets />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/general-ledger"
        element={
          <PrivateRoute>
            <MainLayout>
              <GeneralLedger />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/hrm"
        element={
          <PrivateRoute>
            <MainLayout>
              <HRM />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <PrivateRoute>
            <MainLayout>
              <Payroll />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <PrivateRoute>
            <MainLayout>
              <Inventory />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/services"
        element={
          <PrivateRoute>
            <MainLayout>
              <Services />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/pos"
        element={
          <PrivateRoute>
            <MainLayout>
              <POS />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <PrivateRoute>
            <MainLayout>
              <Projects />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/crm"
        element={
          <PrivateRoute>
            <MainLayout>
              <CRM />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <MainLayout>
              <Analytics />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/document-templates"
        element={
          <PrivateRoute>
            <MainLayout>
              <DocumentTemplates />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/letters"
        element={
          <PrivateRoute>
            <MainLayout>
              <Letters />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/generated-documents"
        element={
          <PrivateRoute>
            <MainLayout>
              <GeneratedDocuments />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <PrivateRoute>
            <MainLayout>
              <AuditLogs />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <MainLayout>
              <Reports />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/finance/mobile-money"
        element={
          <PrivateRoute>
            <MainLayout>
              <MobileMoney />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/compliance/zimra"
        element={
          <PrivateRoute>
            <MainLayout>
              <ZIMRACompliance />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/sales/fiscalisation-invoices"
        element={
          <PrivateRoute>
            <MainLayout>
              <FiscalisationInvoices />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/ar"
        element={
          <PrivateRoute>
            <MainLayout>
              <AccountsReceivable />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/ap"
        element={
          <PrivateRoute>
            <MainLayout>
              <AccountsPayable />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/banking"
        element={
          <PrivateRoute>
            <MainLayout>
              <Banking />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/procurement"
        element={
          <PrivateRoute>
            <MainLayout>
              <Procurement />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/manufacturing"
        element={
          <PrivateRoute>
            <MainLayout>
              <Manufacturing />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/stores"
        element={
          <PrivateRoute>
            <MainLayout>
              <StoresManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />

      {/* Extended ERP Routes */}
      <Route
        path="/supply-chain/vendors"
        element={
          <PrivateRoute>
            <MainLayout>
              <VendorManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/supply-chain/purchase-orders"
        element={
          <PrivateRoute>
            <MainLayout>
              <PurchaseOrderManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/crm/leads"
        element={
          <PrivateRoute>
            <MainLayout>
              <LeadManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/crm/opportunities"
        element={
          <PrivateRoute>
            <MainLayout>
              <OpportunityPipeline />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/sales/quotations"
        element={
          <PrivateRoute>
            <MainLayout>
              <QuotationManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/finance/fixed-assets"
        element={
          <PrivateRoute>
            <MainLayout>
              <FixedAssetRegister />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/finance/budget-management"
        element={
          <PrivateRoute>
            <MainLayout>
              <BudgetManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/finance/mobile-money-payments"
        element={
          <PrivateRoute>
            <MainLayout>
              <MobileMoneyPayments />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/finance/cash-till"
        element={
          <PrivateRoute>
            <MainLayout>
              <CashTill />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/hr/leave-management"
        element={
          <PrivateRoute>
            <MainLayout>
              <LeaveManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/hr/attendance"
        element={
          <PrivateRoute>
            <MainLayout>
              <AttendanceTracking />
            </MainLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <MainLayout>
              <DocumentManagement />
            </MainLayout>
          </PrivateRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 404 */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </Router>
    </Provider>
  );
};

export default App;
