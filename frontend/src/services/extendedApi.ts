/**
 * Extended API Services for New ERP Modules
 * Supply Chain, CRM, Assets, HR, E-commerce, Payments, etc.
 */
import api from './api';

// ==================== SUPPLY CHAIN MANAGEMENT ====================

export const vendorService = {
  getAll: (params?: any) => api.get('/vendors/', { params }),
  getById: (id: number) => api.get(`/vendors/${id}/`),
  create: (data: any) => api.post('/vendors/', data),
  update: (id: number, data: any) => api.put(`/vendors/${id}/`, data),
  delete: (id: number) => api.delete(`/vendors/${id}/`),
  getPurchaseHistory: (id: number) => api.get(`/vendors/${id}/purchase_history/`),
};

export const purchaseRequisitionService = {
  getAll: (params?: any) => api.get('/purchase-requisitions/', { params }),
  getById: (id: number) => api.get(`/purchase-requisitions/${id}/`),
  create: (data: any) => api.post('/purchase-requisitions/', data),
  update: (id: number, data: any) => api.put(`/purchase-requisitions/${id}/`, data),
  delete: (id: number) => api.delete(`/purchase-requisitions/${id}/`),
  approve: (id: number) => api.post(`/purchase-requisitions/${id}/approve/`),
  reject: (id: number, reason: string) => api.post(`/purchase-requisitions/${id}/reject/`, { reason }),
};

export const rfqService = {
  getAll: (params?: any) => api.get('/rfqs/', { params }),
  getById: (id: number) => api.get(`/rfqs/${id}/`),
  create: (data: any) => api.post('/rfqs/', data),
  update: (id: number, data: any) => api.put(`/rfqs/${id}/`, data),
  delete: (id: number) => api.delete(`/rfqs/${id}/`),
};

export const purchaseOrderService = {
  getAll: (params?: any) => api.get('/purchase-orders/', { params }),
  getById: (id: number) => api.get(`/purchase-orders/${id}/`),
  create: (data: any) => api.post('/purchase-orders/', data),
  update: (id: number, data: any) => api.put(`/purchase-orders/${id}/`, data),
  delete: (id: number) => api.delete(`/purchase-orders/${id}/`),
  approve: (id: number) => api.post(`/purchase-orders/${id}/approve/`),
};

export const grnService = {
  getAll: (params?: any) => api.get('/goods-received-notes/', { params }),
  getById: (id: number) => api.get(`/goods-received-notes/${id}/`),
  create: (data: any) => api.post('/goods-received-notes/', data),
  update: (id: number, data: any) => api.put(`/goods-received-notes/${id}/`, data),
  delete: (id: number) => api.delete(`/goods-received-notes/${id}/`),
  processPayment: (id: number, payments: any[]) => api.post(`/goods-received-notes/${id}/process_payment/`, { payments }),
  createBill: (id: number, data: any) => api.post(`/goods-received-notes/${id}/create_bill/`, data),
};

export const vendorBillService = {
  getAll: (params?: any) => api.get('/vendor-bills/', { params }),
  getById: (id: number) => api.get(`/vendor-bills/${id}/`),
  create: (data: any) => api.post('/vendor-bills/', data),
  update: (id: number, data: any) => api.put(`/vendor-bills/${id}/`, data),
  delete: (id: number) => api.delete(`/vendor-bills/${id}/`),
  submitForApproval: (id: number) => api.post(`/vendor-bills/${id}/submit_for_approval/`),
  approve: (id: number) => api.post(`/vendor-bills/${id}/approve/`),
  reject: (id: number, rejection_reason: string) => api.post(`/vendor-bills/${id}/reject/`, { rejection_reason }),
  cancel: (id: number) => api.post(`/vendor-bills/${id}/cancel/`),
};

// ==================== CRM ====================

export const leadService = {
  getAll: (params?: any) => api.get('/leads/', { params }),
  getById: (id: number) => api.get(`/leads/${id}/`),
  create: (data: any) => api.post('/leads/', data),
  update: (id: number, data: any) => api.put(`/leads/${id}/`, data),
  delete: (id: number) => api.delete(`/leads/${id}/`),
  convertToOpportunity: (id: number) => api.post(`/leads/${id}/convert_to_opportunity/`),
};

export const opportunityService = {
  getAll: (params?: any) => api.get('/opportunities/', { params }),
  getById: (id: number) => api.get(`/opportunities/${id}/`),
  create: (data: any) => api.post('/opportunities/', data),
  update: (id: number, data: any) => api.put(`/opportunities/${id}/`, data),
  delete: (id: number) => api.delete(`/opportunities/${id}/`),
};

export const quotationService = {
  getAll: (params?: any) => api.get('/quotations/', { params }),
  getById: (id: number) => api.get(`/quotations/${id}/`),
  create: (data: any) => api.post('/quotations/', data),
  update: (id: number, data: any) => api.put(`/quotations/${id}/`, data),
  delete: (id: number) => api.delete(`/quotations/${id}/`),
};

export const salesOrderService = {
  getAll: (params?: any) => api.get('/sales-orders/', { params }),
  getById: (id: number) => api.get(`/sales-orders/${id}/`),
  create: (data: any) => api.post('/sales-orders/', data),
  update: (id: number, data: any) => api.put(`/sales-orders/${id}/`, data),
  delete: (id: number) => api.delete(`/sales-orders/${id}/`),
};

export const crmActivityService = {
  getAll: (params?: any) => api.get('/crm-activities/', { params }),
  getById: (id: number) => api.get(`/crm-activities/${id}/`),
  create: (data: any) => api.post('/crm-activities/', data),
  update: (id: number, data: any) => api.put(`/crm-activities/${id}/`, data),
  delete: (id: number) => api.delete(`/crm-activities/${id}/`),
};

// ==================== FIXED ASSETS ====================

export const fixedAssetService = {
  getAll: (params?: any) => api.get('/fixed-assets/', { params }),
  getById: (id: number) => api.get(`/fixed-assets/${id}/`),
  create: (data: any) => api.post('/fixed-assets/', data),
  update: (id: number, data: any) => api.put(`/fixed-assets/${id}/`, data),
  delete: (id: number) => api.delete(`/fixed-assets/${id}/`),
  getSummary: () => api.get('/fixed-assets/summary/'),
};

export const assetCategoryService = {
  getAll: (params?: any) => api.get('/asset-categories/', { params }),
  getById: (id: number) => api.get(`/asset-categories/${id}/`),
  create: (data: any) => api.post('/asset-categories/', data),
  update: (id: number, data: any) => api.put(`/asset-categories/${id}/`, data),
  delete: (id: number) => api.delete(`/asset-categories/${id}/`),
};

export const assetMaintenanceService = {
  getAll: (params?: any) => api.get('/asset-maintenances/', { params }),
  getById: (id: number) => api.get(`/asset-maintenances/${id}/`),
  create: (data: any) => api.post('/asset-maintenances/', data),
  update: (id: number, data: any) => api.put(`/asset-maintenances/${id}/`, data),
  delete: (id: number) => api.delete(`/asset-maintenances/${id}/`),
};

// ==================== HR MANAGEMENT ====================

export const leaveApplicationService = {
  getAll: (params?: any) => api.get('/leave-applications/', { params }),
  getById: (id: number) => api.get(`/leave-applications/${id}/`),
  create: (data: any) => api.post('/leave-applications/', data),
  update: (id: number, data: any) => api.put(`/leave-applications/${id}/`, data),
  delete: (id: number) => api.delete(`/leave-applications/${id}/`),
  approve: (id: number) => api.post(`/leave-applications/${id}/approve/`),
  reject: (id: number, reason: string) => api.post(`/leave-applications/${id}/reject/`, { reason }),
};

export const attendanceService = {
  getAll: (params?: any) => api.get('/attendance-records/', { params }),
  getById: (id: number) => api.get(`/attendance-records/${id}/`),
  create: (data: any) => api.post('/attendance-records/', data),
  bulkCreate: (records: any[]) => api.post('/attendance-records/bulk_create/', { records }),
};

export const performanceReviewService = {
  getAll: (params?: any) => api.get('/performance-reviews/', { params }),
  getById: (id: number) => api.get(`/performance-reviews/${id}/`),
  create: (data: any) => api.post('/performance-reviews/', data),
  update: (id: number, data: any) => api.put(`/performance-reviews/${id}/`, data),
  delete: (id: number) => api.delete(`/performance-reviews/${id}/`),
};

export const jobPostingService = {
  getAll: (params?: any) => api.get('/job-postings/', { params }),
  getById: (id: number) => api.get(`/job-postings/${id}/`),
  create: (data: any) => api.post('/job-postings/', data),
  update: (id: number, data: any) => api.put(`/job-postings/${id}/`, data),
  delete: (id: number) => api.delete(`/job-postings/${id}/`),
};

export const trainingProgramService = {
  getAll: (params?: any) => api.get('/training-programs/', { params }),
  getById: (id: number) => api.get(`/training-programs/${id}/`),
  create: (data: any) => api.post('/training-programs/', data),
  update: (id: number, data: any) => api.put(`/training-programs/${id}/`, data),
  delete: (id: number) => api.delete(`/training-programs/${id}/`),
};

// ==================== DOCUMENTS ====================

export const documentService = {
  getAll: (params?: any) => api.get('/documents/', { params }),
  getById: (id: number) => api.get(`/documents/${id}/`),
  create: (data: FormData) => api.post('/documents/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: number, data: FormData) => api.put(`/documents/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: number) => api.delete(`/documents/${id}/`),
  createVersion: (id: number, data: FormData) => api.post(`/documents/${id}/create_version/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const documentTemplateService = {
  getAll: (params?: any) => api.get('/document-templates/', { params }),
  getById: (id: number) => api.get(`/document-templates/${id}/`),
  create: (data: any) => api.post('/document-templates/', data),
  update: (id: number, data: any) => api.put(`/document-templates/${id}/`, data),
  delete: (id: number) => api.delete(`/document-templates/${id}/`),
};

// ==================== ZIMRA FISCALIZATION ====================

export const fiscalDeviceService = {
  getAll: (params?: any) => api.get('/fiscal-devices/', { params }),
  getById: (id: number) => api.get(`/fiscal-devices/${id}/`),
  create: (data: any) => api.post('/fiscal-devices/', data),
  update: (id: number, data: any) => api.put(`/fiscal-devices/${id}/`, data),
  delete: (id: number) => api.delete(`/fiscal-devices/${id}/`),
  register: (id: number) => api.post(`/fiscal-devices/${id}/register/`),
  syncReceipts: (id: number) => api.post(`/fiscal-devices/${id}/sync_receipts/`),
};


// ==================== BUDGETING ====================

export const budgetService = {
  getAll: (params?: any) => api.get('/budgets/', { params }),
  getById: (id: number) => api.get(`/budgets/${id}/`),
  create: (data: any) => api.post('/budgets/', data),
  update: (id: number, data: any) => api.put(`/budgets/${id}/`, data),
  delete: (id: number) => api.delete(`/budgets/${id}/`),
  approve: (id: number) => api.post(`/budgets/${id}/approve/`),
  getVarianceAnalysis: (id: number) => api.get(`/budgets/${id}/variance_analysis/`),
};

export const costCenterService = {
  getAll: (params?: any) => api.get('/cost-centers/', { params }),
  getById: (id: number) => api.get(`/cost-centers/${id}/`),
  create: (data: any) => api.post('/cost-centers/', data),
  update: (id: number, data: any) => api.put(`/cost-centers/${id}/`, data),
  delete: (id: number) => api.delete(`/cost-centers/${id}/`),
};

// ==================== E-COMMERCE ====================

export const websiteService = {
  getAll: (params?: any) => api.get('/websites/', { params }),
  getById: (id: number) => api.get(`/websites/${id}/`),
  create: (data: any) => api.post('/websites/', data),
  update: (id: number, data: any) => api.put(`/websites/${id}/`, data),
  delete: (id: number) => api.delete(`/websites/${id}/`),
};

export const websiteProductService = {
  getAll: (params?: any) => api.get('/website-products/', { params }),
  getById: (id: number) => api.get(`/website-products/${id}/`),
  create: (data: any) => api.post('/website-products/', data),
  update: (id: number, data: any) => api.put(`/website-products/${id}/`, data),
  delete: (id: number) => api.delete(`/website-products/${id}/`),
  incrementViews: (id: number) => api.post(`/website-products/${id}/increment_views/`),
};

export const onlineOrderService = {
  getAll: (params?: any) => api.get('/online-orders/', { params }),
  getById: (id: number) => api.get(`/online-orders/${id}/`),
  create: (data: any) => api.post('/online-orders/', data),
  update: (id: number, data: any) => api.put(`/online-orders/${id}/`, data),
  processPayment: (id: number) => api.post(`/online-orders/${id}/process_payment/`),
};

export const promoCodeService = {
  getAll: (params?: any) => api.get('/promo-codes/', { params }),
  getById: (id: number) => api.get(`/promo-codes/${id}/`),
  create: (data: any) => api.post('/promo-codes/', data),
  update: (id: number, data: any) => api.put(`/promo-codes/${id}/`, data),
  delete: (id: number) => api.delete(`/promo-codes/${id}/`),
  validate: (code: string, orderAmount: number) => 
    api.post('/promo-codes/validate_code/', { code, order_amount: orderAmount }),
};

// ==================== PAYMENTS ====================

export const paymentGatewayService = {
  getAll: (params?: any) => api.get('/payment-gateways/', { params }),
  getById: (id: number) => api.get(`/payment-gateways/${id}/`),
  create: (data: any) => api.post('/payment-gateways/', data),
  update: (id: number, data: any) => api.put(`/payment-gateways/${id}/`, data),
  delete: (id: number) => api.delete(`/payment-gateways/${id}/`),
};

export const paymentTransactionService = {
  getAll: (params?: any) => api.get('/payment-transactions/', { params }),
  getById: (id: number) => api.get(`/payment-transactions/${id}/`),
  create: (data: any) => api.post('/payment-transactions/', data),
  retry: (id: number) => api.post(`/payment-transactions/${id}/retry/`),
};

// ==================== WORKFLOWS ====================

export const workflowService = {
  getAll: (params?: any) => api.get('/workflow-definitions/', { params }),
  getById: (id: number) => api.get(`/workflow-definitions/${id}/`),
  create: (data: any) => api.post('/workflow-definitions/', data),
  update: (id: number, data: any) => api.put(`/workflow-definitions/${id}/`, data),
  delete: (id: number) => api.delete(`/workflow-definitions/${id}/`),
};

export const workflowInstanceService = {
  getAll: (params?: any) => api.get('/workflow-instances/', { params }),
  getById: (id: number) => api.get(`/workflow-instances/${id}/`),
};

export const workflowStepExecutionService = {
  getAll: (params?: any) => api.get('/workflow-step-executions/', { params }),
  getById: (id: number) => api.get(`/workflow-step-executions/${id}/`),
  approve: (id: number, comments: string) => api.post(`/workflow-step-executions/${id}/approve/`, { comments }),
  reject: (id: number, comments: string) => api.post(`/workflow-step-executions/${id}/reject/`, { comments }),
};

// ==================== NOTIFICATIONS ====================

export const notificationService = {
  getAll: (params?: any) => api.get('/notifications/', { params }),
  getById: (id: number) => api.get(`/notifications/${id}/`),
  markAsRead: (id: number) => api.post(`/notifications/${id}/mark_as_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
};

// ==================== MOBILE MONEY ====================

let mobileMoneyBase: '/mobile-money-payments/' | '/mobile-money-transactions/' | null = null;

export const mobileMoneyPaymentService = {
  async getAll(params?: any) {
    // Prefer cached base if already known
    if (mobileMoneyBase === '/mobile-money-transactions/') {
      return api.get('/mobile-money-transactions/', { params });
    }
    // Try legacy first to avoid visible 404s when payments endpoint is absent
    try {
      const res = await api.get('/mobile-money-transactions/', { params });
      mobileMoneyBase = '/mobile-money-transactions/';
      return res;
    } catch (legacyErr: any) {
      if (legacyErr?.response?.status !== 404) throw legacyErr;
    }
    // Fallback to new endpoint
    const res = await api.get('/mobile-money-payments/', { params });
    mobileMoneyBase = '/mobile-money-payments/';
    return res;
  },
  async getById(id: number) {
    if (mobileMoneyBase === '/mobile-money-transactions/') {
      return api.get(`/mobile-money-transactions/${id}/`);
    }
    try {
      const res = await api.get(`/mobile-money-transactions/${id}/`);
      mobileMoneyBase = '/mobile-money-transactions/';
      return res;
    } catch (legacyErr: any) {
      if (legacyErr?.response?.status !== 404) throw legacyErr;
    }
    const res = await api.get(`/mobile-money-payments/${id}/`);
    mobileMoneyBase = '/mobile-money-payments/';
    return res;
  },
  async create(data: any) {
    const toLegacy = {
      amount: data.amount,
      currency: data.currency || data.currency_code,
      phone_number: data.phone_number,
      description: data.description || data.reference,
      customer_name: data.customer_name,
      invoice_number: data.invoice_number,
      payment_method: data.payment_method,
    };
    if (mobileMoneyBase === '/mobile-money-transactions/') {
      return api.post('/mobile-money-transactions/', toLegacy);
    }
    // Try legacy first
    try {
      const res = await api.post('/mobile-money-transactions/', toLegacy);
      mobileMoneyBase = '/mobile-money-transactions/';
      return res;
    } catch (legacyErr: any) {
      if (legacyErr?.response?.status !== 404) throw legacyErr;
    }
    const res = await api.post('/mobile-money-payments/', data);
    mobileMoneyBase = '/mobile-money-payments/';
    return res;
  },
  async checkStatus(id: number) {
    if (mobileMoneyBase === '/mobile-money-transactions/') {
      // Legacy may not support this action
      return Promise.reject(new Error('Status check not supported on legacy endpoint'));
    }
    try {
      const res = await api.post(`/mobile-money-payments/${id}/check_status/`);
      mobileMoneyBase = '/mobile-money-payments/';
      return res;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        mobileMoneyBase = '/mobile-money-transactions/';
        return Promise.reject(new Error('Status check not supported on legacy endpoint'));
      }
      throw err;
    }
  },
  async cancel(id: number) {
    if (mobileMoneyBase === '/mobile-money-transactions/') {
      // Not supported on legacy; no-op to keep UI flows simple
      return Promise.resolve({ data: { ok: true } } as any);
    }
    try {
      const res = await api.post(`/mobile-money-payments/${id}/cancel/`);
      mobileMoneyBase = '/mobile-money-payments/';
      return res;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        mobileMoneyBase = '/mobile-money-transactions/';
        return Promise.resolve({ data: { ok: true } } as any);
      }
      throw err;
    }
  },
  async getMyStatus() {
    if (mobileMoneyBase === '/mobile-money-transactions/') {
      return Promise.reject(new Error('My status not supported on legacy endpoint'));
    }
    try {
      const res = await api.get('/mobile-money-payments/my_status/');
      mobileMoneyBase = '/mobile-money-payments/';
      return res;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        mobileMoneyBase = '/mobile-money-transactions/';
        return Promise.reject(new Error('My status not supported on legacy endpoint'));
      }
      throw err;
    }
  },
};

// ==================== ATTENDANCE ACTIONS ====================

export const attendanceActionService = {
  clockIn: (data: any) => api.post('/attendance-records/clock_in/', data),
  clockOut: (data: any) => api.post('/attendance-records/clock_out/', data),
  getMyStatus: () => api.get('/attendance-records/my_status/'),
};

// Update attendanceService to include the new actions
export const attendanceServiceExtended = {
  ...attendanceService,
  clockIn: (data: any) => api.post('/attendance-records/clock_in/', data),
  clockOut: (data: any) => api.post('/attendance-records/clock_out/', data),
  getMyStatus: () => api.get('/attendance-records/my_status/'),
};

// ==================== QUOTATIONS ACTIONS ====================

export const quotationActionService = {
  send: (id: number) => api.post(`/quotations/${id}/send/`),
  convert: (id: number) => api.post(`/quotations/${id}/convert_to_sales_order/`),
  downloadPDF: (id: number) => api.get(`/quotations/${id}/download_pdf/`, { responseType: 'blob' }),
};

// ==================== POS (POINT OF SALE) ====================

export const posSessionService = {
  getAll: (params?: any) => api.get('/pos-sessions/', { params }),
  getById: (id: number) => api.get(`/pos-sessions/${id}/`),
  create: (data: any) => api.post('/pos-sessions/', data),
  update: (id: number, data: any) => api.patch(`/pos-sessions/${id}/`, data),
  delete: (id: number) => api.delete(`/pos-sessions/${id}/`),
  getActive: () => api.get('/pos-sessions/active/'),
  open: (data: any) => api.post('/pos-sessions/open/', data),
  close: (id: number, data: any) => api.post(`/pos-sessions/${id}/close/`, data),
};

export const posSaleService = {
  getAll: (params?: any) => api.get('/pos-sales/', { params }),
  getById: (id: number) => api.get(`/pos-sales/${id}/`),
  create: (data: any) => api.post('/pos-sales/', data),
  update: (id: number, data: any) => api.patch(`/pos-sales/${id}/`, data),
  delete: (id: number) => api.delete(`/pos-sales/${id}/`),
  getDailySummary: (date?: string) => api.get('/pos-sales/daily-summary/', { params: { date } }),
  getReceipt: (id: number) => api.get(`/pos-sales/${id}/receipt/`),
  printReceipt: (id: number) => api.get(`/pos-sales/${id}/print/`),
};

export const customerService = {
  getAll: (params?: any) => api.get('/customers/', { params }),
  getById: (id: number) => api.get(`/customers/${id}/`),
  create: (data: any) => api.post('/customers/', data),
  update: (id: number, data: any) => api.patch(`/customers/${id}/`, data),
  delete: (id: number) => api.delete(`/customers/${id}/`),
  search: (query: string) => api.get('/customers/search/', { params: { q: query } }),
};

export const fiscalReceiptService = {
  getAll: (params?: any) => api.get('/fiscal-receipts/', { params }),
  getById: (id: number) => api.get(`/fiscal-receipts/${id}/`),
  create: (data: any) => api.post('/fiscal-receipts/', data),
  generateQR: (id: number) => api.get(`/fiscal-receipts/${id}/qr-code/`),
  validate: (receiptNumber: string) => api.post('/fiscal-receipts/validate/', { receipt_number: receiptNumber }),
};

