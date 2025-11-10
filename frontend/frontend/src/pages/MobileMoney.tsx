
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/roleMapping';
import { toast } from 'react-hot-toast';

interface MobileMoneyAccount {
  id: number;
  account_name: string;
  provider: string; // EcoCash, Telecash
  phone_number: string;
  currency_code?: string;
  is_active: boolean;
  store?: number; // primary store id (for backward compatibility)
  stores?: number[]; // all linked stores
  opening_balance?: number;
  current_balance?: number;
}

interface StoreOption {
  id: number;
  name: string;
}

interface MobileMoneyPayment {
  id: number;
  account: number;
  amount: number;
  currency_code?: string;
  reference?: string;
  status?: string;
  created_at?: string;
}

const MobileMoney: React.FC = () => {
  const [accounts, setAccounts] = useState<MobileMoneyAccount[]>([]);
  const [payments, setPayments] = useState<MobileMoneyPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ account?: number; amount?: number; reference?: string }>({});
  const [paymentEndpoint, setPaymentEndpoint] = useState<'/mobile-money-payments/' | '/mobile-money-transactions/'>('/mobile-money-payments/');
  const [newAccount, setNewAccount] = useState<{ account_name?: string; provider?: string; phone_number?: string; currency_code?: string; is_active?: boolean; store?: number; opening_balance?: number }>({ is_active: true });
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [editing, setEditing] = useState<null | { id: number; account_name?: string; provider?: string; phone_number?: string; currency_code?: string; is_active?: boolean; store?: number; opening_balance?: number }>(null);
  const [managingStores, setManagingStores] = useState<number | null>(null); // Account ID for which we're managing stores
  const [accountStores, setAccountStores] = useState<number[]>([]); // Stores for the account being managed

  const load = async () => {
    setLoading(true);
    try {
      // Load stores (for linking accounts)
      try {
        const s = await api.get('/stores/');
        const rawS = s.data?.results || s.data || [];
        const normS: StoreOption[] = Array.isArray(rawS)
          ? rawS.map((r: any) => ({ id: r.id, name: r.name || r.title || r.store_name || `Store ${r.id}` }))
          : [];
        setStores(normS);
      } catch (se: any) {
        // Optional fallback: branches/locations naming
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

      // Accounts
      const a = await api.get('/mobile-money-accounts/');
      const accRaw = a.data?.results || a.data || [];
      const accNorm: MobileMoneyAccount[] = Array.isArray(accRaw)
        ? accRaw.map((r: any) => {
            // Support both single store and stores array
            const primaryStore = r.store || r.store_id;
            const storesArray = r.stores || (primaryStore ? [primaryStore] : []);
            return {
              id: r.id,
              account_name: r.account_name || r.name || `${r.provider} - ${r.phone_number}`,
              provider: r.provider,
              phone_number: r.phone_number,
              currency_code: (r.currency_code || (typeof r.currency === 'string' ? r.currency : (r.currency?.code || r.currency?.currency_code)) || '').trim() || undefined,
              is_active: Boolean(r.is_active),
              store: primaryStore, // Keep for backward compatibility
              stores: storesArray, // All stores linked to this account
              opening_balance: typeof r.opening_balance === 'number' ? r.opening_balance : (r.opening_balance ? Number(r.opening_balance) : undefined),
              current_balance: typeof r.current_balance === 'number' ? r.current_balance : (r.current_balance ? Number(r.current_balance) : undefined),
            };
          })
        : [];
      setAccounts(accNorm);

      // Payments: try legacy first to avoid visible 404s
      try {
        const p2 = await api.get('/mobile-money-transactions/');
        setPaymentEndpoint('/mobile-money-transactions/');
        const raw = p2.data?.results || p2.data || [];
        const normalized: MobileMoneyPayment[] = Array.isArray(raw)
          ? raw.map((r: any) => ({
              id: r.id,
              account: r.account || r.mobile_money_account || r.account_id,
              amount: r.amount,
              currency_code: r.currency_code || r.currency,
              reference: r.reference || r.tx_ref || r.description,
              status: r.status,
              created_at: r.created_at || r.timestamp,
            }))
          : [];
        setPayments(normalized);
      } catch (legacyErr: any) {
        if (legacyErr?.response?.status !== 404) throw legacyErr;
        const p = await api.get('/mobile-money-payments/');
        setPaymentEndpoint('/mobile-money-payments/');
        setPayments(p.data?.results || p.data || []);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const toggleAccount = async (id: number, on: boolean) => {
    const prev = [...accounts];
    setAccounts((cur) => cur.map((acc) => (acc.id === id ? { ...acc, is_active: on } : acc)));
    try {
      await api.put(`/mobile-money-accounts/${id}/`, { is_active: on });
      toast.success('Account updated');
    } catch (e) {
      setAccounts(prev);
      toast.error('Failed to update account');
    }
  };

  const deleteAccount = async (id: number) => {
    if (!confirm('Delete this mobile money account?')) return;
    const prev = [...accounts];
    setAccounts((cur) => cur.filter((a) => a.id !== id));
    try {
      await api.delete(`/mobile-money-accounts/${id}/`);
      toast.success('Account deleted');
    } catch (e) {
      setAccounts(prev);
      toast.error('Failed to delete account');
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editing.account_name || !editing.provider || !editing.phone_number || !editing.store) {
      toast.error('Account name, provider, phone number and store are required');
      return;
    }
    try {
      await api.put(`/mobile-money-accounts/${editing.id}/`, {
        account_name: editing.account_name,
        provider: editing.provider,
        phone_number: editing.phone_number,
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
                       e?.response?.data?.provider?.[0] ||
                       e?.response?.data?.phone_number?.[0] ||
                       e?.response?.data?.detail || 
                       e?.response?.data?.message || 
                       'Failed to update account';
      toast.error(errorMsg);
    }
  };

  const openStoreManagement = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setManagingStores(accountId);
      setAccountStores(account.stores || (account.store ? [account.store] : []));
    }
  };

  const closeStoreManagement = () => {
    setManagingStores(null);
    setAccountStores([]);
  };

  const addStoreToAccount = async (storeId: number) => {
    if (!managingStores) return;
    if (accountStores.includes(storeId)) {
      toast.error('Store is already linked to this account');
      return;
    }
    
    const updatedStores = [...accountStores, storeId];
    setAccountStores(updatedStores);
    
    try {
      // Try to update via stores endpoint (if backend supports many-to-many)
      try {
        await api.post(`/mobile-money-accounts/${managingStores}/add_store/`, { store: storeId });
        toast.success('Store added');
      } catch (e: any) {
        // Fallbacks when backend doesn't support many-to-many stores
        if (e?.response?.status === 404) {
          // Duplicate the account for the target store (one-account-per-store model)
          const base = accounts.find(a => a.id === managingStores);
          if (!base) throw e;
          await api.post('/mobile-money-accounts/', {
            account_name: base.account_name,
            provider: base.provider,
            phone_number: base.phone_number,
            currency_code: base.currency_code,
            is_active: true,
            store: storeId,
            opening_balance: typeof base.opening_balance === 'number' ? base.opening_balance : 0,
          });
          toast.success('Account shared to selected store');
        } else {
          throw e;
        }
      }
      load();
    } catch (e: any) {
      setAccountStores(accountStores); // Revert on error
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || 'Failed to add store';
      toast.error(errorMsg);
    }
  };

  const removeStoreFromAccount = async (storeId: number) => {
    if (!managingStores) return;
    if (accountStores.length <= 1) {
      toast.error('Account must have at least one store');
      return;
    }
    
    const updatedStores = accountStores.filter(s => s !== storeId);
    setAccountStores(updatedStores);
    
    try {
      // Try to remove via stores endpoint (if backend supports many-to-many)
      try {
        await api.post(`/mobile-money-accounts/${managingStores}/remove_store/`, { store: storeId });
        toast.success('Store removed');
      } catch (e: any) {
        if (e?.response?.status === 404) {
          // One-account-per-store fallback: try to find a duplicate account for the store and delete it
          const base = accounts.find(a => a.id === managingStores);
          if (base) {
            const dup = accounts.find(a => a.phone_number === base.phone_number && a.provider === base.provider && a.store === storeId && a.id !== managingStores);
            if (dup) {
              await api.delete(`/mobile-money-accounts/${dup.id}/`);
              toast.success('Store unlinked by removing shared account');
            } else {
              toast.info('Backend does not support unlinking; no shared account found to remove');
            }
          } else {
            toast.info('Backend does not support unlinking for mobile money accounts');
          }
        } else {
          throw e;
        }
      }
      load();
    } catch (e: any) {
      setAccountStores(accountStores); // Revert on error
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || 'Failed to remove store';
      toast.error(errorMsg);
    }
  };

  const createPayment = async () => {
    if (!form.account || !form.amount) return;
    try {
      if (paymentEndpoint === '/mobile-money-payments/') {
        await api.post('/mobile-money-payments/', {
          account: form.account,
          amount: form.amount,
          reference: form.reference || ''
        });
      } else {
        // Direct transaction creation against transactions endpoint
        const today = new Date().toISOString().slice(0, 10);
        const basePayload: any = {
          transaction_type: 'PAYMENT',
          amount: Number(form.amount),
          reference: form.reference || '',
          description: (form.reference && form.reference.trim()) || 'POS payment',
          transaction_date: today,
          value_date: today,
          status: 'COMPLETED',
        };

        // Try primary field name first
        try {
          await api.post('/mobile-money-transactions/', {
            mobile_account: form.account,
            ...basePayload,
          });
        } catch (e1: any) {
          if (e1?.response?.status === 400) {
            // Retry with alternate key names used by some backends
            try {
              await api.post('/mobile-money-transactions/', {
                account: form.account,
                ...basePayload,
              });
            } catch (e2: any) {
              if (e2?.response?.status === 400) {
                await api.post('/mobile-money-transactions/', {
                  mobile_money_account: form.account,
                  ...basePayload,
                });
              } else {
                throw e2;
              }
            }
          } else {
            throw e1;
          }
        }
      }
      toast.success('Payment initiated');
      setForm({});
      load();
    } catch (e: any) {
      const data = e?.response?.data;
      let msg = data?.detail || data?.error || 'Failed to create payment';
      if (typeof data === 'object' && data) {
        const firstKey = Object.keys(data)[0];
        const val = (data as any)[firstKey];
        if (Array.isArray(val) && val.length) msg = val[0];
      }
      toast.error(msg);
    }
  };

  const { user, isLoading } = useAuth();
  const rawRole = (user as any)?.role ?? (user as any)?.user_role ?? (user as any)?.user?.role;
  const roleStr = rawRole ? String(rawRole).trim().toLowerCase() : '';
  const isAuthed = Boolean(localStorage.getItem('token') || localStorage.getItem('access'));
  // Allow actions for employer/manager/admin/superadmin, and fallback to authed users to avoid false negatives
  const canManage = roleStr === 'employer' || roleStr === 'manager' || roleStr === 'admin' || roleStr === 'superadmin' || isAuthed;

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Mobile Money</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Accounts</h3>
          <p className="text-sm text-gray-600 mb-4">Manage EcoCash, OneMoney, and Innbucks accounts used to receive and send mobile payments in Zimbabwe. Link each account to a store and toggle active to enable transactions.</p>
          {loading ? (
            <Skeleton lines={6} />
          ) : accounts.length === 0 ? (
            <EmptyState title="No mobile money accounts" description="Create your first mobile money account using the form on the right." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 text-left">Account Name</th>
                    <th className="py-2 px-4 text-left">Provider</th>
                    <th className="py-2 px-4 text-left">Phone</th>
                    <th className="py-2 px-4 text-left">Currency</th>
                    <th className="py-2 px-4 text-left">Opening Balance</th>
                    <th className="py-2 px-4 text-left">Store</th>
                    <th className="py-2 px-4 text-left">Active</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{acc.account_name}</td>
                      <td className="py-2 px-4">{acc.provider}</td>
                      <td className="py-2 px-4">{acc.phone_number}</td>
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
                        <div className="flex flex-wrap gap-1">
                          {(acc.stores || (acc.store ? [acc.store] : [])).map((storeId) => {
                            const store = stores.find((s) => s.id === storeId);
                            return store ? (
                              <span key={storeId} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {store.name}
                              </span>
                            ) : null;
                          })}
                          {(!acc.stores || acc.stores.length === 0) && !acc.store && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {canManage ? (
                          <input type="checkbox" checked={acc.is_active} onChange={() => toggleAccount(acc.id, !acc.is_active)} />
                        ) : (
                          <span>{acc.is_active ? 'Yes' : 'No'}</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {canManage ? (
                          <div className="flex gap-2 flex-wrap">
                            <button className="text-blue-600 hover:underline text-sm" onClick={() => setEditing({
                              id: acc.id,
                              account_name: acc.account_name,
                              provider: acc.provider,
                              phone_number: acc.phone_number,
                              currency_code: acc.currency_code,
                              is_active: acc.is_active,
                              store: acc.store,
                              opening_balance: acc.opening_balance,
                            })}>Edit</button>
                            <button className="text-green-600 hover:underline text-sm" onClick={() => openStoreManagement(acc.id)}>Stores</button>
                            <button className="text-red-600 hover:underline text-sm" onClick={() => deleteAccount(acc.id)}>Delete</button>
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

          <h3 className="text-lg font-semibold mt-8 mb-1">Recent Payments</h3>
          <p className="text-sm text-gray-600 mb-4">View mobile money transactions. Status reflects gateway acknowledgement. Use the sidebar Mobile Payments page for full reconciliation and reports.</p>
          {loading ? (
            <Skeleton lines={6} />
          ) : payments.length === 0 ? (
            <EmptyState title="No payments" description="New payments will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 text-left">Account</th>
                    <th className="py-2 px-4 text-left">Amount</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Reference</th>
                    <th className="py-2 px-4 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{p.account}</td>
                      <td className="py-2 px-4">{p.amount}</td>
                      <td className="py-2 px-4">{p.status || '—'}</td>
                      <td className="py-2 px-4">{p.reference || '—'}</td>
                      <td className="py-2 px-4">{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">New Mobile Money Account</h3>
          <p className="text-sm text-gray-600 mb-3">Add your EcoCash, OneMoney, or Innbucks wallet to start receiving and sending payments. Account name, provider, phone number, and store are required.</p>
          <div className="space-y-3 mb-8">
            <input type="text" className="w-full border rounded px-3 py-2" placeholder="Account Name *" value={newAccount.account_name || ''} onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })} />
            <select className="w-full border rounded px-3 py-2" value={newAccount.provider || ''} onChange={(e) => setNewAccount({ ...newAccount, provider: e.target.value })}>
              <option value="">Select Provider *</option>
              <option value="EcoCash">EcoCash</option>
              <option value="OneMoney">OneMoney</option>
              <option value="Innbucks">Innbucks</option>
            </select>
            <input type="tel" className="w-full border rounded px-3 py-2" placeholder="Phone Number *" value={newAccount.phone_number || ''} onChange={(e) => setNewAccount({ ...newAccount, phone_number: e.target.value })} />
            <input type="number" className="w-full border rounded px-3 py-2" placeholder="Opening Balance (optional)" value={newAccount.opening_balance ?? ''} onChange={(e) => setNewAccount({ ...newAccount, opening_balance: Number(e.target.value) })} />
            <select className="w-full border rounded px-3 py-2" value={newAccount.currency_code || ''} onChange={(e) => setNewAccount({ ...newAccount, currency_code: e.target.value })}>
              <option value="">Currency (optional)</option>
              <option value="USD">USD</option>
              <option value="ZWL">ZWL</option>
            </select>
            <div>
              <select className="w-full border rounded px-3 py-2" value={newAccount.store || ''} onChange={(e) => setNewAccount({ ...newAccount, store: Number(e.target.value) })}>
                <option value="">Select Store *</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {stores.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No stores found. Create a store first in Settings, then link it here.</p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={Boolean(newAccount.is_active)} onChange={(e) => setNewAccount({ ...newAccount, is_active: e.target.checked })} />
              Active
            </label>
            <button onClick={async () => {
              if (!newAccount.account_name || !newAccount.provider || !newAccount.phone_number || !newAccount.store) {
                toast.error('Account name, provider, phone number and store are required');
                return;
              }
              try {
                await api.post('/mobile-money-accounts/', {
                  account_name: newAccount.account_name,
                  provider: newAccount.provider,
                  phone_number: newAccount.phone_number,
                  currency_code: newAccount.currency_code,
                  is_active: Boolean(newAccount.is_active),
                  store: newAccount.store,
                  opening_balance: Number(newAccount.opening_balance ?? 0),
                });
                toast.success('Account created');
                setNewAccount({ is_active: true });
                load();
              } catch (e: any) {
                const errorMsg = e?.response?.data?.account_name?.[0] || 
                                 e?.response?.data?.store?.[0] ||
                                 e?.response?.data?.provider?.[0] ||
                                 e?.response?.data?.phone_number?.[0] ||
                                 e?.response?.data?.detail || 
                                 e?.response?.data?.message || 
                                 'Failed to create account';
                toast.error(errorMsg);
              }
            }} className="bg-green-600 text-white px-4 py-2 rounded">Create Account</button>
          </div>

          <h3 className="text-lg font-semibold mb-1">New Payment</h3>
          <p className="text-sm text-gray-600 mb-3">Initiate a customer push payment (USSD/SIM Toolkit). The customer will confirm the payment on their phone.</p>
          {canManage ? (
            <div className="space-y-3">
              <select className="w-full border rounded px-3 py-2" value={form.account || ''} onChange={(e) => setForm({ ...form, account: Number(e.target.value) })}>
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.provider} - {acc.phone_number})</option>
                ))}
              </select>
              <input type="number" className="w-full border rounded px-3 py-2" placeholder="Amount" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              <input type="text" className="w-full border rounded px-3 py-2" placeholder="Reference (optional)" value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              <button onClick={createPayment} className="bg-blue-600 text-white px-4 py-2 rounded">Send Payment</button>
            </div>
          ) : null}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h4 className="font-semibold">Edit Account</h4>
            </div>
            <div className="p-4 space-y-3">
              <input className="w-full border rounded px-3 py-2" placeholder="Account Name *" value={editing.account_name || ''} onChange={(e) => setEditing({ ...editing, account_name: e.target.value })} />
              <select className="w-full border rounded px-3 py-2" value={editing.provider || ''} onChange={(e) => setEditing({ ...editing, provider: e.target.value })}>
                <option value="">Select Provider *</option>
                <option value="EcoCash">EcoCash</option>
                <option value="OneMoney">OneMoney</option>
                <option value="Innbucks">Innbucks</option>
              </select>
              <input className="w-full border rounded px-3 py-2" placeholder="Phone Number *" value={editing.phone_number || ''} onChange={(e) => setEditing({ ...editing, phone_number: e.target.value })} />
              <input className="w-full border rounded px-3 py-2" type="number" placeholder="Opening Balance (optional)" value={editing.opening_balance ?? ''} onChange={(e) => setEditing({ ...editing, opening_balance: Number(e.target.value) })} />
              <select className="w-full border rounded px-3 py-2" value={editing.currency_code || ''} onChange={(e) => setEditing({ ...editing, currency_code: e.target.value })}>
                <option value="">Currency (optional)</option>
                <option value="USD">USD</option>
                <option value="ZWL">ZWL</option>
              </select>
              <select className="w-full border rounded px-3 py-2" value={editing.store || ''} onChange={(e) => setEditing({ ...editing, store: Number(e.target.value) })}>
                <option value="">Select Store *</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={Boolean(editing.is_active)} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Active
              </label>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setEditing(null)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {managingStores && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h4 className="font-semibold">Manage Stores</h4>
              <p className="text-sm text-gray-600 mt-1">Add or remove stores linked to this mobile money account</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stores</label>
                {accountStores.length === 0 ? (
                  <p className="text-sm text-gray-500">No stores linked</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {accountStores.map((storeId) => {
                      const store = stores.find((s) => s.id === storeId);
                      return store ? (
                        <div key={storeId} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded">
                          <span>{store.name}</span>
                          {accountStores.length > 1 && (
                            <button
                              onClick={() => removeStoreFromAccount(storeId)}
                              className="text-red-600 hover:text-red-800 text-sm font-bold"
                              title="Remove store"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Store</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value=""
                  onChange={(e) => {
                    const storeId = Number(e.target.value);
                    if (storeId) {
                      addStoreToAccount(storeId);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Select a store to add</option>
                  {stores
                    .filter((s) => !accountStores.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                {stores.filter((s) => !accountStores.includes(s.id)).length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">All available stores are already linked</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={closeStoreManagement}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMoney; 