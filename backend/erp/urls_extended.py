"""
Extended URL Configuration for ERP API
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views_extended import *
from .views_extended_part2 import *

router = DefaultRouter()

# Supply Chain Management
router.register(r'vendors', VendorViewSet, basename='vendor')
router.register(r'purchase-requisitions', PurchaseRequisitionViewSet, basename='purchase-requisition')
router.register(r'rfqs', RequestForQuotationViewSet, basename='rfq')
router.register(r'vendor-quotations', VendorQuotationViewSet, basename='vendor-quotation')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'goods-received-notes', GoodsReceivedNoteViewSet, basename='grn')
router.register(r'vendor-bills', VendorBillViewSet, basename='vendor-bill')
router.register(r'vendor-bill-items', VendorBillItemViewSet, basename='vendor-bill-item')

# CRM
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'opportunities', OpportunityViewSet, basename='opportunity')
router.register(r'quotations', QuotationViewSet, basename='quotation')
router.register(r'sales-orders', SalesOrderViewSet, basename='sales-order')
router.register(r'delivery-notes', DeliveryNoteViewSet, basename='delivery-note')
router.register(r'crm-activities', CRMActivityViewSet, basename='crm-activity')

# Fixed Assets
router.register(r'asset-categories', AssetCategoryViewSet, basename='asset-category')
router.register(r'fixed-assets', FixedAssetViewSet, basename='fixed-asset')
router.register(r'asset-depreciations', AssetDepreciationViewSet, basename='asset-depreciation')
router.register(r'asset-maintenances', AssetMaintenanceViewSet, basename='asset-maintenance')

# HR Management
router.register(r'leave-types', LeaveTypeViewSet, basename='leave-type')
router.register(r'leave-applications', LeaveApplicationViewSet, basename='leave-application')
router.register(r'attendance-records', AttendanceRecordViewSet, basename='attendance-record')
router.register(r'performance-reviews', PerformanceReviewViewSet, basename='performance-review')
router.register(r'job-postings', JobPostingViewSet, basename='job-posting')
router.register(r'job-applications', JobApplicationViewSet, basename='job-application')
router.register(r'training-programs', TrainingProgramViewSet, basename='training-program')

# Document Management
router.register(r'document-categories', DocumentCategoryViewSet, basename='document-category')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-templates', DocumentTemplateViewSet, basename='document-template')

# Zimbabwe Fiscalization
router.register(r'fiscal-devices', ZIMRAVirtualFiscalDeviceViewSet, basename='fiscal-device')
router.register(r'fiscal-receipts', FiscalReceiptViewSet, basename='fiscal-receipt')
router.register(r'fiscal-day-ends', FiscalDayEndViewSet, basename='fiscal-day-end')

# Budgeting
router.register(r'cost-centers', CostCenterViewSet, basename='cost-center')
router.register(r'budget-periods', BudgetPeriodViewSet, basename='budget-period')
router.register(r'budgets', BudgetViewSet, basename='budget')

# E-commerce
router.register(r'websites', WebsiteViewSet, basename='website')
router.register(r'website-products', WebsiteProductViewSet, basename='website-product')
router.register(r'product-reviews', ProductReviewViewSet, basename='product-review')
router.register(r'online-orders', OnlineOrderViewSet, basename='online-order')
router.register(r'shopping-carts', ShoppingCartViewSet, basename='shopping-cart')
router.register(r'promo-codes', PromoCodeViewSet, basename='promo-code')

# Workflow Automation
router.register(r'workflow-definitions', WorkflowDefinitionViewSet, basename='workflow-definition')
router.register(r'workflow-instances', WorkflowInstanceViewSet, basename='workflow-instance')
router.register(r'workflow-step-executions', WorkflowStepExecutionViewSet, basename='workflow-step-execution')

# Payments
router.register(r'payment-gateways', PaymentGatewayViewSet, basename='payment-gateway')
router.register(r'payment-transactions', PaymentTransactionViewSet, basename='payment-transaction')

# Notifications
router.register(r'notification-templates', NotificationTemplateViewSet, basename='notification-template')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]

