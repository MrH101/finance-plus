import api, { ENDPOINTS } from './api';

export const fetchPayrolls = () => api.get(ENDPOINTS.payroll);
export const createPayroll = (data: any) => api.post(ENDPOINTS.payroll, data);
export const updatePayroll = (id: number, data: any) => api.put(`${ENDPOINTS.payroll}${id}/`, data);
export const deletePayroll = (id: number) => api.delete(`${ENDPOINTS.payroll}${id}/`);

export const fetchLeaveRequests = () => api.get(ENDPOINTS.leaveRequests);
export const createLeaveRequest = (data: any) => api.post(ENDPOINTS.leaveRequests, data);
export const updateLeaveRequest = (id: number, data: any) => api.put(`${ENDPOINTS.leaveRequests}${id}/`, data);
export const deleteLeaveRequest = (id: number) => api.delete(`${ENDPOINTS.leaveRequests}${id}/`);

export const fetchOvertime = () => api.get(ENDPOINTS.overtime);
export const createOvertime = (data: any) => api.post(ENDPOINTS.overtime, data);
export const updateOvertime = (id: number, data: any) => api.put(`${ENDPOINTS.overtime}${id}/`, data);
export const deleteOvertime = (id: number) => api.delete(`${ENDPOINTS.overtime}${id}/`); 