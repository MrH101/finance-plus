import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface CashTillAccount {
  id: number;
  account_name: string;
  currency_code?: string;
  is_active: boolean;
  store?: number;
  opening_balance?: number;
  current_balance?: number;
}

interface StoreOption {
  id: number;
  name: string;
}

const CashTill: React.FC = () => {
  const [accounts, setAccounts] = useState<CashTillAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAccount, setNewAccount] = useState<{ account_name?: string; currency_code?: string; is_active?: boolean; store?: number; opening_balance?: number }>({ is_active: true });
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [editing, setEditing] = useState<null | { id: number; account_name?: string; currency_code?: string; is_active?: boolean; store?: number; opening_balance?: number }>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Load stores
      try {
        const s = await api.get('/stores/');
        const rawS = s.data?.results || s.data || [];
        const normS: StoreOption[] = Array.isArray(rawS)
          ? rawS.map((r: any) => ({ id: r.id, name: r.name || r.title || r.store_name || `Store ${r.id}` }))
          : [];
        setStores(normS);
      } catch (se: any) {
        if (se?.response?.status === 404) {
          try {
            const s2 = await api.get('/locations/');
            const rawS2 = s2.data?.results || s2.data || [];
            const normS2: StoreOption[] = Array.isArray(rawS2)
              ? rawS2.map((r: any) => ({ id: r.id, name: r.name || r.title || r.location_name || `Store ${r.id}` }))
              : [];
            setStores(normS2);
          } catch {
            setStores([]);
          }
        } else {
          setStores([]);
        }
      }

      // Load cash till accounts
      const a = await api.get('/cash-tills/');
      const accRaw = a.data?.results || a.data || [];
      const accNorm: CashTillAccount[] = Array.isArray(accRaw)
        ? accRaw.map((r: any) => ({
            id: r.id,
            account_name: r.account_name || r.name || `Cash Till ${r.id}`,
            currency_code: (r.currency_code || (typeof r.currency === 'string' ? r.currency : (r.currency?.code || r.currency?.currency_code)) || '').trim() || undefined,
            is_active: Boolean(r.is_active),
            store: r.store || r.store_id,
            opening_balance: typeof r.opening_balance === 'number' ? r.opening_balance : (r.opening_balance ? Number(r.opening_balance) : undefined),
            current_balance: typeof r.current_balance === 'number' ? r.current_balance : (r.current_balance ? Number(r.current_balance) : undefined),
          }))
        : [];
      setAccounts(accNorm);
    } catch (e: any) {
      toast.error('Failed to load cash till accounts');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAccount = async (id: number, on: boolean) => {
    const prev = [...accounts];
    setAccounts((cur) => cur.map((acc) => (acc.id === id ? { ...acc, is_active: on } : acc)));
    try {
      await api.put(`/cash-tills/${id}/`, { is_active: on });
      toast.success('Account updated');
    } catch (e) {
      setAccounts(prev);
      toast.error('Failed to update account');
    }
  };

  const deleteAccount = async (id: number) => {
    if (!confirm('Delete this cash till account?')) return;
    const prev = [...accounts];
    setAccounts((cur) => cur.filter((a) => a.id !== id));
    try {
      await api.delete(`/cash-tills/${id}/`);
      toast.success('Account deleted');
      load();
    } catch (e: any) {
      setAccounts(prev);
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || 'Failed to delete account';
      toast.error(errorMsg);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editing.account_name || !editing.store) {
      toast.error('Account name and store are required');
      return;
    }
    try {
      await api.put(`/cash-tills/${editing.id}/`, {
        account_name: editing.account_name,
        currency_code: editing.currency_code,
        is_active: editing.is_active,
        store: editing.store,
        opening_balance: typeof editing.opening_balance === 'number' ? editing.opening_balance : undefined,
      });
      toast.success('Account updated');
      setEditing(null);
      load();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.account_name?.[0] || 
                       e?.response?.data?.store?.[0] ||
                       e?.response?.data?.detail || 
                       e?.response?.data?.message || 
                       'Failed to update account';
      toast.error(errorMsg);
    }
  };

  const createAccount = async () => {
    if (!newAccount.account_name || !newAccount.store) {
      toast.error('Account name and store are required');
      return;
    }
    try {
      await api.post('/cash-tills/', {
        account_name: newAccount.account_name,
        currency_code: newAccount.currency_code,
        is_active: newAccount.is_active !== false,
        store: newAccount.store,
        opening_balance: typeof newAccount.opening_balance === 'number' ? newAccount.opening_balance : 0,
      });
      toast.success('Cash till account created');
      setNewAccount({ is_active: true });
      load();
    } catch (e: any) {
      const errorData = e?.response?.data;
      let errorMsg = 'Failed to create account';
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

  const { user } = useAuth();
  const rawRole = (user as any)?.role ?? (user as any)?.user_role ?? (user as any)?.user?.role;
  const roleStr = rawRole ? String(rawRole).trim().toLowerCase() : '';
  const isAuthed = Boolean(localStorage.getItem('token') || localStorage.getItem('access'));
  const canManage = roleStr === 'employer' || roleStr === 'manager' || roleStr === 'admin' || roleStr === 'superadmin' || isAuthed;

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Cash Till</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Cash Till Accounts</h3>
          <p className="text-sm text-gray-600 mb-4">
            Manage cash at hand accounts for physical cash in stores. Each account tracks opening balance and current balance.
          </p>
          {loading ? (
            <Skeleton lines={6} />
          ) : accounts.length === 0 ? (
            <EmptyState title="No cash till accounts" description="Create your first cash till account using the form on the right." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 text-left">Account Name</th>
                    <th className="py-2 px-4 text-left">Currency</th>
                    <th className="py-2 px-4 text-left">Opening Balance</th>
                    <th className="py-2 px-4 text-left">Current Balance</th>
                    <th className="py-2 px-4 text-left">Store</th>
                    <th className="py-2 px-4 text-left">Active</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{acc.account_name}</td>
                      <td className="py-2 px-4">
                        {acc.currency_code && String(acc.currency_code).trim() !== '' ? (
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-medium">
                            {String(acc.currency_code).trim().toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {typeof acc.opening_balance === 'number'
                          ? acc.opening_balance.toFixed(2)
                          : '—'}
                      </td>
                      <td className="py-2 px-4">
                        {typeof acc.current_balance === 'number'
                          ? acc.current_balance.toFixed(2)
                          : '—'}
                      </td>
                      <td className="py-2 px-4">
                        {acc.store ? (
                          (() => {
                            const store = stores.find((s) => s.id === acc.store);
                            return store ? (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {store.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">Store {acc.store}</span>
                            );
                          })()
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {canManage ? (
                          <input
                            type="checkbox"
                            checked={acc.is_active}
                            onChange={() => toggleAccount(acc.id, !acc.is_active)}
                          />
                        ) : (
                          <span>{acc.is_active ? 'Yes' : 'No'}</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {canManage ? (
                          <div className="flex gap-2">
                            <button
                              className="text-blue-600 hover:underline text-sm"
                              onClick={() =>
                                setEditing({
                                  id: acc.id,
                                  account_name: acc.account_name,
                                  currency_code: acc.currency_code,
                                  is_active: acc.is_active,
                                  store: acc.store,
                                  opening_balance: acc.opening_balance,
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:underline text-sm"
                              onClick={() => deleteAccount(acc.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Restricted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">New Cash Till Account</h3>
          <p className="text-sm text-gray-600 mb-3">
            Create a new cash at hand account for a store. Account name and store are required.
          </p>
          <div className="space-y-3 mb-8">
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Account Name *"
              value={newAccount.account_name || ''}
              onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
            />
            <select
              className="w-full border rounded px-3 py-2"
              value={newAccount.store || ''}
              onChange={(e) => setNewAccount({ ...newAccount, store: Number(e.target.value) })}
            >
              <option value="">Select Store *</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Currency Code (e.g., USD, ZWL)"
              value={newAccount.currency_code || ''}
              onChange={(e) => setNewAccount({ ...newAccount, currency_code: e.target.value })}
            />
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              placeholder="Opening Balance (optional)"
              value={newAccount.opening_balance ?? ''}
              onChange={(e) =>
                setNewAccount({ ...newAccount, opening_balance: e.target.value ? Number(e.target.value) : undefined })
              }
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new-active"
                checked={newAccount.is_active !== false}
                onChange={(e) => setNewAccount({ ...newAccount, is_active: e.target.checked })}
              />
              <label htmlFor="new-active" className="text-sm text-gray-700">
                Active
              </label>
            </div>
            {canManage && (
              <button
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                onClick={createAccount}
              >
                Create Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Cash Till Account</h3>
            <div className="space-y-3">
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Account Name *"
                value={editing.account_name || ''}
                onChange={(e) => setEditing({ ...editing, account_name: e.target.value })}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={editing.store || ''}
                onChange={(e) => setEditing({ ...editing, store: Number(e.target.value) })}
              >
                <option value="">Select Store *</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Currency Code (e.g., USD, ZWL)"
                value={editing.currency_code || ''}
                onChange={(e) => setEditing({ ...editing, currency_code: e.target.value })}
              />
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                placeholder="Opening Balance"
                value={editing.opening_balance ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, opening_balance: e.target.value ? Number(e.target.value) : undefined })
                }
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editing.is_active !== false}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                <label htmlFor="edit-active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                onClick={saveEdit}
              >
                Save
              </button>
              <button
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashTill;

