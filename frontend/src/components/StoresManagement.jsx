// StoresManagement.jsx
import  { useState, useEffect } from 'react';
import api from '../services/api';

const StoresManagement = () => {
  const [stores, setStores] = useState([]);
  const [profile, setProfile] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    contact_number: '',
    vat_number: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const [storesRes, userRes] = await Promise.all([
          api.get('/stores/'),
          api.get('/users/me/')
        ]);
        const list = storesRes.data?.results || storesRes.data || [];
        setStores(Array.isArray(list) ? list : []);
        const prof = userRes.data || null;
        setProfile(prof);
        if (prof?.business) {
          try {
            const bizRes = await api.get(`/businesses/${prof.business}/`);
            setBusinessName(bizRes.data?.name || '');
          } catch {
            // Fallback: try list (filtered to user's business)
            try {
              const bizList = await api.get('/businesses/');
              const first = (bizList.data?.results || bizList.data || [])[0];
              setBusinessName(first?.name || '');
            } catch {}
          }
        }
      } catch (error) {
        console.error('Error initializing stores management:', error);
      }
    };
    init();
  }, []);

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const payload = {
        name: newStore.name,
        address: newStore.address,
        contact_number: newStore.contact_number,
        vat_number: newStore.vat_number,
        business: profile?.business || undefined,
      };
      const response = await api.post('/stores/', payload);
      setStores([...(stores || []), response.data]);
      setNewStore({ name: '', address: '', contact_number: '', vat_number: '' });
    } catch (error) {
      const data = error?.response?.data;
      setErrors(typeof data === 'object' ? data : { detail: error?.message || 'Failed to create store' });
      console.error('Error creating store:', error);
    }
  };

  const handleDeleteStore = async (id) => {
    const prev = [...stores];
    setStores((cur) => cur.filter((s) => s.id !== id));
    try {
      await api.delete(`/stores/${id}/`);
    } catch (e) {
      console.error('Error deleting store:', e);
      setStores(prev);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <span className="mr-2" aria-hidden>🏬</span>
        Store Management
      </h2>
      
      {/* Create Store Form */}
      <form onSubmit={handleCreateStore} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              placeholder="Store Name"
              className="p-2 border rounded w-full"
              value={newStore.name}
              onChange={(e) => setNewStore({...newStore, name: e.target.value})}
            />
            {errors?.name && <div className="text-red-600 text-sm mt-1">{String(errors.name)}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact number</label>
            <input
              type="tel"
              placeholder="Contact Number"
              className="p-2 border rounded w-full"
              value={newStore.contact_number}
              onChange={(e) => setNewStore({...newStore, contact_number: e.target.value})}
            />
            {errors?.contact_number && <div className="text-red-600 text-sm mt-1">{String(errors.contact_number)}</div>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              placeholder="Address"
              className="p-2 border rounded w-full"
              value={newStore.address}
              onChange={(e) => setNewStore({...newStore, address: e.target.value})}
            />
            {errors?.address && <div className="text-red-600 text-sm mt-1">{String(errors.address)}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vat number</label>
            <input
              type="text"
              placeholder="VAT Number"
              className="p-2 border rounded w-full"
              value={newStore.vat_number}
              onChange={(e) => setNewStore({...newStore, vat_number: e.target.value})}
            />
            {errors?.vat_number && <div className="text-red-600 text-sm mt-1">{String(errors.vat_number)}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Manager</label>
            <input
              type="text"
              className="p-2 border rounded w-full bg-gray-50"
              value={profile ? `${profile.first_name || profile.username} (you)` : ''}
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Business</label>
            <input
              type="text"
              className="p-2 border rounded w-full bg-gray-50"
              value={businessName || '—'}
              disabled
              readOnly
            />
            {errors?.business && <div className="text-red-600 text-sm mt-1">{String(errors.business)}</div>}
          </div>
        </div>
        {errors?.detail && <div className="text-red-600 text-sm mt-2">{String(errors.detail)}</div>}
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <span className="mr-2" aria-hidden>＋</span>
          Add Store
        </button>
      </form>

      {/* Stores List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(stores || []).map(store => (
          <div key={store.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">{store.name}</h3>
            <p className="text-gray-600 mb-1">Address: {store.address}</p>
            <p className="text-gray-600 mb-1">Contact: {store.contact_number}</p>
            <p className="text-gray-600 mb-2">VAT: {store.vat_number}</p>
            <div className="mt-2">
              <button onClick={() => handleDeleteStore(store.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoresManagement;