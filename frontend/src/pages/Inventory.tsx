import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Product {
  id: number;
  product_code: string; // maps to backend sku
  product_name: string; // maps to backend name
  description: string;
  category: string;
  unit_price: number;
  cost_price: number;
  current_stock: number; // maps to backend quantity_in_stock
  reorder_level: number; // maps to backend minimum_stock_level
  supplier: string;
  is_active: boolean;
  created_date: string;
  store?: number;
  store_name?: string;
}

interface StockMovement {
  id: number;
  product_name: string;
  product_code: string;
  movement_type: string;
  movement_type_display: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  reference: string;
  movement_date: string;
  notes: string;
}

interface Purchase {
  id: number;
  purchase_number: string;
  supplier_name: string;
  purchase_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  status_display: string;
  notes: string;
}

interface Sale {
  id: number;
  sale_number: string;
  customer_name: string;
  sale_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  status_display: string;
  notes: string;
}

interface StoreOption {
  id: number;
  name: string;
}

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const tabs = [
    { key: 'products', label: 'Products' },
    { key: 'stock-movements', label: 'Stock Movements' },
    { key: 'purchases', label: 'Purchases' },
    { key: 'sales', label: 'Sales' },
    { key: 'reports', label: 'Reports' },
  ];

  useEffect(() => {
    fetchStores();
    fetchData();
  }, [activeTab]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'products':
          {
            const res = await api.get('/products/');
            const raw = res.data?.results || res.data || [];
            const list = (Array.isArray(raw) ? raw : []).map((p: any) => {
              const storeObj = stores.find(s => s.id === p.store);
              return {
                id: p.id,
                product_code: p.sku || '',
                product_name: p.name || '',
                description: p.description || '',
                category: p.category || '',
                unit_price: Number(p.unit_price || 0),
                cost_price: Number(p.cost_price || 0),
                current_stock: Number(p.quantity_in_stock || p.quantity || 0),
                reorder_level: Number(p.minimum_stock_level || p.reorder_level || 0),
                supplier: p.supplier || '',
                is_active: p.is_active ?? true,
                created_date: p.created_at || '',
                store: p.store || undefined,
                store_name: storeObj?.name || (p.store ? `Store ${p.store}` : undefined)
              } as Product;
            });
            setProducts(list);
          }
          break;
        case 'stock-movements':
          {
            const res = await api.get('/stock-movements/');
            const raw = res.data?.results || res.data || [];
            const list = Array.isArray(raw) ? raw : [];
            setStockMovements(list as any);
          }
          break;
        case 'purchases':
          {
            // Derive purchases as IN stock movements
            const res = await api.get('/stock-movements/', { params: { movement_type: 'IN' } });
            const raw = res.data?.results || res.data || [];
            const list = (Array.isArray(raw) ? raw : []).map((m: any) => ({
              id: m.id,
              purchase_number: m.reference || `PUR-${m.id}`,
              supplier_name: m.supplier_name || m.notes || 'Supplier',
              purchase_date: m.movement_date || m.created_at || new Date().toISOString(),
              due_date: m.due_date || m.movement_date || new Date().toISOString(),
              total_amount: Number(m.total_amount || (m.quantity || 0) * (m.unit_price || 0)),
              paid_amount: Number(m.paid_amount || 0),
              balance: Number(m.balance || 0),
              status: m.status || 'PENDING',
              status_display: m.status_display || m.movement_type_display || 'Pending',
              notes: m.notes || ''
            } as Purchase));
            setPurchases(list as any);
          }
          break;
        case 'sales':
          {
            const res = await api.get('/pos-sales/');
            const raw = res.data?.results || res.data || [];
            const list = (Array.isArray(raw) ? raw : []).map((s: any) => ({
              id: s.id,
              sale_number: s.sale_number || `SALE-${s.id}`,
              customer_name: s.customer_name || '',
              sale_date: s.created_at || s.date || new Date().toISOString(),
              total_amount: Number(s.total_amount || 0),
              paid_amount: Number(s.paid_amount || 0),
              balance: Number(s.balance || 0),
              status: s.status || 'DRAFT',
              status_display: s.status || 'Draft',
              notes: s.notes || ''
            } as Sale));
            setSales(list as any);
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      switch (modalType) {
        case 'product':
          // Validate required fields
          if (!formData.product_code || !formData.product_name) {
            alert('Product Code and Product Name are required');
            setLoading(false);
            return;
          }
          if (!formData.unit_price || Number(formData.unit_price) <= 0) {
            alert('Unit Price is required and must be greater than 0');
            setLoading(false);
            return;
          }
          
          const productPayload = {
            sku: formData.product_code,
            name: formData.product_name,
            description: formData.description || '',
            category: formData.category || 'General',
            unit_price: Number(formData.unit_price || 0),
            cost_price: Number(formData.cost_price || 0),
            quantity_in_stock: Number(formData.current_stock || 0),
            minimum_stock_level: Number(formData.reorder_level || 0),
            store: formData.store || null,
            is_active: editingProduct ? editingProduct.is_active : true,
          };

          if (editingProduct) {
            // Update existing product
            await api.put(`/products/${editingProduct.id}/`, productPayload);
            alert('Product updated successfully!');
          } else {
            // Create new product
            await api.post('/products/', productPayload);
            alert('Product created successfully!');
          }
          break;
        case 'stock-movement':
          await api.post('/stock-movements/', {
            product: formData.product_id,
            movement_type: formData.movement_type,
            quantity: Number(formData.quantity || 0),
            unit_price: Number(formData.unit_price || 0),
            reference: formData.reference,
            notes: formData.notes,
            movement_date: formData.movement_date || new Date().toISOString().slice(0, 10),
          });
          break;
        case 'purchase':
          // Create as IN stock movement
          await api.post('/stock-movements/', {
            product: formData.product_id,
            movement_type: 'IN',
            quantity: Number(formData.quantity || 0),
            unit_price: Number(formData.total_amount || 0),
            reference: formData.reference || 'PURCHASE',
            notes: formData.notes || formData.supplier_name,
            movement_date: formData.purchase_date || new Date().toISOString().slice(0, 10),
          });
          break;
        case 'sale':
          await api.post('/pos-sales/', {
            customer_name: formData.customer_name,
            total_amount: Number(formData.total_amount || 0),
            payment_method: 'CASH',
            status: 'DRAFT',
          });
          break;
      }

      setShowModal(false);
      setFormData({});
      setEditingProduct(null);
      fetchData();
    } catch (error: any) {
      console.error('Error creating record:', error);
      const errorData = error?.response?.data;
      let errorMsg = 'Failed to create record';
      if (errorData) {
        // Extract first error message
        const firstKey = Object.keys(errorData)[0];
        if (firstKey && Array.isArray(errorData[firstKey])) {
          errorMsg = `${firstKey}: ${errorData[firstKey][0]}`;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMsg = errorData;
        }
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: string, product?: Product) => {
    setModalType(type);
    setShowModal(true);
    if (product) {
      setEditingProduct(product);
      setFormData({
        product_code: product.product_code,
        product_name: product.product_name,
        description: product.description,
        category: product.category,
        unit_price: product.unit_price,
        cost_price: product.cost_price,
        current_stock: product.current_stock,
        reorder_level: product.reorder_level,
        supplier: product.supplier,
        store: product.store || null,
      });
    } else {
      setEditingProduct(null);
      setFormData({});
    }
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete(`/products/${productId}/`);
      alert('Product deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      const errorData = error?.response?.data;
      let errorMsg = 'Failed to delete product';
      if (errorData) {
        if (errorData.detail) {
          errorMsg = errorData.detail;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMsg = errorData;
        }
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
  };

  const renderProducts = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Products</h3>
        <button
          onClick={() => openModal('product')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Add Product
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow border hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h4 
                className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600"
                onClick={() => handleView(product)}
                title="Click to view details"
              >
                {product.product_name}
              </h4>
              <span className={`px-2 py-1 rounded text-xs ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Code: {product.product_code}</p>
            <p className="text-sm text-gray-600 mb-2">Category: {product.category}</p>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Unit Price: <span className="font-semibold">${product.unit_price.toLocaleString()}</span></p>
              <p className="text-sm">Cost Price: <span className="font-semibold">${product.cost_price.toLocaleString()}</span></p>
              <p className="text-sm">Current Stock: <span className={`font-semibold ${product.current_stock <= product.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                {product.current_stock}
              </span></p>
              <p className="text-sm">Reorder Level: <span className="font-semibold">{product.reorder_level}</span></p>
            </div>
            <div className="text-xs text-gray-500 mb-3">
              <div>Supplier: {product.supplier || 'N/A'}</div>
              {product.store_name && (
                <div>Store: {product.store_name}</div>
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => handleView(product)}
                className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition"
              >
                View
              </button>
              <button
                onClick={() => openModal('product', product)}
                className="flex-1 px-3 py-1.5 bg-green-50 text-green-600 rounded text-sm hover:bg-green-100 transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 transition"
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStockMovements = () => (
        <div>
          <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Stock Movements</h3>
        <button 
          onClick={() => openModal('stock-movement')}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + Add Movement
        </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Product</th>
              <th className="py-2 px-4 text-left">Type</th>
              <th className="py-2 px-4 text-left">Quantity</th>
              <th className="py-2 px-4 text-left">Unit Price</th>
              <th className="py-2 px-4 text-left">Total Amount</th>
              <th className="py-2 px-4 text-left">Reference</th>
                </tr>
              </thead>
              <tbody>
            {stockMovements.map(movement => (
              <tr key={movement.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{new Date(movement.movement_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{movement.product_name}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    movement.movement_type === 'IN' ? 'bg-green-100 text-green-800' :
                    movement.movement_type === 'OUT' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {movement.movement_type_display}
                  </span>
                </td>
                <td className="py-2 px-4 font-semibold">{movement.quantity}</td>
                <td className="py-2 px-4">${movement.unit_price.toLocaleString()}</td>
                <td className="py-2 px-4 font-semibold">${movement.total_amount.toLocaleString()}</td>
                <td className="py-2 px-4">{movement.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                  </div>
  );

  const renderPurchases = () => (
        <div>
          <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Purchases</h3>
        <button 
          onClick={() => openModal('purchase')}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          + Add Purchase
        </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Purchase #</th>
              <th className="py-2 px-4 text-left">Supplier</th>
              <th className="py-2 px-4 text-left">Purchase Date</th>
              <th className="py-2 px-4 text-left">Due Date</th>
              <th className="py-2 px-4 text-left">Total Amount</th>
              <th className="py-2 px-4 text-left">Paid</th>
              <th className="py-2 px-4 text-left">Balance</th>
              <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
            {purchases.map(purchase => (
              <tr key={purchase.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-medium">{purchase.purchase_number}</td>
                <td className="py-2 px-4">{purchase.supplier_name}</td>
                <td className="py-2 px-4">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{new Date(purchase.due_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">${purchase.total_amount.toLocaleString()}</td>
                <td className="py-2 px-4">${purchase.paid_amount.toLocaleString()}</td>
                <td className="py-2 px-4 font-semibold text-red-600">${purchase.balance.toLocaleString()}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    purchase.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    purchase.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {purchase.status_display}
                  </span>
                </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                  </div>
  );

  const renderSales = () => (
        <div>
          <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Sales</h3>
        <button 
          onClick={() => openModal('sale')}
          className="bg-orange-600 text-white px-4 py-2 rounded shadow hover:bg-orange-700 transition"
        >
          + Add Sale
        </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Sale #</th>
              <th className="py-2 px-4 text-left">Customer</th>
              <th className="py-2 px-4 text-left">Sale Date</th>
              <th className="py-2 px-4 text-left">Total Amount</th>
              <th className="py-2 px-4 text-left">Paid</th>
              <th className="py-2 px-4 text-left">Balance</th>
              <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
            {sales.map(sale => (
              <tr key={sale.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-medium">{sale.sale_number}</td>
                <td className="py-2 px-4">{sale.customer_name}</td>
                <td className="py-2 px-4">{new Date(sale.sale_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">${sale.total_amount.toLocaleString()}</td>
                <td className="py-2 px-4">${sale.paid_amount.toLocaleString()}</td>
                <td className="py-2 px-4 font-semibold text-green-600">${sale.balance.toLocaleString()}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    sale.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    sale.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {sale.status_display}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Inventory Reports</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Products</h5>
          <p className="text-2xl font-bold text-blue-600">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Low Stock Items</h5>
          <p className="text-2xl font-bold text-red-600">
            {products.filter(p => p.current_stock <= p.reorder_level).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Purchases</h5>
          <p className="text-2xl font-bold text-purple-600">${purchases.reduce((sum, p) => sum + p.total_amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Sales</h5>
          <p className="text-2xl font-bold text-green-600">${sales.reduce((sum, s) => sum + s.total_amount, 0).toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Low Stock Alerts</h4>
        <div className="space-y-2">
          {products.filter(p => p.current_stock <= p.reorder_level).map(product => (
            <div key={product.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-medium">{product.product_name}</p>
                <p className="text-sm text-gray-600">Current Stock: {product.current_stock} | Reorder Level: {product.reorder_level}</p>
              </div>
              <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Low Stock</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const getModalTitle = () => {
      switch (modalType) {
        case 'product': return editingProduct ? 'Edit Product' : 'Add Product';
        case 'stock-movement': return 'Add Stock Movement';
        case 'purchase': return 'Add Purchase';
        case 'sale': return 'Add Sale';
        default: return 'Add Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'product':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Product Code"
                value={formData.product_code || ''}
                onChange={(e) => setFormData({...formData, product_code: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Product Name"
                value={formData.product_name || ''}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Category"
                value={formData.category || ''}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Unit Price"
                value={formData.unit_price || ''}
                onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Cost Price"
                value={formData.cost_price || ''}
                onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Initial Stock"
                value={formData.current_stock || ''}
                onChange={(e) => setFormData({...formData, current_stock: parseInt(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Reorder Level"
                value={formData.reorder_level || ''}
                onChange={(e) => setFormData({...formData, reorder_level: parseInt(e.target.value)})}
              />
              {stores.length > 0 && (
                <select 
                  className="w-full border rounded px-3 py-2 mb-3"
                  value={formData.store || ''}
                  onChange={(e) => setFormData({...formData, store: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">Select Store (Optional)</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              )}
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Supplier"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              />
            </>
          );
        case 'stock-movement':
          return (
            <>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.product_id || ''}
                onChange={(e) => setFormData({...formData, product_id: parseInt(e.target.value)})}
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.product_name}</option>
                ))}
              </select>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.movement_type || ''}
                onChange={(e) => setFormData({...formData, movement_type: e.target.value})}
              >
                <option value="">Select Movement Type</option>
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Quantity"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Unit Price"
                value={formData.unit_price || ''}
                onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Reference"
                value={formData.reference || ''}
                onChange={(e) => setFormData({...formData, reference: e.target.value})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </>
          );
        case 'purchase':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Supplier Name"
                value={formData.supplier_name || ''}
                onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Purchase Date"
                value={formData.purchase_date || ''}
                onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Due Date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Total Amount"
                value={formData.total_amount || ''}
                onChange={(e) => setFormData({...formData, total_amount: parseFloat(e.target.value)})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </>
          );
        case 'sale':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Customer Name"
                value={formData.customer_name || ''}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Sale Date"
                value={formData.sale_date || ''}
                onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Total Amount"
                value={formData.total_amount || ''}
                onChange={(e) => setFormData({...formData, total_amount: parseFloat(e.target.value)})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h4 className="text-lg font-bold mb-4">{getModalTitle()}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            {getModalFields()}
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="px-4 py-2 rounded bg-gray-200" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-blue-600 text-white"
                disabled={loading}
              >
                {loading ? (editingProduct ? 'Updating...' : 'Saving...') : (editingProduct ? 'Update' : 'Save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-teal-700">Inventory Management</h2>
      
      <div className="mb-6 flex gap-4 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'border-teal-600 text-teal-700' 
                : 'border-transparent text-gray-500 hover:text-teal-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'stock-movements' && renderStockMovements()}
          {activeTab === 'purchases' && renderPurchases()}
          {activeTab === 'sales' && renderSales()}
          {activeTab === 'reports' && renderReports()}
        </>
      )}

      {renderModal()}

      {/* View Product Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-bold">Product Details</h4>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                  <p className="text-gray-900 font-semibold">{viewingProduct.product_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <p className="text-gray-900 font-semibold">{viewingProduct.product_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{viewingProduct.category || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded text-xs ${viewingProduct.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {viewingProduct.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <p className="text-gray-900 font-semibold">${viewingProduct.unit_price.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                  <p className="text-gray-900 font-semibold">${viewingProduct.cost_price.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <p className={`font-semibold ${viewingProduct.current_stock <= viewingProduct.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                    {viewingProduct.current_stock}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <p className="text-gray-900 font-semibold">{viewingProduct.reorder_level}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <p className="text-gray-900">{viewingProduct.supplier || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-gray-900">
                    {viewingProduct.created_date ? new Date(viewingProduct.created_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {viewingProduct.store_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                    <p className="text-gray-900 font-semibold">{viewingProduct.store_name}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingProduct.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setViewingProduct(null);
                  openModal('product', viewingProduct);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Edit Product
              </button>
              <button
                onClick={() => setViewingProduct(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;