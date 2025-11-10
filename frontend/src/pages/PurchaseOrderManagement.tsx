import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiShoppingCart, FiPackage,
  FiTruck, FiCheckCircle, FiClock, FiDollarSign, FiFileText, FiX
} from 'react-icons/fi';
import { purchaseOrderService, vendorService, grnService, vendorBillService } from '../services/extendedApi';
import api from '../services/api';

interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_name: string;
  order_date: string;
  expected_delivery_date: string;
  total_amount: string;
  status: string;
  currency: number;
}

interface Vendor {
  id: number;
  name: string;
  vendor_code: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_price: number | string;
  quantity_in_stock: number;
}

interface PurchaseOrderItem {
  product?: number | null;
  description: string;
  quantity_ordered: number;
  unit_price: number;
  is_inventory_item: boolean;
}

const PurchaseOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [newItem, setNewItem] = useState<PurchaseOrderItem>({
    product: null,
    description: '',
    quantity_ordered: 0,
    unit_price: 0,
    is_inventory_item: true,
  });
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<PurchaseOrder | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Array<{method: string, amount: number, account_id?: number}>>([]);
  const [cashTills, setCashTills] = useState<any[]>([]);
  const [mobileMoneyAccounts, setMobileMoneyAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0);
  const [vendorBills, setVendorBills] = useState<any[]>([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedGRNForBill, setSelectedGRNForBill] = useState<any>(null);
  const [billFormData, setBillFormData] = useState({ bill_number: '', bill_date: '', due_date: '', reference: '', notes: '' });

  const markCompleted = async (order: PurchaseOrder) => {
    // If already completed, do nothing
    if (!order || order.status === 'COMPLETED') return;
    const prev = [...orders];
    // Optimistic update
    setOrders((cur) => cur.map((o) => (o.id === order.id ? { ...o, status: 'COMPLETED' } as PurchaseOrder : o)));
    try {
      await purchaseOrderService.update(order.id, { status: 'COMPLETED' });
      toast.success('Purchase order marked as completed');
    } catch (e: any) {
      // Revert on error
      setOrders(prev);
      toast.error('Failed to mark as completed');
    }
  };

  const [formData, setFormData] = useState({
    vendor: '',
    order_date: '',
    expected_delivery_date: '',
    delivery_address: '',
    delivery_contact_person: '',
    delivery_contact_phone: '',
    payment_terms: 'Net 30',
    notes: '',
    terms_and_conditions: '',
  });

  useEffect(() => {
    fetchOrders();
    fetchVendors();
    fetchProducts();
    fetchAccounts();
    fetchVendorBills();
  }, []);

  const fetchVendorBills = async () => {
    try {
      const response = await vendorBillService.getAll();
      setVendorBills(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to load vendor bills');
    }
  };

  const fetchAccounts = async () => {
    try {
      const [cashRes, mobileRes, bankRes] = await Promise.all([
        api.get('/cash-tills/'),
        api.get('/mobile-money-accounts/'),
        api.get('/bank-accounts/'),
      ]);
      setCashTills(cashRes.data.results || cashRes.data || []);
      setMobileMoneyAccounts(mobileRes.data.results || mobileRes.data || []);
      setBankAccounts(bankRes.data.results || bankRes.data || []);
    } catch (error) {
      console.error('Failed to load accounts');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/');
      setProducts(response.data.results || response.data || []);
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await purchaseOrderService.getAll();
      setOrders(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAll();
      setVendors(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load vendors');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.vendor) {
      toast.error('Please select a vendor');
      return;
    }
    if (!formData.order_date) {
      toast.error('Please select an order date');
      return;
    }
    if (!formData.expected_delivery_date) {
      toast.error('Please select an expected delivery date');
      return;
    }
    if (!formData.delivery_address || !formData.delivery_address.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }
    if (!formData.delivery_contact_person || !formData.delivery_contact_person.trim()) {
      toast.error('Please enter a contact person');
      return;
    }
    if (!formData.delivery_contact_phone || !formData.delivery_contact_phone.trim()) {
      toast.error('Please enter a contact phone');
      return;
    }
    if (!formData.payment_terms || !formData.payment_terms.trim()) {
      toast.error('Please enter payment terms');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Please add at least one item to the purchase order');
      return;
    }

    try {
      const payload = {
        vendor: Number(formData.vendor),
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date,
        delivery_address: formData.delivery_address.trim(),
        delivery_contact_person: formData.delivery_contact_person.trim(),
        delivery_contact_phone: formData.delivery_contact_phone.trim(),
        payment_terms: formData.payment_terms.trim(),
        notes: formData.notes?.trim() || '',
        terms_and_conditions: formData.terms_and_conditions?.trim() || '',
        items: items.map(item => ({
          product: item.product || null,
          description: item.description.trim(),
          quantity_ordered: Number(item.quantity_ordered),
          unit_price: Number(item.unit_price),
          is_inventory_item: item.is_inventory_item,
        })),
      };

      if (editingOrder) {
        await purchaseOrderService.update(editingOrder.id, payload);
        toast.success('Purchase order updated successfully');
      } else {
        console.log('Creating purchase order with payload:', payload);
        await purchaseOrderService.create(payload);
        toast.success('Purchase order created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchOrders();
    } catch (error: any) {
      console.error('Purchase order save error:', error);
      console.error('Error response:', error?.response?.data);
      const errorData = error?.response?.data;
      let errorMsg = 'Failed to save purchase order';
      if (errorData) {
        if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.message) {
          errorMsg = errorData.message;
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
    }
  };

  const addItem = () => {
    if (!newItem.description.trim() || newItem.quantity_ordered <= 0 || newItem.unit_price <= 0) {
      toast.error('Please fill in all item fields (product name, quantity, and unit price)');
      return;
    }

    const item: PurchaseOrderItem = {
      ...newItem,
      description: newItem.description.trim(),
    };

    setItems([...items, item]);
    setNewItem({
      product: null,
      description: '',
      quantity_ordered: 0,
      unit_price: 0,
      is_inventory_item: true,
    });
    setShowProductSearch(false);
    setProductSearchQuery('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewItem({
        ...newItem,
        product: productId,
        description: product.name,
        unit_price: Number(product.unit_price || 0),
      });
      setShowProductSearch(false);
      setProductSearchQuery('');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
  ).slice(0, 5);

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: 'CASH', amount: 0 }]);
  };

  const updateTotalPayment = () => {
    const total = paymentMethods.reduce((sum, pm) => sum + (Number(pm.amount) || 0), 0);
    setTotalPaymentAmount(total);
  };

  const removePaymentMethod = (index: number) => {
    const updated = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(updated);
    const total = updated.reduce((sum, pm) => sum + (Number(pm.amount) || 0), 0);
    setTotalPaymentAmount(total);
  };

  const updatePaymentMethod = (index: number, field: string, value: any) => {
    const updated = [...paymentMethods];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentMethods(updated);
    const total = updated.reduce((sum, pm) => sum + (Number(pm.amount) || 0), 0);
    setTotalPaymentAmount(total);
  };

  const handleProcessPayment = async () => {
    if (!selectedOrderForPayment) return;

    if (paymentMethods.length === 0) {
      toast.error('Please add at least one payment method');
      return;
    }

    const total = paymentMethods.reduce((sum, pm) => sum + (Number(pm.amount) || 0), 0);
    if (total <= 0) {
      toast.error('Total payment amount must be greater than 0');
      return;
    }

    const orderTotal = Number(selectedOrderForPayment.total_amount || 0);
    if (total > orderTotal) {
      toast.error(`Payment amount ($${total.toFixed(2)}) exceeds order total ($${orderTotal.toFixed(2)})`);
      return;
    }

    try {
      // First, we need to get or create a GRN for this PO
      // For now, let's assume there's a GRN or we'll need to create one first
      // This is a simplified version - in production, you'd want to handle GRN creation first
      
      // Get GRN for this purchase order
      const grnsResponse = await grnService.getAll({ purchase_order: selectedOrderForPayment.id });
      const grns = grnsResponse.data.results || grnsResponse.data || [];
      
      if (grns.length === 0) {
        toast.error('Please receive the goods first (create GRN) before processing payment');
        return;
      }

      const grn = grns[0]; // Use the first GRN

      // Process payment
      const payments = paymentMethods.map(pm => ({
        method: pm.method,
        amount: Number(pm.amount),
        account_id: pm.account_id || undefined,
      }));

      await grnService.processPayment(grn.id, payments);
      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setPaymentMethods([]);
      setTotalPaymentAmount(0);
      fetchOrders();
    } catch (error: any) {
      const errorData = error?.response?.data;
      let errorMsg = 'Failed to process payment';
      if (errorData) {
        if (errorData.error) {
          errorMsg = errorData.error;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        }
      }
      toast.error(errorMsg);
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this purchase order?')) return;
    
    try {
      await purchaseOrderService.approve(id);
      toast.success('Purchase order approved successfully!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to approve purchase order');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    
    try {
      await purchaseOrderService.delete(id);
      toast.success('Purchase order deleted successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete purchase order');
    }
  };

  const resetForm = () => {
    setEditingOrder(null);
    setItems([]);
    setNewItem({
      product: null,
      description: '',
      quantity_ordered: 0,
      unit_price: 0,
      is_inventory_item: true,
    });
    setShowProductSearch(false);
    setProductSearchQuery('');
    setFormData({
      vendor: '',
      order_date: '',
      expected_delivery_date: '',
      delivery_address: '',
      delivery_contact_person: '',
      delivery_contact_phone: '',
      payment_terms: 'Net 30',
      notes: '',
      terms_and_conditions: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-yellow-100 text-yellow-800',
      PARTIALLY_RECEIVED: 'bg-purple-100 text-purple-800',
      RECEIVED: 'bg-green-100 text-green-800',
      BILLED: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: any = {
      DRAFT: FiFileText,
      SENT: FiClock,
      CONFIRMED: FiCheckCircle,
      PARTIALLY_RECEIVED: FiPackage,
      RECEIVED: FiTruck,
      COMPLETED: FiCheckCircle,
    };
    const Icon = icons[status] || FiShoppingCart;
    return <Icon className="h-5 w-5" />;
  };

  const filteredOrders = orders.filter(order =>
    filterStatus === 'ALL' || order.status === filterStatus
  );

  const stats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'DRAFT').length,
    sent: orders.filter(o => o.status === 'SENT').length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
    totalValue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
        <p className="text-gray-600">Manage your purchase orders and track deliveries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Orders</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiShoppingCart className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Draft</p>
              <p className="text-3xl font-bold mt-2">{stats.draft}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFileText className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Sent</p>
              <p className="text-3xl font-bold mt-2">{stats.sent}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiClock className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Value</p>
              <p className="text-2xl font-bold mt-2">${stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiPlus className="h-5 w-5" />
            Create PO
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{order.po_number}</h3>
                <p className="text-sm text-gray-500">{order.vendor_name}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingOrder(order);
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(order.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiClock className="h-4 w-4 text-gray-400" />
                <span>Order Date: {new Date(order.order_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiTruck className="h-4 w-4 text-gray-400" />
                <span>Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiDollarSign className="h-4 w-4 text-gray-400" />
                <span className="font-semibold">${parseFloat(order.total_amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {order.status === 'DRAFT' && (
              <button
                onClick={() => handleApprove(order.id)}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Approve & Send
              </button>
            )}
            
            {/* Industry standard workflow: GRN -> Vendor Bill -> Payment */}
            {(order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED' || order.status === 'CONFIRMED' || order.status === 'SENT') && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={async () => {
                    try {
                      // Check if GRN exists and is accepted
                      const grnsResponse = await grnService.getAll({ purchase_order: order.id });
                      let grns = grnsResponse.data.results || grnsResponse.data || [];
                      
                      if (grns.length === 0) {
                        toast.error('Please receive the goods first (create GRN) before creating a vendor bill');
                        return;
                      }
                      
                      // Find accepted GRN
                      const acceptedGRN = grns.find((grn: any) => grn.status === 'ACCEPTED');
                      if (!acceptedGRN) {
                        toast.error('GRN must be accepted before creating a vendor bill');
                        return;
                      }
                      
                      // Check if bill already exists
                      const billsResponse = await vendorBillService.getAll({ purchase_order: order.id });
                      const existingBills = billsResponse.data.results || billsResponse.data || [];
                      if (existingBills.length > 0) {
                        toast.info(`Vendor bill already exists: ${existingBills[0].bill_number}`);
                        return;
                      }
                      
                      setSelectedGRNForBill(acceptedGRN);
                      setBillFormData({
                        bill_number: '',
                        bill_date: new Date().toISOString().split('T')[0],
                        due_date: '',
                        reference: order.po_number,
                        notes: ''
                      });
                      setShowBillModal(true);
                    } catch (error: any) {
                      toast.error('Failed to load GRN information: ' + (error?.message || 'Unknown error'));
                    }
                  }}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <span className="inline-flex items-center gap-2">
                    <FiFileText className="h-4 w-4" />
                    Create Vendor Bill
                  </span>
                </button>
                
                {/* Show vendor bills for this PO */}
                {(() => {
                  const poBills = vendorBills.filter((bill: any) => bill.purchase_order === order.id);
                  if (poBills.length > 0) {
                    return (
                      <div className="space-y-2 mt-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">Vendor Bills:</div>
                        {poBills.map((bill: any) => (
                          <div key={bill.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-medium text-sm">{bill.bill_number}</span>
                                {bill.reference && (
                                  <span className="text-xs text-gray-500 ml-2">({bill.reference})</span>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                bill.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                bill.status === 'TO_APPROVE' ? 'bg-yellow-100 text-yellow-800' :
                                bill.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                bill.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {bill.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              Amount: ${parseFloat(bill.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {bill.paid_amount > 0 && (
                                <span className="ml-2">Paid: ${parseFloat(bill.paid_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              )}
                            </div>
                            
                            {/* DRAFT: Submit for approval */}
                            {bill.status === 'DRAFT' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await vendorBillService.submitForApproval(bill.id);
                                    toast.success('Vendor bill submitted for approval');
                                    fetchVendorBills();
                                  } catch (error: any) {
                                    toast.error('Failed to submit bill: ' + (error?.response?.data?.detail || error?.message));
                                  }
                                }}
                                className="w-full px-2 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 font-medium"
                              >
                                Submit for Approval
                              </button>
                            )}
                            
                            {/* TO_APPROVE: Approve or Reject */}
                            {bill.status === 'TO_APPROVE' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await vendorBillService.approve(bill.id);
                                      toast.success('Vendor bill approved');
                                      fetchVendorBills();
                                      fetchOrders();
                                    } catch (error: any) {
                                      toast.error('Failed to approve bill: ' + (error?.response?.data?.detail || error?.message));
                                    }
                                  }}
                                  className="flex-1 px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) {
                                      try {
                                        await vendorBillService.reject(bill.id, reason);
                                        toast.success('Vendor bill rejected');
                                        fetchVendorBills();
                                      } catch (error: any) {
                                        toast.error('Failed to reject bill: ' + (error?.response?.data?.detail || error?.message));
                                      }
                                    }
                                  }}
                                  className="flex-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 font-medium"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            
                            {/* APPROVED: Process Payment */}
                            {bill.status === 'APPROVED' && (
                              <button
                                onClick={async () => {
                                  try {
                                    // Check if GRN exists for payment
                                    const grnsResponse = await grnService.getAll({ purchase_order: order.id });
                                    let grns = grnsResponse.data.results || grnsResponse.data || [];
                                    const grn = grns.find((g: any) => g.id === bill.grn);
                                    if (grn) {
                                      setSelectedOrderForPayment(order);
                                      setShowPaymentModal(true);
                                      setPaymentMethods([]);
                                      setTotalPaymentAmount(0);
                                    } else {
                                      toast.error('GRN not found for payment processing');
                                    }
                                  } catch (error) {
                                    toast.error('Failed to load payment information');
                                  }
                                }}
                                className="w-full px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium"
                              >
                                Process Payment
                              </button>
                            )}
                            
                            {/* REJECTED: Show reason */}
                            {bill.status === 'REJECTED' && bill.rejection_reason && (
                              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                <strong>Rejection Reason:</strong> {bill.rejection_reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            
            {/* Quick complete: allow explicit completion without creating additional records */}
            {order.status !== 'COMPLETED' && order.status !== 'BILLED' && (
              <button
                onClick={() => markCompleted(order)}
                className="w-full mt-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors text-sm font-medium"
                title="Mark this purchase order as fully completed"
              >
                <span className="inline-flex items-center gap-2">
                  <FiCheckCircle className="h-4 w-4" />
                  Mark Completed
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No purchase orders found</p>
          <p className="text-gray-400 mb-4">Create your first purchase order</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-5 w-5" />
            Create PO
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor *
                  </label>
                  <select
                    required
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.vendor_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.delivery_contact_person}
                    onChange={(e) => setFormData({ ...formData, delivery_contact_person: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.delivery_contact_phone}
                    onChange={(e) => setFormData({ ...formData, delivery_contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
                
                {/* Add Item Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name / Description *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newItem.description}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewItem({ ...newItem, description: value });
                            setProductSearchQuery(value);
                            setShowProductSearch(value.length > 0 && products.length > 0);
                          }}
                          onFocus={() => {
                            if (newItem.description && products.length > 0) {
                              setShowProductSearch(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding to allow click on dropdown items
                            setTimeout(() => setShowProductSearch(false), 200);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter product name (e.g., Car, Office Chair)"
                        />
                        {showProductSearch && productSearchQuery && filteredProducts.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                              Select existing product or continue typing to add new
                            </div>
                            {filteredProducts.map((product) => (
                              <div
                                key={product.id}
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent onBlur from firing
                                  handleProductSelect(product.id);
                                }}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500">SKU: {product.sku} | ${Number(product.unit_price || 0).toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {showProductSearch && productSearchQuery && filteredProducts.length === 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                            <div className="px-3 py-2 text-xs text-gray-500">
                              No matching products. Continue typing to create new item.
                            </div>
                          </div>
                        )}
                      </div>
                      {products.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductSearch(!showProductSearch);
                            if (!showProductSearch) {
                              setProductSearchQuery(newItem.description);
                            } else {
                              setProductSearchQuery('');
                            }
                          }}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          {showProductSearch ? 'Hide' : 'Show'} product search
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newItem.quantity_ordered || ''}
                        onChange={(e) => setNewItem({ ...newItem, quantity_ordered: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newItem.unit_price || ''}
                        onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={newItem.is_inventory_item ? 'inventory' : 'non-inventory'}
                        onChange={(e) => setNewItem({ ...newItem, is_inventory_item: e.target.value === 'inventory' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="inventory">Inventory Item</option>
                        <option value="non-inventory">Non-Inventory</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Added Items ({items.length})</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-700">Product</th>
                            <th className="px-4 py-2 text-left text-gray-700">Qty</th>
                            <th className="px-4 py-2 text-left text-gray-700">Unit Price</th>
                            <th className="px-4 py-2 text-left text-gray-700">Total</th>
                            <th className="px-4 py-2 text-left text-gray-700">Type</th>
                            <th className="px-4 py-2 text-left text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {items.map((item, index) => {
                            const product = item.product ? products.find(p => p.id === item.product) : null;
                            const total = Number(item.quantity_ordered || 0) * Number(item.unit_price || 0);
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                  <div>
                                    <div className="font-medium">{item.description}</div>
                                    {product && (
                                      <div className="text-xs text-gray-500">Linked to: {product.name} ({product.sku})</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2">{item.quantity_ordered}</td>
                                <td className="px-4 py-2">${Number(item.unit_price || 0).toFixed(2)}</td>
                                <td className="px-4 py-2 font-medium">${Number(total || 0).toFixed(2)}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    item.is_inventory_item 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {item.is_inventory_item ? 'Inventory' : 'Non-Inventory'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <FiX className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right font-medium">Total:</td>
                            <td className="px-4 py-2 font-bold">
                              ${items.reduce((sum, item) => sum + (Number(item.quantity_ordered || 0) * Number(item.unit_price || 0)), 0).toFixed(2)}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Process Payment - {selectedOrderForPayment.po_number}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Total Amount: ${Number(selectedOrderForPayment.total_amount || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Methods */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                  <button
                    onClick={addPaymentMethod}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add Payment Method
                  </button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No payment methods added. Click "Add Payment Method" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((pm, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Method *
                            </label>
                            <select
                              value={pm.method}
                              onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="CASH">Cash</option>
                              <option value="MOBILE_MONEY">Mobile Money</option>
                              <option value="BANK">Bank Transfer</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Amount *
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={pm.amount || ''}
                              onChange={(e) => {
                                updatePaymentMethod(index, 'amount', e.target.value);
                                updateTotalPayment();
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account
                            </label>
                            <select
                              value={pm.account_id || ''}
                              onChange={(e) => updatePaymentMethod(index, 'account_id', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Account</option>
                              {pm.method === 'CASH' && cashTills.map(till => (
                                <option key={till.id} value={till.id}>
                                  {till.account_name} (${Number(till.current_balance || 0).toFixed(2)})
                                </option>
                              ))}
                              {pm.method === 'MOBILE_MONEY' && mobileMoneyAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.account_name} (${Number(account.current_balance || 0).toFixed(2)})
                                </option>
                              ))}
                              {pm.method === 'BANK' && bankAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  {account.account_name} (${Number(account.current_balance || 0).toFixed(2)})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removePaymentMethod(index)}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <FiX className="h-4 w-4 inline" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              {paymentMethods.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Payment:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${totalPaymentAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Order Total:</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${Number(selectedOrderForPayment.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Remaining:</span>
                    <span className={`text-sm font-medium ${
                      (Number(selectedOrderForPayment.total_amount || 0) - totalPaymentAmount) < 0
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      ${(Number(selectedOrderForPayment.total_amount || 0) - totalPaymentAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedOrderForPayment(null);
                    setPaymentMethods([]);
                    setTotalPaymentAmount(0);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={paymentMethods.length === 0 || totalPaymentAmount <= 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Process Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Bill Creation Modal */}
      {showBillModal && selectedGRNForBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Create Vendor Bill
                </h2>
                <button
                  onClick={() => {
                    setShowBillModal(false);
                    setSelectedGRNForBill(null);
                    setBillFormData({ bill_number: '', bill_date: '', due_date: '', reference: '', notes: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                GRN: {selectedGRNForBill.grn_number || selectedGRNForBill.id}
              </p>
            </div>

            <div className="p-6">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await grnService.createBill(selectedGRNForBill.id, billFormData);
                    toast.success('Vendor bill created successfully');
                    setShowBillModal(false);
                    setSelectedGRNForBill(null);
                    setBillFormData({ bill_number: '', bill_date: '', due_date: '', reference: '', notes: '' });
                    fetchVendorBills();
                    fetchOrders();
                  } catch (error: any) {
                    toast.error('Failed to create vendor bill: ' + (error?.response?.data?.detail || error?.message || 'Unknown error'));
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bill Number
                    </label>
                    <input
                      type="text"
                      value={billFormData.bill_number}
                      onChange={(e) => setBillFormData({ ...billFormData, bill_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="VB-2025-XXXXXX (auto-generated if empty)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Vendor invoice/bill number (leave empty to auto-generate)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bill Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={billFormData.bill_date}
                      onChange={(e) => setBillFormData({ ...billFormData, bill_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={billFormData.due_date}
                      onChange={(e) => setBillFormData({ ...billFormData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={billFormData.reference}
                      onChange={(e) => setBillFormData({ ...billFormData, reference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Internal reference"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={billFormData.notes}
                    onChange={(e) => setBillFormData({ ...billFormData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Additional notes about this bill"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Bill will be created with status: DRAFT</h4>
                  <p className="text-xs text-blue-700">
                    After creation, you can submit it for approval. The bill will include all items from the GRN.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBillModal(false);
                      setSelectedGRNForBill(null);
                      setBillFormData({ bill_number: '', bill_date: '', due_date: '', reference: '', notes: '' });
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Create Bill
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderManagement;

