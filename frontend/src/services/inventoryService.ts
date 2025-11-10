import api, { ENDPOINTS } from './api';

export const fetchProducts = () => api.get(ENDPOINTS.products);
export const createProduct = (data: any) => api.post(ENDPOINTS.products, data);
export const updateProduct = (id: number, data: any) => api.put(`${ENDPOINTS.products}${id}/`, data);
export const deleteProduct = (id: number) => api.delete(`${ENDPOINTS.products}${id}/`);

export const fetchInventoryMovements = () => api.get(ENDPOINTS.inventoryMovements);

export const fetchPurchases = () => api.get(ENDPOINTS.purchases);
export const createPurchase = (data: any) => api.post(ENDPOINTS.purchases, data);

export const fetchSuppliers = () => api.get(ENDPOINTS.suppliers);
export const createSupplier = (data: any) => api.post(ENDPOINTS.suppliers, data);
export const updateSupplier = (id: number, data: any) => api.put(`${ENDPOINTS.suppliers}${id}/`, data);
export const deleteSupplier = (id: number) => api.delete(`${ENDPOINTS.suppliers}${id}/`); 