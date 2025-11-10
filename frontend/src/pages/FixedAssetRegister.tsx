import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiBox, FiTool, FiTrendingDown,
  FiCalendar, FiDollarSign, FiMapPin
} from 'react-icons/fi';
import { fixedAssetService, assetCategoryService } from '../services/extendedApi';

interface FixedAsset {
  id: number;
  asset_number: string;
  name: string;
  category_name: string;
  purchase_date: string;
  purchase_price: string;
  current_book_value: string;
  status: string;
  location: string;
  assigned_to_name?: string;
}

interface AssetCategory {
  id: number;
  name: string;
}

const FixedAssetRegister: React.FC = () => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [summary, setSummary] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    purchase_date: '',
    purchase_price: '',
    depreciation_start_date: '',
    useful_life_years: 5,
    salvage_value: '',
    location: '',
    serial_number: '',
    model_number: '',
  });

  useEffect(() => {
    fetchAssets();
    fetchCategories();
    fetchSummary();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fixedAssetService.getAll();
      setAssets(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await assetCategoryService.getAll();
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fixedAssetService.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load summary');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await fixedAssetService.update(editingAsset.id, formData);
        toast.success('Asset updated successfully');
      } else {
        await fixedAssetService.create(formData);
        toast.success('Asset created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchAssets();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save asset');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      await fixedAssetService.delete(id);
      toast.success('Asset deleted successfully');
      fetchAssets();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      purchase_date: '',
      purchase_price: '',
      depreciation_start_date: '',
      useful_life_years: 5,
      salvage_value: '',
      location: '',
      serial_number: '',
      model_number: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-100 text-green-800',
      UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      DISPOSED: 'bg-gray-100 text-gray-800',
      SOLD: 'bg-blue-100 text-blue-800',
      SCRAPPED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredAssets = assets.filter(asset =>
    filterStatus === 'ALL' || asset.status === filterStatus
  );

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(value));
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fixed Asset Register</h1>
        <p className="text-gray-600">Track and manage your company assets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Assets</p>
              <p className="text-3xl font-bold mt-2">{summary?.total_assets || assets.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiBox className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Value</p>
              <p className="text-2xl font-bold mt-2">
                ${summary?.total_value ? parseFloat(summary.total_value).toLocaleString() : '0'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Active</p>
              <p className="text-3xl font-bold mt-2">
                {assets.filter(a => a.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTrendingDown className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Maintenance</p>
              <p className="text-3xl font-bold mt-2">
                {assets.filter(a => a.status === 'UNDER_MAINTENANCE').length}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTool className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'ACTIVE', 'UNDER_MAINTENANCE', 'DISPOSED', 'SOLD'].map((status) => (
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
            Add Asset
          </button>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{asset.name}</h3>
                <p className="text-sm text-gray-500">{asset.asset_number}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingAsset(asset);
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiBox className="h-4 w-4 text-gray-400" />
                <span>{asset.category_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMapPin className="h-4 w-4 text-gray-400" />
                <span>{asset.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="h-4 w-4 text-gray-400" />
                <span>Purchased: {new Date(asset.purchase_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                {asset.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Purchase Price:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(asset.purchase_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Book Value:</span>
                <span className="font-semibold text-green-600">{formatCurrency(asset.current_book_value)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiBox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No assets found</p>
          <p className="text-gray-400 mb-4">Start by adding your first asset</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-5 w-5" />
            Add Asset
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset Name *
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
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Useful Life (Years) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.useful_life_years}
                    onChange={(e) => setFormData({ ...formData, useful_life_years: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {editingAsset ? 'Update Asset' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedAssetRegister;

