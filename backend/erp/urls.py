from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'businesses', views.BusinessViewSet)
router.register(r'stores', views.StoreViewSet)
router.register(r'bank-accounts', views.BankAccountViewSet)
router.register(r'mobile-money-accounts', views.MobileMoneyAccountViewSet)
router.register(r'cash-tills', views.CashTillViewSet)
router.register(r'vendors', views.VendorViewSet)
router.register(r'bank-transactions', views.BankTransactionViewSet)
router.register(r'mobile-money-transactions', views.MobileMoneyTransactionViewSet)
router.register(r'chart-of-accounts', views.ChartOfAccountsViewSet)
router.register(r'journal-entries', views.JournalEntryViewSet)
router.register(r'journal-entry-lines', views.JournalEntryLineViewSet)
router.register(r'general-ledger', views.GeneralLedgerViewSet)
router.register(r'departments', views.DepartmentViewSet)
router.register(r'employees', views.EmployeeViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'projects', views.ProjectViewSet)
router.register(r'project-tasks', views.ProjectTaskViewSet)
router.register(r'project-expenses', views.ProjectExpenseViewSet)
router.register(r'project-timesheets', views.ProjectTimesheetViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'services', views.ServiceViewSet)
router.register(r'payroll', views.PayrollViewSet)
router.register(r'inventory', views.InventoryViewSet)
router.register(r'modules', views.ModuleViewSet)
router.register(r'sale-sessions', views.SaleSessionViewSet)
router.register(r'pos-sales', views.POSSaleViewSet)
router.register(r'pos-items', views.POSItemViewSet)
router.register(r'fiscalization-logs', views.FiscalizationLogViewSet)

# Register Zimbabwe-specific viewsets
router.register(r'currencies', views.CurrencyViewSet)
router.register(r'exchange-rates', views.ExchangeRateViewSet)
router.register(r'zimra-config', views.ZIMRAConfigurationViewSet)
router.register(r'vat-returns', views.VATReturnViewSet)
router.register(r'paye-calculations', views.PAYECalculationViewSet)
router.register(r'nssa-contributions', views.NSSAContributionViewSet)
router.register(r'mobile-money-integrations', views.MobileMoneyIntegrationViewSet)
router.register(r'mobile-money-payments', views.MobileMoneyPaymentViewSet)

# Enhanced inventory viewsets
router.register(r'warehouses', views.WarehouseViewSet)
router.register(r'product-categories', views.ProductCategoryViewSet)
router.register(r'inventory-items', views.InventoryItemViewSet)
router.register(r'stock-movements', views.StockMovementViewSet)

# Manufacturing viewsets
router.register(r'bills-of-materials', views.BillOfMaterialsViewSet)
router.register(r'work-orders', views.WorkOrderViewSet)

# Agriculture viewsets
router.register(r'crops', views.CropViewSet)
router.register(r'farms', views.FarmViewSet)
router.register(r'crop-seasons', views.CropSeasonViewSet)
router.register(r'agricultural-expenses', views.AgriculturalExpenseViewSet)

urlpatterns = [
    # Authentication
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('signup/', views.SignupView.as_view(), name='signup'),
    # JWT obtain/refresh (for frontend refresh flow)
    path('token/obtain/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile
    path('users/me/', views.UserProfileView.as_view(), name='user-profile'),
    
    # Dashboard
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    
    # Unified Transactions
    path('transactions/', views.UnifiedTransactionsView.as_view(), name='unified-transactions'),
    
    # Reports
    path('reports/', views.ReportsView.as_view(), name='reports'),
    path('export-reports/', views.ExportReportsView.as_view(), name='export-reports'),
    
    # POS endpoints
    path('pos/start-session/', views.POSStartSessionView.as_view(), name='pos-start-session'),
    path('pos/end-session/', views.POSEndSessionView.as_view(), name='pos-end-session'),
    path('pos/make-sale/', views.POSMakeSaleView.as_view(), name='pos-make-sale'),
    
    # Accounts Payable & Receivable
    path('accounts-payable/', views.AccountsPayableView.as_view(), name='accounts-payable'),
    path('accounts-receivable/', views.AccountsReceivableView.as_view(), name='accounts-receivable'),
    
    # API routes
    path('', include(router.urls)),
]

# Include Extended URLs
from .urls_extended import urlpatterns as extended_urlpatterns
urlpatterns += extended_urlpatterns

# Additional API endpoints
urlpatterns += [
    path('zimbabwe-analytics/', views.ZimbabweAnalyticsView.as_view(), name='zimbabwe-analytics'),
]

