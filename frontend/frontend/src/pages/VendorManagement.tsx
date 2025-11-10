import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiPhone, FiMail, FiMapPin, FiDollarSign } from 'react-icons/fi';
import { vendorService } from '../services/extendedApi';

interface Vendor {
  id: number;
  vendor_code: string;
  name: string;
  vendor_type: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  rating: number;
  credit_limit: string;
  payment_terms_days: number;
  is_active: boolean;
}

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    vendor_type: 'SUPPLIER',
    email: '',
    phone: '',
    mobile: '',
    address_line1: '',
    city: '',
    province: '',
    country: 'Zimbabwe',
    tax_id: '',
    credit_limit: '0',
    payment_terms_days: 30,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAll();
      setVendors(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare payload with proper data types
      const payload = {
        ...formData,
        credit_limit: formData.credit_limit ? Number(formData.credit_limit) : 0,
        payment_terms_days: formData.payment_terms_days ? Number(formData.payment_terms_days) : 30,
      };
      
      if (editingVendor) {
        await vendorService.update(editingVendor.id, payload);
        toast.success('Vendor updated successfully');
      } else {
        await vendorService.create(payload);
        toast.success('Vendor created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchVendors();
    } catch (error: any) {
      console.error('Vendor save error:', error);
      const errorData = error?.response?.data;
      let errorMsg = 'Failed to save vendor';
      if (errorData) {
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
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    
    try {
      await vendorService.delete(id);
      toast.success('Vendor deleted successfully');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to delete vendor');
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      vendor_type: vendor.vendor_type,
      email: vendor.email,
      phone: vendor.phone,
      mobile: '',
      address_line1: '',
      city: vendor.city,
      province: '',
      country: vendor.country,
      tax_id: '',
      credit_limit: vendor.credit_limit,
      payment_terms_days: vendor.payment_terms_days,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingVendor(null);
    setFormData({
      name: '',
      vendor_type: 'SUPPLIER',
      email: '',
      phone: '',
      mobile: '',
      address_line1: '',
      city: '',
      province: '',
      country: 'Zimbabwe',
      tax_id: '',
      credit_limit: '0',
      payment_terms_days: 30,
    });
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || vendor.vendor_type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (isActive: boolean) => 
    isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  const getTypeColor = (type: string) => {
    const colors: any = {
      SUPPLIER: 'bg-blue-100 text-blue-800',
      CONTRACTOR: 'bg-purple-100 text-purple-800',
      SERVICE_PROVIDER: 'bg-yellow-100 text-yellow-800',
      MANUFACTURER: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Management</h1>
        <p className="text-gray-600">Manage your suppliers and service providers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Vendors</p>
              <p className="text-3xl font-bold mt-2">{vendors.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active</p>
              <p className="text-3xl font-bold mt-2">
                {vendors.filter(v => v.is_active).length}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiStar className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Suppliers</p>
              <p className="text-3xl font-bold mt-2">
                {vendors.filter(v => v.vendor_type === 'SUPPLIER').length}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiMapPin className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Contractors</p>
              <p className="text-3xl font-bold mt-2">
                {vendors.filter(v => v.vendor_type === 'CONTRACTOR').length}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiMail className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search vendors by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="SERVICE_PROVIDER">Service Provider</option>
              <option value="MANUFACTURER">Manufacturer</option>
            </select>

            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <FiPlus className="h-5 w-5" />
              Add Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{vendor.name}</h3>
                <p className="text-sm text-gray-500">{vendor.vendor_code}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(vendor)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(vendor.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMail className="h-4 w-4 text-gray-400" />
                <span>{vendor.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiPhone className="h-4 w-4 text-gray-400" />
                <span>{vendor.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMapPin className="h-4 w-4 text-gray-400" />
                <span>{vendor.city}, {vendor.country}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(vendor.vendor_type)}`}>
                  {vendor.vendor_type.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.is_active)}`}>
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`h-4 w-4 ${i < vendor.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Credit Limit:</span>
                <span className="font-semibold text-gray-900">${vendor.credit_limit}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Payment Terms:</span>
                <span className="font-semibold text-gray-900">{vendor.payment_terms_days} days</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No vendors found</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Create your first vendor
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Type *
                  </label>
                  <select
                    required
                    value={formData.vendor_type}
                    onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="SUPPLIER">Supplier</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="SERVICE_PROVIDER">Service Provider</option>
                    <option value="MANUFACTURER">Manufacturer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.payment_terms_days}
                    onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
                  {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;

