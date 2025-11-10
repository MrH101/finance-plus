import api, { ENDPOINTS } from './api';

export const fetchCustomers = () => api.get(ENDPOINTS.customers);
export const createCustomer = (data: any) => api.post(ENDPOINTS.customers, data);
export const updateCustomer = (id: number, data: any) => api.put(`${ENDPOINTS.customers}${id}/`, data);
export const deleteCustomer = (id: number) => api.delete(`${ENDPOINTS.customers}${id}/`);

export const fetchSales = () => api.get(ENDPOINTS.sales);
export const createSale = (data: any) => api.post(ENDPOINTS.sales, data);
export const updateSale = (id: number, data: any) => api.put(`${ENDPOINTS.sales}${id}/`, data);
export const deleteSale = (id: number) => api.delete(`${ENDPOINTS.sales}${id}/`);

export const fetchSuppliers = () => api.get(ENDPOINTS.suppliers);
export const createSupplier = (data: any) => api.post(ENDPOINTS.suppliers, data);
export const updateSupplier = (id: number, data: any) => api.put(`${ENDPOINTS.suppliers}${id}/`, data);
export const deleteSupplier = (id: number) => api.delete(`${ENDPOINTS.suppliers}${id}/`); 