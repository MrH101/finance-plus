import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface Service {
  id: number;
  service_code: string;
  name: string;
  description: string;
  category: string;
  service_price: number;
  duration_hours?: number;
  store?: number;
  store_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StoreOption {
  id: number;
  name: string;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    service_code: '',
    name: '',
    description: '',
    category: 'General',
    service_price: '',
    duration_hours: '',
    store: '',
    is_active: true,
  });

  useEffect(() => {
    const loadData = async () => {
      const loadedStores = await fetchStores();
      // Fetch services after stores are loaded, passing stores directly
      await fetchServices(loadedStores);
    };
    loadData();
  }, []);

  const fetchStores = async (): Promise<StoreOption[]> => {
    try {
      const response = await api.get('/stores/');
      const raw = response.data?.results || response.data || [];
      const storeList = Array.isArray(raw) ? raw.map((s: any) => ({
        id: s.id,
        name: s.name || s.title || s.store_name || `Store ${s.id}`
      })) : [];
      setStores(storeList);
      return storeList;
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
          return storeList2;
        } catch {
          setStores([]);
          return [];
        }
      } else {
        setStores([]);
        return [];
      }
    }
  };

  const fetchServices = async (storeList: StoreOption[] = stores) => {
    setLoading(true);
    try {
      const res = await api.get('/services/');
      const raw = res.data?.results || res.data || [];
      const list = (Array.isArray(raw) ? raw : []).map((s: any) => {
        // Find store name from stores list
        const storeObj = storeList.find(st => st.id === s.store);
        return {
          id: s.id,
          service_code: s.service_code || '',
          name: s.name || '',
          description: s.description || '',
          category: s.category || 'General',
          service_price: Number(s.service_price || 0),
          duration_hours: s.duration_hours ? Number(s.duration_hours) : undefined,
          store: s.store || undefined,
          store_name: storeObj?.name || (s.store ? `Store ${s.store}` : undefined),
          is_active: s.is_active ?? true,
          created_at: s.created_at || '',
          updated_at: s.updated_at || ''
        } as Service;
      });
      setServices(list);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.service_code || !formData.name) {
        toast.error('Service Code and Name are required');
        setLoading(false);
        return;
      }
      if (!formData.service_price || Number(formData.service_price) <= 0) {
        toast.error('Service Price is required and must be greater than 0');
        setLoading(false);
        return;
      }

      const payload: any = {
        service_code: formData.service_code,
        name: formData.name,
        description: formData.description || '',
        category: formData.category || 'General',
        service_price: Number(formData.service_price || 0),
        is_active: formData.is_active,
      };

      if (formData.duration_hours) {
        payload.duration_hours = Number(formData.duration_hours);
      }

      if (formData.store) {
        payload.store = Number(formData.store);
      }

      if (editingService) {
        await api.put(`/services/${editingService.id}/`, payload);
        toast.success('Service updated successfully');
      } else {
        await api.post('/services/', payload);
        toast.success('Service created successfully');
      }

      setShowModal(false);
      setEditingService(null);
      resetForm();
      fetchServices(stores);
    } catch (error: any) {
      console.error('Error saving service:', error);
      const errorData = error?.response?.data;
      let errorMsg = 'Failed to save service';
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
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      service_code: service.service_code,
      name: service.name,
      description: service.description || '',
      category: service.category || 'General',
      service_price: service.service_price.toString(),
      duration_hours: service.duration_hours?.toString() || '',
      store: service.store?.toString() || '',
      is_active: service.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/services/${id}/`);
      toast.success('Service deleted successfully');
      fetchServices(stores);
    } catch (error: any) {
      console.error('Error deleting service:', error);
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || 'Failed to delete service';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      service_code: '',
      name: '',
      description: '',
      category: 'General',
      service_price: '',
      duration_hours: '',
      store: '',
      is_active: true,
    });
  };

  const openModal = () => {
    setEditingService(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Service
        </button>
      </div>

      {loading && !services.length ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No services found. Click "Add Service" to create one.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service.service_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Number(service.service_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.duration_hours ? `${service.duration_hours} hrs` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.store_name || 'All Stores'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingService ? 'Edit Service' : 'Add Service'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.service_code}
                      onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., SRV-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Consultation"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Service description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., General"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.service_price}
                      onChange={(e) => setFormData({ ...formData, service_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (Hours)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>
                  {stores.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store
                      </label>
                      <select
                        value={formData.store}
                        onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Stores</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;

