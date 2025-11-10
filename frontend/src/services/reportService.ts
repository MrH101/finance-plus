import api, { ENDPOINTS } from './api';

export const fetchReports = () => api.get(ENDPOINTS.reports);
export const fetchDocumentTemplates = () => api.get(ENDPOINTS.documentTemplates);
export const fetchLetters = () => api.get(ENDPOINTS.letters);
export const fetchAuditLogs = () => api.get(ENDPOINTS.auditLogs); 