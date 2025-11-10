import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import BatchService, { Batch, BatchFormData } from '../services/batchService';
import { Product } from '../types/product';
import { Supplier } from '../types/supplier';
import ProductService from '../services/productService';
import SupplierService from '../services/supplierService';

const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'expired'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        ProductService.getProducts(),
        SupplierService.getSuppliers()
      ]);
      
      setProducts(productsRes.results || productsRes);
      setSuppliers(suppliersRes.results || suppliersRes);
      
      // Fetch batches based on active tab
      let batchesData: Batch[] = [];
      switch (activeTab) {
        case 'expiring':
          batchesData = await BatchService.getExpiringSoon(30);
          break;
        case 'expired':
          batchesData = await BatchService.getExpired();
          break;
        default:
          const allBatches = await BatchService.getBatches();
          batchesData = allBatches.results || allBatches;
      }
      setBatches(batchesData);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const formik = useFormik({
    initialValues: {
      product: '',
      batch_number: '',
      expiry_date: '',
      quantity: '',
      manufacturing_date: '',
      supplier: '',
      cost_price: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      product: Yup.number().required('Required'),
      batch_number: Yup.string().required('Required'),
      quantity: Yup.number().positive('Must be positive').required('Required'),
      expiry_date: Yup.date().nullable(),
      manufacturing_date: Yup.date().nullable(),
      cost_price: Yup.number().positive('Must be positive').nullable(),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const formData: BatchFormData = {
          product: Number(values.product),
          batch_number: values.batch_number,
          quantity: Number(values.quantity),
          expiry_date: values.expiry_date || undefined,
          manufacturing_date: values.manufacturing_date || undefined,
          supplier: values.supplier ? Number(values.supplier) : undefined,
          cost_price: values.cost_price ? Number(values.cost_price) : undefined,
        };

        if (editBatch) {
          await BatchService.updateBatch(editBatch.id, formData);
          toast.success('Batch updated!');
        } else {
          await BatchService.createBatch(formData);
          toast.success('Batch added!');
        }
        
        resetForm();
        setShowModal(false);
        setEditBatch(null);
        fetchData();
      } catch (err: any) {
        console.error('Batch operation error:', err);
        const errorData = err.response?.data;
        if (errorData) {
          if (errorData.batch_number) {
            toast.error(`Batch Number Error: ${errorData.batch_number[0]}`);
          } else if (errorData.product) {
            toast.error(`Product Error: ${errorData.product[0]}`);
          } else {
            const errorMessage = errorData.message || Object.values(errorData)[0];
            toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
          }
        } else {
          toast.error(`Failed to save batch: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (batch: Batch) => {
    setEditBatch(batch);
    formik.setValues({
      product: batch.product.toString(),
      batch_number: batch.batch_number,
      expiry_date: batch.expiry_date || '',
      quantity: batch.quantity.toString(),
      manufacturing_date: batch.manufacturing_date || '',
      supplier: batch.supplier?.toString() || '',
      cost_price: batch.cost_price?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await BatchService.deleteBatch(id);
        toast.success('Batch deleted!');
        fetchData();
      } catch (err: any) {
        toast.error('Failed to delete batch');
      }
    }
  };

  const generateBatchNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const batchNumber = `BATCH${timestamp}${random}`;
    formik.setFieldValue('batch_number', batchNumber);
  };

  const getExpiryStatus = (batch: Batch) => {
    if (!batch.expiry_date) return { color: 'bg-gray-100 text-gray-800', text: 'No Expiry' };
    if (batch.is_expired) return { color: 'bg-red-100 text-red-800', text: 'Expired' };
    if (batch.days_to_expiry && batch.days_to_expiry <= 7) return { color: 'bg-red-100 text-red-800', text: 'Expiring Soon' };
    if (batch.days_to_expiry && batch.days_to_expiry <= 30) return { color: 'bg-yellow-100 text-yellow-800', text: 'Expiring' };
    return { color: 'bg-green-100 text-green-800', text: 'Good' };
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Batch Management</h1>
        <button 
          onClick={() => { 
            setShowModal(true); 
            setEditBatch(null); 
            formik.resetForm();
          }} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Batch
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Batches
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'expiring' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Expiring Soon
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'expired' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Expired
        </button>
      </div>

      {/* Batch List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No batches found.</td>
                </tr>
              ) : (
                batches.map(batch => {
                  const expiryStatus = getExpiryStatus(batch);
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{batch.product_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.batch_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {batch.available_quantity} / {batch.quantity}
                          {batch.reserved_quantity > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({batch.reserved_quantity} reserved)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '-'}
                        {batch.days_to_expiry !== null && (
                          <div className="text-xs text-gray-500">
                            {batch.days_to_expiry > 0 ? `${batch.days_to_expiry} days left` : `${Math.abs(batch.days_to_expiry)} days expired`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryStatus.color}`}>
                          {expiryStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {batch.supplier_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEdit(batch)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button onClick={() => handleDelete(batch.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editBatch ? 'Edit Batch' : 'Add New Batch'}
              </h2>
              
              <form onSubmit={formik.handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                    <select
                      name="product"
                      value={formik.values.product}
                      onChange={formik.handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Product</option>
                      {products.map((product: any) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    {formik.touched.product && formik.errors.product && (
                      <div className="text-red-500 text-sm mt-1">{formik.errors.product}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number *</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="batch_number"
                        value={formik.values.batch_number}
                        onChange={formik.handleChange}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., BATCH001"
                      />
                      <button
                        type="button"
                        onClick={generateBatchNumber}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Generate
                      </button>
                    </div>
                    {formik.touched.batch_number && formik.errors.batch_number && (
                      <div className="text-red-500 text-sm mt-1">{formik.errors.batch_number}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formik.values.quantity}
                      onChange={formik.handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0"
                    />
                    {formik.touched.quantity && formik.errors.quantity && (
                      <div className="text-red-500 text-sm mt-1">{formik.errors.quantity}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cost_price"
                      value={formik.values.cost_price}
                      onChange={formik.handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={formik.values.expiry_date}
                      onChange={formik.handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturing Date</label>
                    <input
                      type="date"
                      name="manufacturing_date"
                      value={formik.values.manufacturing_date}
                      onChange={formik.handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                    <select
                      name="supplier"
                      value={formik.values.supplier}
                      onChange={formik.handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier: any) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditBatch(null);
                      formik.resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formik.isSubmitting ? 'Saving...' : (editBatch ? 'Update Batch' : 'Add Batch')}
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

export default BatchManagement; 