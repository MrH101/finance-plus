import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiPrinter,
  FiUser, FiDollarSign, FiCreditCard, FiSmartphone,
  FiCheckCircle, FiX, FiRefreshCw, FiSearch
} from 'react-icons/fi';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  vat_rate: number;
  current_stock: number;
  image?: string;
  barcode?: string;
  category?: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  service_price: number;
  service_code: string;
  category?: string;
  duration_hours?: number;
}

interface CartItem {
  product?: Product;
  service?: Service;
  quantity: number;
  unit_price: number;
  total_price: number;
  vat_amount: number;
  item_type: 'product' | 'service';
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface SaleSummary {
  subtotal: number;
  vat_total: number;
  total: number;
  item_count: number;
}

interface StoreOption {
  id: number;
  name: string;
}

const POS: React.FC = () => {
  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [itemType, setItemType] = useState<'products' | 'services'>('products');
  const [loading, setLoading] = useState(false);
  const [posSession, setPosSession] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  // Fiscal receipt is derived from lastSale; no separate state needed
  const [categories, setCategories] = useState<string[]>(['all']);
  const [serviceCategories, setServiceCategories] = useState<string[]>(['all']);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Payment Methods
  const paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash', icon: <FiDollarSign />, color: 'bg-green-500' },
    { id: 'card', name: 'Card', icon: <FiCreditCard />, color: 'bg-blue-500' },
    { id: 'ecocash', name: 'EcoCash', icon: <FiSmartphone />, color: 'bg-red-500' },
    { id: 'onemoney', name: 'OneMoney', icon: <FiSmartphone />, color: 'bg-purple-500' },
    { id: 'innbucks', name: 'Innbucks', icon: <FiSmartphone />, color: 'bg-orange-500' },
  ];

  useEffect(() => {
    fetchStores();
    fetchCustomers();
    fetchActiveSession();
    // Also fetch products and services on initial load
    fetchProducts();
    fetchServices();
  }, []);

  // Fetch products and services when store is selected or session changes
  useEffect(() => {
    fetchProducts();
    fetchServices();
  }, [selectedStore, posSession?.store]);

  // Debug: Log when products change
  useEffect(() => {
    console.log('🔄 Products state updated:', products.length, 'products');
    if (products.length > 0) {
      console.log('📦 Products in state:', products.map(p => ({ id: p.id, name: p.name, price: p.price })));
    }
  }, [products]);

  // API Functions
  const fetchStores = async () => {
    try {
      const response = await api.get('/stores/');
      const raw = response.data?.results || response.data || [];
      const storeList = Array.isArray(raw) ? raw.map((s: any) => ({
        id: s.id,
        name: s.name || s.title || s.store_name || `Store ${s.id}`
      })) : [];
      setStores(storeList);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          const response2 = await api.get('/locations/');
          const raw2 = response2.data?.results || response2.data || [];
          const storeList2 = Array.isArray(raw2) ? raw2.map((s: any) => ({
            id: s.id,
            name: s.name || s.title || s.location_name || `Store ${s.id}`
          })) : [];
          setStores(storeList2);
        } catch {
          setStores([]);
        }
      } else {
        setStores([]);
      }
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const storeId = selectedStore || posSession?.store;
      const params: any = {};
      
      // Only fetch products for the selected store
      // If no store is selected, don't fetch products (user must select a store first)
      if (storeId) {
        params.store = storeId;
      } else {
        // No store selected - clear products and return early
        setProducts([]);
        setCategories(['all']);
        setLoading(false);
        return;
      }
      
      // Don't filter by is_active initially - let's see all products first
      // We can filter by is_active later if needed
      // params.is_active = 'true';
      
      console.log('🔍 Fetching products with params:', params);
      console.log('🔍 Selected store:', storeId);
      console.log('🔍 POS Session store:', posSession?.store);
      
      let productsData: any[] = [];
      let apiError: any = null;
      
      // Try products endpoint first (primary endpoint)
      try {
        console.log('📡 Making API call to /products/ with params:', params);
        const response = await api.get('/products/', { params });
        console.log('📡 API Response status:', response.status);
        console.log('📡 API Response data type:', typeof response.data);
        console.log('📡 API Response data keys:', Object.keys(response.data || {}));
        
        // Safely stringify response data (handle circular references and large objects)
        try {
          const responseDataStr = JSON.stringify(response.data, (key, value) => {
            // Skip circular references and limit depth
            if (key === 'headers' || key === 'config') return '[Object]';
            return value;
          }, 2);
          console.log('📡 Full response data:', responseDataStr.substring(0, 1000) + (responseDataStr.length > 1000 ? '... (truncated)' : ''));
        } catch (e) {
          console.log('📡 Response data (could not stringify):', response.data);
        }
        
        productsData = response.data?.results || response.data || [];
        if (!Array.isArray(productsData)) {
          console.warn('⚠️ Response data is not an array:', typeof productsData, productsData);
          // If it's an object, try to extract an array from it
          if (typeof productsData === 'object' && productsData !== null) {
            const possibleArray = Object.values(productsData).find(v => Array.isArray(v));
            if (possibleArray) {
              console.log('🔄 Found array in response object, using it');
              productsData = possibleArray;
            } else {
              productsData = [];
            }
          } else {
            productsData = [];
          }
        }
        console.log('✅ Loaded products from /products/ endpoint:', productsData.length);
        if (productsData.length > 0) {
          try {
            console.log('📦 First product sample:', JSON.stringify(productsData[0], null, 2));
          } catch (e) {
            console.log('📦 First product sample (raw):', productsData[0]);
          }
        } else {
          console.warn('⚠️ No products in response array');
        }
      } catch (productsErr: any) {
        apiError = productsErr;
        console.error('❌ Products endpoint error:', {
          status: productsErr?.response?.status,
          statusText: productsErr?.response?.statusText,
          data: productsErr?.response?.data,
          message: productsErr?.message,
          config: {
            url: productsErr?.config?.url,
            method: productsErr?.config?.method,
            params: productsErr?.config?.params
          }
        });
        
        // Don't try fallback if it's a 401/403 (authentication/authorization error)
        if (productsErr?.response?.status === 401 || productsErr?.response?.status === 403) {
          console.error('❌ Authentication/Authorization error. User may not have permission.');
          toast.error('Permission denied. Please check your user role and permissions.');
          productsData = [];
        } else {
          // Fallback to inventory-items if products endpoint fails
          try {
            console.log('🔄 Trying inventory-items endpoint as fallback...');
            const response = await api.get('/inventory-items/', { params });
            productsData = response.data?.results || response.data || [];
            if (!Array.isArray(productsData)) {
              productsData = [];
            }
            console.log('✅ Loaded products from /inventory-items/ endpoint:', productsData.length);
          } catch (inventoryErr: any) {
            console.error('❌ Both endpoints failed. Inventory error:', {
              status: inventoryErr?.response?.status,
              data: inventoryErr?.response?.data,
              message: inventoryErr?.message
            });
            productsData = [];
          }
        }
      }
      
      // Normalize products to Product interface
      console.log('🔄 Normalizing products. Raw data length:', productsData.length);
      console.log('🔄 Raw products data:', productsData);
      
      const normalized: Product[] = productsData
        .map((item: any) => {
          // Map all possible price fields - handle string prices like "12.00"
          const priceStr = item.selling_price || item.unit_price || item.price || '0';
          const price = typeof priceStr === 'string' ? parseFloat(priceStr) : Number(priceStr);
          
          // Map stock - handle both current_stock and quantity_in_stock
          const stockStr = item.current_stock || item.quantity_in_stock || item.quantity || '0';
          const stock = typeof stockStr === 'string' ? parseInt(stockStr, 10) : Number(stockStr);
          
          // Map category - can be a string directly or nested object
          let category = 'General';
          if (item.category) {
            if (typeof item.category === 'string') {
              category = item.category;
            } else if (item.category?.name) {
              category = item.category.name;
            } else if (item.category_name) {
              category = item.category_name;
            }
          }
          
          const normalizedProduct: Product = {
            id: item.id,
            name: item.name || '',
            description: item.description || '',
            price: isNaN(price) ? 0 : price,
            vat_rate: Number(item.vat_rate || 0),
            current_stock: isNaN(stock) ? 0 : stock,
            image: item.image || item.image_url || undefined,
            barcode: (item.barcode || item.sku || '').toString(),
            category: category,
          };
          
          console.log('🔄 Normalized product:', normalizedProduct);
          return normalizedProduct;
        })
        .filter((p: Product) => {
          // Only filter out products with no ID or name
          if (!p.id || !p.name || p.name.trim() === '') {
            console.warn('⚠️ Filtering out product with missing id/name:', p);
            return false;
          }
          // Don't filter by is_active or price - show all valid products
          console.log('✅ Product passed filter:', p.name, p.id);
          return true;
        });
      
      console.log('📦 Final normalized products count:', normalized.length);
      if (normalized.length > 0) {
        console.log('📦 Sample normalized products:', normalized.slice(0, 3).map(p => ({ 
          id: p.id, 
          name: p.name, 
          price: p.price,
          stock: p.current_stock 
        })));
      } else {
        console.warn('⚠️ No products after normalization. Raw data:', productsData);
        if (apiError) {
          console.error('❌ Original API error:', apiError);
        }
      }
      
      setProducts(normalized);
      
      // Update categories
      const categoryList = Array.from(new Set(normalized
        .map(p => p.category || 'General')
        .filter((c): c is string => Boolean(c && c.trim() !== ''))));
      setCategories(['all', ...categoryList]);
      
      if (normalized.length === 0 && !apiError) {
        // Only show warning if we got a successful response but no products
        // Don't spam the user with warnings on initial load
        console.info('ℹ️ No products found. User may need to add products in the Inventory module.');
      } else if (apiError && normalized.length === 0) {
        toast.error('Failed to load products. Please check your connection.');
      }
    } catch (err: any) {
      console.error('❌ Unexpected error fetching products:', err);
      toast.error('Failed to load products');
      setProducts([]);
      setCategories(['all']);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const storeId = selectedStore || posSession?.store;
      
      // Only fetch services for the selected store
      // If no store is selected, don't fetch services
      if (!storeId) {
        setServices([]);
        setServiceCategories(['all']);
        return;
      }
      
      const params: any = { store: storeId };
      // Filter by is_active to only show active services
      params.is_active = true;
      
      const response = await api.get('/services/', { params });
      const servicesData = response.data?.results || response.data || [];
      const normalized: Service[] = (Array.isArray(servicesData) ? servicesData : []).map((s: any) => ({
        id: s.id,
        name: s.name || '',
        description: s.description || '',
        service_price: Number(s.service_price || 0),
        service_code: s.service_code || '',
        category: s.category || '',
        duration_hours: s.duration_hours ? Number(s.duration_hours) : undefined,
      })).filter((s: Service) => s.name && s.service_price > 0); // Only include active services with valid data
      
      console.log('Loaded services:', normalized.length);
      setServices(normalized);
      const categoryList = Array.from(new Set(normalized
        .map(s => s.category)
        .filter((c): c is string => Boolean(c))));
      setServiceCategories(['all', ...categoryList]);
    } catch (err: any) {
      // If inventory-items endpoint doesn't exist (404), try products
      if (err?.response?.status === 404) {
        try {
          const storeId = selectedStore || posSession?.store;
          const params = storeId ? { store: storeId } : {};
          const fallback = await api.get('/products/', { params });
          const productsData = fallback.data.results || fallback.data || [];
          // Normalize products to Product interface
          const normalized: Product[] = (Array.isArray(productsData) ? productsData : []).map((item: any) => ({
            id: item.id,
            name: item.name || '',
            description: item.description || '',
            price: Number(item.unit_price || item.price || 0),
            vat_rate: Number(item.vat_rate || 0),
            current_stock: Number(item.quantity_in_stock || item.current_stock || item.quantity || 0),
            image: item.image || item.image_url,
            barcode: item.sku || item.barcode,
            category: item.category || item.category_name || '',
          }));
          console.log('Loaded products (fallback from 404):', normalized.length, normalized);
          setProducts(normalized);
          const categoryList = Array.from(new Set(normalized
            .map(p => p.category)
            .filter((c): c is string => Boolean(c))));
          setCategories(['all', ...categoryList]);
        } catch (fallbackErr) {
          console.error('Failed to fetch products (fallback):', fallbackErr);
          setProducts([]);
          toast.error('Failed to load products');
        }
      } else {
        console.error('Failed to fetch products:', err);
        setProducts([]);
        if (err?.response?.status !== 401) {
          toast.error('Failed to load products');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/');
      setCustomers(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const response = await api.get('/sale-sessions/');
      const list = response.data.results || response.data || [];
      const activeSession = Array.isArray(list) ? list.find((s: any) => s.is_active) : null;
      if (activeSession) {
        setPosSession(activeSession);
        if (activeSession.store && !selectedStore) {
          setSelectedStore(activeSession.store);
        }
      } else {
        setPosSession(null);
      }
    } catch (error) {
      console.error('Failed to fetch POS session:', error);
      setPosSession(null);
    }
  };

  const openSession = async () => {
    if (!selectedStore) {
      if (stores.length > 0) {
        setShowStoreModal(true);
        toast.error('Please select a store first');
      } else {
        toast.error('No stores available. Please add a store first.');
      }
      return;
    }
    
    try {
      // First check if there's already an active session
      await fetchActiveSession();
      if (posSession && posSession.store === selectedStore) {
        toast.success('Session already active for this store');
        return;
      }
      
      // If there's an active session for a different store, close it first
      if (posSession && posSession.store !== selectedStore) {
        await closeSession();
        // Wait a bit for the session to close
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const response = await api.post('/pos/start-session/', {
        store: selectedStore,
        opening_balance: 0
      });
      setPosSession(response.data);
      toast.success(`POS session opened successfully for ${stores.find(s => s.id === selectedStore)?.name || 'store'}`);
      // Refresh to get the updated session
      await fetchActiveSession();
      setShowStoreModal(false);
    } catch (error: any) {
      console.error('Failed to open session:', error);
      console.error('Error response:', error?.response?.data);
      const errorData = error?.response?.data;
      let msg = 'Failed to open POS session';
      
      // If error is "Active session already exists", try to fetch it
      if (errorData?.error === 'Active session already exists' || errorData?.error?.includes('already exists')) {
        try {
          await fetchActiveSession();
          if (posSession) {
            toast.success('Using existing active session');
            return;
          }
        } catch (fetchErr) {
          console.error('Failed to fetch existing session:', fetchErr);
        }
        msg = 'Active session already exists';
      } else if (errorData) {
        if (errorData.error) {
          msg = errorData.error;
        } else if (errorData.detail) {
          msg = errorData.detail;
        } else if (errorData.message) {
          msg = errorData.message;
        } else if (typeof errorData === 'string') {
          msg = errorData;
        } else {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) {
            const firstError = errorData[firstKey];
            if (Array.isArray(firstError) && firstError.length > 0) {
              msg = `${firstKey}: ${firstError[0]}`;
            } else if (typeof firstError === 'string') {
              msg = `${firstKey}: ${firstError}`;
            }
          }
        }
      }
      toast.error(msg);
    }
  };

  const closeSession = async () => {
    try {
      await api.post('/pos/end-session/');
      setPosSession(null);
      toast.success('POS session closed successfully');
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Failed to close POS session';
      toast.error(msg);
    }
  };

  // Cart Functions
  const addToCart = (item: Product | Service, type: 'product' | 'service' = 'product') => {
    if (type === 'product') {
      const product = item as Product;
      if (product.current_stock <= 0) {
        toast.error('Product out of stock');
        return;
      }

      setCart(prev => {
        const existingItem = prev.find(cartItem => cartItem.product?.id === product.id && cartItem.item_type === 'product');
        
        if (existingItem) {
          return prev.map(cartItem =>
            cartItem.product?.id === product.id && cartItem.item_type === 'product'
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + 1,
                  total_price: (cartItem.quantity + 1) * cartItem.unit_price,
                  vat_amount: (cartItem.quantity + 1) * cartItem.unit_price * (product.vat_rate / 100)
                }
              : cartItem
          );
        } else {
          return [...prev, {
            product,
            quantity: 1,
            unit_price: product.price,
            total_price: product.price,
            vat_amount: product.price * (product.vat_rate / 100),
            item_type: 'product' as const
          }];
        }
      });
    } else {
      const service = item as Service;
      setCart(prev => {
        const existingItem = prev.find(cartItem => cartItem.service?.id === service.id && cartItem.item_type === 'service');
        
        if (existingItem) {
          return prev.map(cartItem =>
            cartItem.service?.id === service.id && cartItem.item_type === 'service'
              ? {
                  ...cartItem,
                  quantity: cartItem.quantity + 1,
                  total_price: (cartItem.quantity + 1) * cartItem.unit_price,
                  vat_amount: 0 // Services typically have 0% VAT
                }
              : cartItem
          );
        } else {
          return [...prev, {
            service,
            quantity: 1,
            unit_price: service.service_price,
            total_price: service.service_price,
            vat_amount: 0, // Services typically have 0% VAT
            item_type: 'service' as const
          }];
        }
      });
    }
  };

  const updateQuantity = (itemId: number, newQuantity: number, itemType: 'product' | 'service') => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, itemType);
      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (itemType === 'product' && item.item_type === 'product' && item.product?.id === itemId) {
          const updatedQuantity = newQuantity;
          const product = item.product;
          return {
            ...item,
            quantity: updatedQuantity,
            total_price: updatedQuantity * item.unit_price,
            vat_amount: updatedQuantity * item.unit_price * (product.vat_rate / 100)
          };
        } else if (itemType === 'service' && item.item_type === 'service' && item.service?.id === itemId) {
          const updatedQuantity = newQuantity;
          return {
            ...item,
            quantity: updatedQuantity,
            total_price: updatedQuantity * item.unit_price,
            vat_amount: 0 // Services typically have 0% VAT
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: number, itemType: 'product' | 'service') => {
    setCart(prev => prev.filter(item => {
      if (itemType === 'product') {
        return !(item.item_type === 'product' && item.product?.id === itemId);
      } else {
        return !(item.item_type === 'service' && item.service?.id === itemId);
      }
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const getSaleSummary = (): SaleSummary => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const vat_total = cart.reduce((sum, item) => sum + item.vat_amount, 0);
    const total = subtotal + vat_total;
    const item_count = cart.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, vat_total, total, item_count };
  };

  // Customer Functions
  const addCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!newCustomer.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!newCustomer.phone.trim()) {
      toast.error('Phone is required');
      return;
    }
    if (!newCustomer.address.trim()) {
      toast.error('Address is required');
      return;
    }

    try {
      const response = await api.post('/customers/', {
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim(),
        phone: newCustomer.phone.trim(),
        address: newCustomer.address.trim(),
        vat_number: '', // Optional field
      });
      setCustomers(prev => [...prev, response.data]);
      setSelectedCustomer(response.data.id);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      toast.success('Customer added successfully');
    } catch (error: any) {
      const errorData = error?.response?.data;
      let errorMsg = 'Failed to add customer';
      if (errorData) {
        const firstKey = Object.keys(errorData)[0];
        if (firstKey && Array.isArray(errorData[firstKey])) {
          errorMsg = `${firstKey}: ${errorData[firstKey][0]}`;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      }
      toast.error(errorMsg);
    }
  };

  // Sale Processing
  const processSale = async () => {
    console.log('processSale called', { cartLength: cart.length, posSession, selectedCustomer, selectedPaymentMethod });
    
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!posSession) {
      toast.error('No active POS session');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting sale processing...');
      const summary = getSaleSummary();
      const customer = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
      
      const timestamp = Date.now().toString().slice(-10);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const saleNumber = `SALE-${timestamp}${random}`.slice(0, 20);
      
      const paymentMethodMap: { [key: string]: string } = {
        'cash': 'CASH',
        'card': 'CARD',
        'ecocash': 'MOBILE_MONEY',
        'onemoney': 'MOBILE_MONEY',
        'innbucks': 'MOBILE_MONEY',
      };
      const backendPaymentMethod = paymentMethodMap[selectedPaymentMethod.toLowerCase()] || 'CASH';
      
      const payload = {
        sale_number: saleNumber,
        customer_name: (customer?.name || '').slice(0, 100),
        customer_phone: (customer?.phone || '').slice(0, 20),
        subtotal: Number(summary.subtotal.toFixed(2)),
        tax_amount: Number(summary.vat_total.toFixed(2)),
        discount_amount: 0,
        total_amount: Number(summary.total.toFixed(2)),
        payment_method: backendPaymentMethod,
        status: 'COMPLETED',
        items: cart.map(item => ({
          product: item.item_type === 'product' ? item.product?.id : null,
          service: item.item_type === 'service' ? item.service?.id : null,
          item_name: item.item_type === 'product' ? item.product?.name : item.service?.name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price.toFixed(2)),
          total_price: Number(item.total_price.toFixed(2)),
        })),
      };

      console.log('Submitting POS sale payload:', payload);
      const response = await api.post('/pos/make-sale/', payload);
      const saleResponse = response.data;
      console.log('Sale completed:', saleResponse);

      setLastSale(saleResponse);
      setShowReceipt(true);
      clearCart();
      setSelectedCustomer(null);
      toast.success('Sale completed successfully!');

      // Refresh products, services and session to reflect new balances
      await fetchProducts();
      await fetchServices();
      await fetchActiveSession();
    } catch (error: any) {
      console.error('Sale failed:', error);
      console.error('Error response:', error?.response?.data);
      const errorData = error?.response?.data;
      let errorMsg = 'Sale failed';
      if (errorData) {
        if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) {
            const firstError = errorData[firstKey];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMsg = `${firstKey}: ${firstError[0]}`;
            } else if (typeof firstError === 'string') {
              errorMsg = `${firstKey}: ${firstError}`;
            } else {
              errorMsg = `${firstKey}: ${JSON.stringify(firstError)}`;
            }
          }
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Filter Functions
  const filteredProducts = products.filter(product => {
    // Basic validation
    if (!product || !product.id || !product.name || product.name.trim() === '') {
      console.log('🔍 Filter: Product filtered out (missing id/name):', product);
      return false;
    }
    
    // Search filter
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower || 
                         (product.name && product.name.toLowerCase().includes(searchLower)) ||
                         (product.description && product.description && product.description.toLowerCase().includes(searchLower)) ||
                         (product.barcode && product.barcode && product.barcode.toString().toLowerCase().includes(searchLower));
    
    if (!matchesSearch && searchLower) {
      console.log('🔍 Filter: Product filtered out (search):', product.name, 'searchTerm:', searchLower);
      return false;
    }
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
                           !selectedCategory ||
                           !product.category || 
                           product.category === selectedCategory ||
                           product.category.toLowerCase() === selectedCategory.toLowerCase();
    
    if (!matchesCategory) {
      console.log('🔍 Filter: Product filtered out (category):', product.name, 'category:', product.category, 'selected:', selectedCategory);
      return false;
    }
    
    console.log('✅ Filter: Product passed all filters:', product.name);
    return true;
  });
  
  console.log('🔍 Filtered products count:', filteredProducts.length, 'out of', products.length);

  // Debug: Log when filtered products or filters change
  useEffect(() => {
    console.log('🔍 Filtered products updated:', filteredProducts.length, 'filtered products');
    console.log('🔍 Search term:', searchTerm, 'Category:', selectedCategory);
    console.log('🔍 Total products:', products.length);
  }, [filteredProducts.length, searchTerm, selectedCategory, products.length]);

  const filteredServices = services.filter(service => {
    if (!service || !service.id || !service.name) {
      return false;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower || 
                         (service.name && service.name.toLowerCase().includes(searchLower)) ||
                         (service.description && service.description.toLowerCase().includes(searchLower)) ||
                         (service.service_code && service.service_code && service.service_code.toString().toLowerCase().includes(searchLower));
    
    const matchesCategory = selectedCategory === 'all' || 
                           !service.category || 
                           service.category === selectedCategory;
    
    // Don't filter by service_price > 0 - allow all services to be displayed
    // Price validation will happen when adding to cart
    return matchesSearch && matchesCategory;
  });

  // Print Functions
  const printReceipt = () => {
    if (receiptRef.current) {
      const printContents = receiptRef.current.innerHTML;
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const summary = getSaleSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <FiShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
                <p className="text-gray-600">
                  {posSession ? 'Session Active' : 'No Active Session'}
                  {selectedStore && stores.length > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">
                      • {stores.find(s => s.id === selectedStore)?.name || `Store ${selectedStore}`}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Store Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Store:
                </label>
                <select
                  value={selectedStore || ''}
                  onChange={(e) => {
                    const newStoreId = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedStore(newStoreId);
                    // If session is active and store changed, show warning
                    if (posSession && newStoreId && posSession.store !== newStoreId) {
                      if (window.confirm('Changing store will close the current session. Continue?')) {
                        closeSession();
                        setTimeout(() => {
                          setSelectedStore(newStoreId);
                        }, 100);
                      } else {
                        // Revert selection
                        setSelectedStore(posSession.store);
                      }
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
                  disabled={posSession && !posSession.store}
                >
                  <option value="">{stores.length === 0 ? 'Loading...' : 'Select Store'}</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {posSession && posSession.store && (
                  <span className="text-xs text-gray-500">
                    (Locked during session)
                  </span>
                )}
              </div>

              {posSession ? (
                <button
                  onClick={closeSession}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiX className="h-4 w-4" />
                  Close Session
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!selectedStore && stores.length > 0) {
                      setShowStoreModal(true);
                      toast.error('Please select a store first');
                    } else if (!selectedStore) {
                      toast.error('No stores available. Please add a store first.');
                    } else {
                      openSession();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiCheckCircle className="h-4 w-4" />
                  Open Session
                </button>
              )}
              
              <button
                onClick={() => {
                  fetchProducts();
                  fetchServices();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              {/* Item Type Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setItemType('products');
                    setSelectedCategory('all');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    itemType === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => {
                    setItemType('services');
                    setSelectedCategory('all');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    itemType === 'services'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  Services
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder={itemType === 'products' ? 'Search products...' : 'Search services...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(itemType === 'products' ? categories : serviceCategories).map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products/Services Grid */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {itemType === 'products' ? 'Products' : 'Services'}
                </h2>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500">
                    {itemType === 'products' 
                      ? `Total: ${products.length}, Filtered: ${filteredProducts.length}`
                      : `Total: ${services.length}, Filtered: ${filteredServices.length}`}
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <FiRefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading {itemType}...</span>
                </div>
              ) : (itemType === 'products' ? filteredProducts.length === 0 : filteredServices.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FiShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg mb-2">
                    {itemType === 'products' 
                      ? (products.length === 0 
                          ? 'No products available. Please add products in the Inventory module.' 
                          : `No products found matching "${searchTerm}"${selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}`)
                      : (services.length === 0 
                          ? 'No services available. Please add services in the Services module.' 
                          : `No services found matching "${searchTerm}"${selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}`)}
                  </p>
                  {(itemType === 'products' ? products.length === 0 : services.length === 0) && (
                    <button
                      onClick={() => {
                        if (itemType === 'products') {
                          console.log('🔄 Manually refreshing products...');
                          fetchProducts();
                        } else {
                          console.log('🔄 Manually refreshing services...');
                          fetchServices();
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Refresh {itemType === 'products' ? 'Products' : 'Services'}
                    </button>
                  )}
                  {(itemType === 'products' ? products.length > 0 && filteredProducts.length === 0 : services.length > 0 && filteredServices.length === 0) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {itemType === 'products' ? (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => addToCart(product, 'product')}
                      >
                        <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FiShoppingCart className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-blue-600">
                            ${(product.price || 0).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Stock: {product.current_stock || 0}
                          </span>
                        </div>
                        <button
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
                          disabled={product.current_stock === 0 || !product.price || product.price <= 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.price > 0) {
                              addToCart(product, 'product');
                            } else {
                              toast.error('Product price must be greater than 0');
                            }
                          }}
                        >
                          {!product.price || product.price <= 0 ? 'Invalid Price' : product.current_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    ))
                  ) : (
                    filteredServices.map(service => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => addToCart(service, 'service')}
                      >
                        <div className="w-full h-24 bg-blue-50 rounded-lg mb-3 flex items-center justify-center">
                          <FiShoppingCart className="h-12 w-12 text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                          {service.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {service.description}
                        </p>
                        {service.duration_hours && (
                          <p className="text-xs text-gray-500 mb-2">{service.duration_hours} hrs</p>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-blue-600">
                            ${service.service_price.toFixed(2)}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            Service
                          </span>
                        </div>
                        <button
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(service, 'service');
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer</h3>
              <div className="space-y-3">
                <select
                  value={selectedCustomer || ''}
                  onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiUser className="h-4 w-4" />
                  Add New Customer
                </button>
              </div>
          </div>

            {/* Cart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Cart</h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Clear All
                  </button>
                )}
        </div>

          {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
              {cart.map((item, index) => {
                const itemId = item.item_type === 'product' ? item.product?.id : item.service?.id;
                const itemName = item.item_type === 'product' ? item.product?.name : item.service?.name;
                return (
                  <div key={`${item.item_type}-${itemId}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{itemName}</h4>
                      <p className="text-xs text-gray-600">
                        ${item.unit_price.toFixed(2)} each • {item.item_type === 'service' ? 'Service' : 'Product'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(itemId!, item.quantity - 1, item.item_type)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <FiMinus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(itemId!, item.quantity + 1, item.item_type)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <FiPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(itemId!, item.item_type)}
                        className="p-1 text-red-600 hover:text-red-700 ml-2"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`p-1 rounded ${method.color} text-white`}>
                      {method.icon}
                    </span>
                    <span className="text-sm font-medium">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {cart.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items ({summary.item_count})</span>
                    <span>${summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT</span>
                    <span>${summary.vat_total.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${summary.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Complete Sale button clicked', { loading, posSession, cartLength: cart.length });
                    processSale();
                  }}
                  disabled={loading || !posSession || cart.length === 0}
                  className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-green-300 disabled:cursor-not-allowed"
                  title={!posSession ? 'No active session' : cart.length === 0 ? 'Cart is empty' : loading ? 'Processing...' : 'Complete Sale'}
                >
                  {loading ? 'Processing...' : !posSession ? 'No Session' : cart.length === 0 ? 'Empty Cart' : 'Complete Sale'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Selection Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Select Store for POS Session</h2>
              <p className="text-sm text-gray-600 mt-1">Choose a store to start a POS session</p>
            </div>
            <div className="p-6 space-y-4">
              {stores.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No stores available</p>
                  <p className="text-sm text-gray-500">Please add a store first before starting a POS session.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store *
                    </label>
                    <select
                      value={selectedStore || ''}
                      onChange={(e) => setSelectedStore(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    >
                      <option value="">Select a store</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        if (selectedStore) {
                          setShowStoreModal(false);
                          openSession();
                        } else {
                          toast.error('Please select a store');
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Start Session
                    </button>
                    <button
                      onClick={() => setShowStoreModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Customer</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter customer address"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Sale Receipt</h2>
            </div>
            <div ref={receiptRef} className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">Finance Plus ERP</h3>
                <p className="text-sm text-gray-600">123 Business Street, Harare</p>
                <p className="text-sm text-gray-600">TIN: 123456789</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Receipt #:</span>
                  <span>{lastSale.fiscal_receipt_number}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Date:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span>Payment:</span>
                  <span className="uppercase">{(lastSale.payment_method || selectedPaymentMethod || '').replace(/_/g, ' ')}</span>
                </div>
                
                <div className="border-t pt-2">
                  {lastSale.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span>{item.product?.name || item.product_name || `Product ${item.product}`}</span>
                      <span>${Number(item.total_price || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${Number(lastSale.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT:</span>
                    <span>${Number(lastSale.tax_amount || lastSale.vat_total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total:</span>
                    <span>${Number(lastSale.total_amount || lastSale.total || 0).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="text-center mt-6 text-xs text-gray-600">
                  <p>Thank you for your business!</p>
                  <p>Fiscal Receipt - ZIMRA Compliant</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={printReceipt}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPrinter className="h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS; 