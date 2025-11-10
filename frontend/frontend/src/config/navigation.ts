export type NavItem = {
  key: string;
  label: string;
  path: string;
  icon?: string;
  roles?: Array<'superadmin' | 'employer' | 'employee'>;
};

export const primaryNav: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: '📊' },
  
  // Finance
  { key: 'transactions', label: 'Transactions', path: '/transactions', icon: '💳', roles: ['superadmin', 'employer'] },
  { key: 'budgets', label: 'Budgets & Accounts', path: '/budgets', icon: '💰', roles: ['superadmin', 'employer'] },
  { key: 'budget-management', label: 'Budget Management', path: '/finance/budget-management', icon: '📊', roles: ['superadmin', 'employer'] },
  { key: 'general-ledger', label: 'General Ledger', path: '/general-ledger', icon: '📚', roles: ['superadmin', 'employer'] },
  { key: 'fixed-assets', label: 'Fixed Assets', path: '/finance/fixed-assets', icon: '🏢', roles: ['superadmin', 'employer'] },
  { key: 'ap', label: 'Accounts Payable', path: '/ap', icon: '📤', roles: ['superadmin', 'employer'] },
  { key: 'ar', label: 'Accounts Receivable', path: '/ar', icon: '📥', roles: ['superadmin', 'employer'] },
  { key: 'banking', label: 'Banking', path: '/banking', icon: '🏦', roles: ['superadmin', 'employer'] },
  { key: 'mobile-money', label: 'Mobile Money', path: '/finance/mobile-money', icon: '📲', roles: ['superadmin', 'employer'] },
  { key: 'mobile-money-payments', label: 'Mobile Payments', path: '/finance/mobile-money-payments', icon: '💸', roles: ['superadmin', 'employer'] },
  { key: 'cash-till', label: 'Cash Till', path: '/finance/cash-till', icon: '💵', roles: ['superadmin', 'employer'] },
  
  // Sales & CRM
  { key: 'crm', label: 'CRM', path: '/crm', icon: '🤝' },
  { key: 'leads', label: 'Lead Management', path: '/crm/leads', icon: '🎯', roles: ['superadmin', 'employer'] },
  { key: 'opportunities', label: 'Sales Pipeline', path: '/crm/opportunities', icon: '📈', roles: ['superadmin', 'employer'] },
  { key: 'quotations', label: 'Quotations', path: '/sales/quotations', icon: '📋', roles: ['superadmin', 'employer'] },
  { key: 'fiscalisation', label: 'Fiscalisation Invoices', path: '/sales/fiscalisation-invoices', icon: '🧾', roles: ['superadmin', 'employer'] },
  
  // Supply Chain
  { key: 'procurement', label: 'Procurement', path: '/procurement', icon: '🧺', roles: ['superadmin', 'employer'] },
  { key: 'vendors', label: 'Vendor Management', path: '/supply-chain/vendors', icon: '🏪', roles: ['superadmin', 'employer'] },
  { key: 'purchase-orders', label: 'Purchase Orders', path: '/supply-chain/purchase-orders', icon: '📦', roles: ['superadmin', 'employer'] },
  { key: 'inventory', label: 'Inventory', path: '/inventory', icon: '📦', roles: ['superadmin', 'employer'] },
  { key: 'services', label: 'Services', path: '/services', icon: '🔧', roles: ['superadmin', 'employer'] },
  { key: 'stores', label: 'Stores', path: '/stores', icon: '🏬', roles: ['superadmin', 'employer'] },
  
  // Operations
  { key: 'manufacturing', label: 'Manufacturing', path: '/manufacturing', icon: '🏭', roles: ['superadmin', 'employer'] },
  { key: 'pos', label: 'POS', path: '/pos', icon: '🛒', roles: ['superadmin', 'employer'] },
  { key: 'projects', label: 'Projects', path: '/projects', icon: '📋' },
  
  // HR
  { key: 'hrm', label: 'HRM', path: '/hrm', icon: '👥', roles: ['superadmin', 'employer'] },
  { key: 'leave-management', label: 'Leave Management', path: '/hr/leave-management', icon: '📅', roles: ['superadmin', 'employer'] },
  { key: 'attendance', label: 'Attendance Tracking', path: '/hr/attendance', icon: '⏰', roles: ['superadmin', 'employer'] },
  { key: 'payroll', label: 'Payroll', path: '/payroll', icon: '💵', roles: ['superadmin', 'employer'] },
  
  // Documents & Reports
  { key: 'documents', label: 'Document Management', path: '/documents', icon: '📁', roles: ['superadmin', 'employer'] },
  { key: 'document-templates', label: 'Document Templates', path: '/document-templates', icon: '📄', roles: ['superadmin', 'employer'] },
  { key: 'letters', label: 'Letters', path: '/letters', icon: '✉️' },
  { key: 'generated-documents', label: 'Generated Documents', path: '/generated-documents', icon: '📑', roles: ['superadmin', 'employer'] },
  { key: 'reports', label: 'Reports', path: '/reports', icon: '📊', roles: ['superadmin', 'employer'] },
  { key: 'analytics', label: 'Analytics', path: '/analytics', icon: '📈', roles: ['superadmin', 'employer'] },
  
  // Compliance
  { key: 'zimra-compliance', label: 'ZIMRA Compliance', path: '/compliance/zimra', icon: '🧾', roles: ['superadmin', 'employer'] },
  { key: 'audit-logs', label: 'Audit Logs', path: '/audit-logs', icon: '📋', roles: ['superadmin'] },
  
  // Settings
  { key: 'users', label: 'Users', path: '/users', icon: '👤', roles: ['superadmin'] },
  { key: 'currency-settings', label: 'Currency Settings', path: '/settings/currencies', icon: '💱', roles: ['superadmin', 'employer'] },
  { key: 'settings', label: 'Settings', path: '/settings', icon: '⚙️', roles: ['superadmin'] },
];
