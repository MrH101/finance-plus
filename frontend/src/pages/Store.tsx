import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiMapPin, FiUser, FiShoppingCart, FiMail, FiPhone } from 'react-icons/fi';
import { advancedSystemService } from '../services/advancedService';
import toast from 'react-hot-toast';

const Store: React.FC = () => {
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ 
    name: '', 
    address: '', 
    manager: '', 
    vat_number: '',
    phone: '',
    email: ''
  });
  const [editId, setEditId] = useState<number|null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const response = await advancedSystemService.getStores();
      setStores(response.data);
    } catch (error) {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await advancedSystemService.updateStore(editId, form);
        toast.success('Store updated successfully');
      } else {
        await advancedSystemService.createStore(form);
        toast.success('Store created successfully');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ name: '', address: '', manager: '', vat_number: '', phone: '', email: '' });
      loadStores();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        await advancedSystemService.deleteStore(id);
        toast.success('Store deleted successfully');
        loadStores();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const filteredStores = () => {
    return stores.filter((store: any) => 
      store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.vat_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal-700">Store Management</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <FiFilter />
            Filter
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <FiPlus />
            New Store
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search stores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Manager Name"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              placeholder="VAT Number"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
              <option>All Locations</option>
              <option>Harare</option>
              <option>Bulawayo</option>
              <option>Chitungwiza</option>
            </select>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-teal-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-600">Total Stores</p>
              <p className="text-2xl font-bold text-teal-700">{stores.length}</p>
            </div>
            <FiShoppingCart className="text-teal-600 text-2xl" />
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Active Stores</p>
              <p className="text-2xl font-bold text-blue-700">
                {stores.filter((s: any) => s.is_active !== false).length}
              </p>
            </div>
            <FiShoppingCart className="text-blue-600 text-2xl" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Managers</p>
              <p className="text-2xl font-bold text-green-700">
                {new Set(stores.map((s: any) => s.manager)).size}
              </p>
            </div>
            <FiUser className="text-green-600 text-2xl" />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Locations</p>
              <p className="text-2xl font-bold text-purple-700">
                {new Set(stores.map((s: any) => s.address?.split(',')[0])).size}
              </p>
            </div>
            <FiMapPin className="text-purple-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores().map((store: any) => (
          <div key={store.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{store.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FiMapPin className="text-gray-400" />
                      <span>{store.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiUser className="text-gray-400" />
                      <span>{store.manager_name || 'No Manager'}</span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center gap-2">
                        <FiPhone className="text-gray-400" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center gap-2">
                        <FiMail className="text-gray-400" />
                        <span>{store.email}</span>
                      </div>
                    )}
                  </div>
                  {store.vat_number && (
                    <div className="mt-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        VAT: {store.vat_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Created: {new Date(store.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditId(store.id); setForm(store); setShowModal(true); }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <FiEdit size={16} />
                  </button>
                  <button 
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                    title="View Details"
                  >
                    <FiUser size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(store.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredStores().length === 0 && !loading && (
        <div className="text-center py-12">
          <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stores found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new store.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                New Store
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h4 className="text-lg font-bold mb-4">{editId ? 'Edit' : 'Create'} Store</h4>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-teal-500" 
                placeholder="Store Name" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required
              />
              <textarea 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-teal-500" 
                placeholder="Address" 
                value={form.address} 
                onChange={e => setForm({ ...form, address: e.target.value })} 
                rows={3}
                required
              />
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-teal-500" 
                placeholder="Manager ID" 
                value={form.manager} 
                onChange={e => setForm({ ...form, manager: e.target.value })} 
                type="number"
              />
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-teal-500" 
                placeholder="VAT Number" 
                value={form.vat_number} 
                onChange={e => setForm({ ...form, vat_number: e.target.value })} 
              />
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-teal-500" 
                placeholder="Phone" 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                type="tel"
              />
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-teal-500" 
                placeholder="Email" 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                type="email"
              />
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition" 
                  onClick={() => { 
                    setShowModal(false); 
                    setEditId(null); 
                    setForm({ name: '', address: '', manager: '', vat_number: '', phone: '', email: '' }); 
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 transition"
                >
                  {editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Store; 