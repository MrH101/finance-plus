import api, { ENDPOINTS } from './api';

// Advanced Budget & Financial Services
export const advancedBudgetService = {
  // Budget operations
  async getBudgets() {
    return api.get(ENDPOINTS.budgets);
  },
  
  async createBudget(data: any) {
    return api.post(ENDPOINTS.budgets, data);
  },
  
  async updateBudget(id: number, data: any) {
    return api.put(`${ENDPOINTS.budgets}${id}/`, data);
  },
  
  async deleteBudget(id: number) {
    return api.delete(`${ENDPOINTS.budgets}${id}/`);
  },

  // Accounts Payable operations
  async getAccountsPayable() {
    return api.get(ENDPOINTS.accountsPayable);
  },

  async createAccountsPayable(data: any) {
    return api.post(ENDPOINTS.accountsPayable, data);
  },

  async updateAccountsPayable(id: number, data: any) {
    return api.put(`${ENDPOINTS.accountsPayable}${id}/`, data);
  },

  async deleteAccountsPayable(id: number) {
    return api.delete(`${ENDPOINTS.accountsPayable}${id}/`);
  },

  // Accounts Receivable operations
  async getAccountsReceivable() {
    return api.get(ENDPOINTS.accountsReceivable);
  },

  async createAccountsReceivable(data: any) {
    return api.post(ENDPOINTS.accountsReceivable, data);
  },

  async updateAccountsReceivable(id: number, data: any) {
    return api.put(`${ENDPOINTS.accountsReceivable}${id}/`, data);
  },

  async deleteAccountsReceivable(id: number) {
    return api.delete(`${ENDPOINTS.accountsReceivable}${id}/`);
  },

  // General Ledger operations
  async getGeneralLedger() {
    return api.get(ENDPOINTS.generalLedger);
  },

  async createGeneralLedgerEntry(data: any) {
    return api.post(ENDPOINTS.generalLedger, data);
  },

  async updateGeneralLedgerEntry(id: number, data: any) {
    return api.put(`${ENDPOINTS.generalLedger}${id}/`, data);
  },

  async deleteGeneralLedgerEntry(id: number) {
    return api.delete(`${ENDPOINTS.generalLedger}${id}/`);
  },
};

// Advanced Document Management Services
export const advancedDocumentService = {
  // Document Templates
  async getDocumentTemplates() {
    return api.get(ENDPOINTS.documentTemplates);
  },

  async createDocumentTemplate(data: any) {
    return api.post(ENDPOINTS.documentTemplates, data);
  },

  async updateDocumentTemplate(id: number, data: any) {
    return api.put(`${ENDPOINTS.documentTemplates}${id}/`, data);
  },

  async deleteDocumentTemplate(id: number) {
    return api.delete(`${ENDPOINTS.documentTemplates}${id}/`);
  },

  // Letters
  async getLetters() {
    return api.get(ENDPOINTS.letters);
  },

  async createLetter(data: any) {
    return api.post(ENDPOINTS.letters, data);
  },

  async updateLetter(id: number, data: any) {
    return api.put(`${ENDPOINTS.letters}${id}/`, data);
  },

  async deleteLetter(id: number) {
    return api.delete(`${ENDPOINTS.letters}${id}/`);
  },

  // Generated Documents
  async getGeneratedDocuments() {
    return api.get(ENDPOINTS.generatedDocuments);
  },

  async createGeneratedDocument(data: any) {
    return api.post(ENDPOINTS.generatedDocuments, data);
  },

  async downloadGeneratedDocument(id: number) {
    return api.get(`${ENDPOINTS.generatedDocuments}${id}/download/`);
  },

  async deleteGeneratedDocument(id: number) {
    return api.delete(`${ENDPOINTS.generatedDocuments}${id}/`);
  },
};

// Advanced System Administration Services
export const advancedSystemService = {
  // Audit Logs
  async getAuditLogs(params?: any) {
    return api.get(ENDPOINTS.auditLogs, { params });
  },

  // Store Management
  async getStores() {
    return api.get(ENDPOINTS.store);
  },

  async createStore(data: any) {
    return api.post(ENDPOINTS.store, data);
  },

  async updateStore(id: number, data: any) {
    return api.put(`${ENDPOINTS.store}${id}/`, data);
  },

  async deleteStore(id: number) {
    return api.delete(`${ENDPOINTS.store}${id}/`);
  },

  // Reports
  async getReports() {
    return api.get(ENDPOINTS.reports);
  },

  async generateReport(reportType: string, params?: any) {
    return api.get(`${ENDPOINTS.reports}${reportType}/`, { params });
  },

  async exportReport(reportType: string, format: string, params?: any) {
    return api.get(`${ENDPOINTS.reports}export/`, { 
      params: { ...params, report_type: reportType, format } 
    });
  },
};

// Advanced HR Services
export const advancedHRService = {
  // Leave Requests
  async getLeaveRequests() {
    return api.get(ENDPOINTS.leaveRequests);
  },

  async createLeaveRequest(data: any) {
    return api.post(ENDPOINTS.leaveRequests, data);
  },

  async updateLeaveRequest(id: number, data: any) {
    return api.put(`${ENDPOINTS.leaveRequests}${id}/`, data);
  },

  async approveLeaveRequest(id: number) {
    return api.post(`${ENDPOINTS.leaveRequests}${id}/approve/`);
  },

  async rejectLeaveRequest(id: number) {
    return api.post(`${ENDPOINTS.leaveRequests}${id}/reject/`);
  },

  async deleteLeaveRequest(id: number) {
    return api.delete(`${ENDPOINTS.leaveRequests}${id}/`);
  },

  // Overtime
  async getOvertime() {
    return api.get(ENDPOINTS.overtime);
  },

  async createOvertime(data: any) {
    return api.post(ENDPOINTS.overtime, data);
  },

  async updateOvertime(id: number, data: any) {
    return api.put(`${ENDPOINTS.overtime}${id}/`, data);
  },

  async approveOvertime(id: number) {
    return api.post(`${ENDPOINTS.overtime}${id}/approve/`);
  },

  async deleteOvertime(id: number) {
    return api.delete(`${ENDPOINTS.overtime}${id}/`);
  },
};

export default {
  budget: advancedBudgetService,
  document: advancedDocumentService,
  system: advancedSystemService,
  hr: advancedHRService,
}; 