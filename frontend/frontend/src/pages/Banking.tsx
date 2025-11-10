import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { toast } from 'react-hot-toast';

interface BankAccount { id: number; store?: number; name?: string; account_name?: string; account_number: string; balance?: number; current_balance?: number; bank_name?: string; }
interface BankTxn { id: number; account: number; amount: number; date: string; description?: string; reconciled?: boolean; transaction_type?: string; reference?: string; value_date?: string; }
interface Store { id: number; name: string; }

const Banking: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<BankTxn>>({});
  const [editTxnOpen, setEditTxnOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<any>(null);
  const [editForm, setEditForm] = useState<Partial<BankTxn>>({});
  const [accForm, setAccForm] = useState({ store: '' as number | '', account_name: '', account_number: '', bank_name: '', branch_code: '', account_type: 'Current', opening_balance: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [a, t, s] = await Promise.all([ api.get('/bank-accounts/'), api.get('/bank-transactions/'), api.get('/stores/') ]);
      setAccounts(a.data?.results || a.data || []);
      setTxns(t.data?.results || t.data || []);
      setStores(s.data?.results || s.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleReconcile = async (id: number, on: boolean) => {
    const prev = [...txns];
    setTxns((cur) => cur.map((x) => x.id === id ? { ...x, reconciled: on } : x));
    try { await api.put(`/bank-transactions/${id}/`, { reconciled: on }); toast.success('Updated'); } catch { setTxns(prev); toast.error('Failed'); }
  };

  const createTxn = async () => {
    if (!form.account || !form.amount || !form.date) return toast.error('Account, amount and date are required');
    const payload = {
      bank_account: (form as any).account,
      transaction_type: (form as any).transaction_type || 'DEPOSIT',
      amount: Number((form as any).amount),
      reference: (form as any).reference || '',
      description: (form as any).description || '',
      transaction_date: (form as any).date,
      value_date: (form as any).value_date || (form as any).date,
      status: 'COMPLETED',
    };
    try {
      await api.post('/bank-transactions/', payload);
      toast.success('Transaction added');
      setForm({});
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to add transaction';
      toast.error(typeof msg === 'string' ? msg : 'Failed to add transaction');
    }
  };

  const openEditTxn = (tx: any) => {
    setEditingTxn(tx);
    setEditForm({
      account: (tx as any).bank_account ?? (tx as any).account,
      transaction_type: (tx as any).transaction_type || 'DEPOSIT',
      amount: (tx as any).amount,
      reference: (tx as any).reference,
      description: (tx as any).description,
      date: (tx as any).transaction_date || (tx as any).date,
      value_date: (tx as any).value_date || (tx as any).transaction_date || (tx as any).date,
    });
    setEditTxnOpen(true);
  };

  const saveTxn = async () => {
    if (!editingTxn) return;
    if (!editForm.account || !editForm.amount || !editForm.date) return toast.error('Account, amount and date are required');
    const payload = {
      bank_account: (editForm as any).account,
      transaction_type: (editForm as any).transaction_type || 'DEPOSIT',
      amount: Number((editForm as any).amount),
      reference: (editForm as any).reference || '',
      description: (editForm as any).description || '',
      transaction_date: (editForm as any).date,
      value_date: (editForm as any).value_date || (editForm as any).date,
    };
    try {
      await api.put(`/bank-transactions/${(editingTxn as any).id}/`, payload);
      toast.success('Transaction updated');
      setEditTxnOpen(false);
      setEditingTxn(null);
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to update transaction';
      toast.error(typeof msg === 'string' ? msg : 'Failed to update transaction');
    }
  };

  const deleteTxn = async (id: number) => {
    const prev = [...txns];
    setTxns((cur) => cur.filter((t) => (t as any).id !== id));
    try {
      await api.delete(`/bank-transactions/${id}/`);
      toast.success('Transaction deleted');
      load();
    } catch (e: any) {
      setTxns(prev);
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to delete transaction';
      toast.error(typeof msg === 'string' ? msg : 'Failed to delete transaction');
    }
  };

  const deleteAccount = async (id: number) => {
    const prev = [...accounts];
    setAccounts((cur) => cur.filter((a) => (a as any).id !== id));
    try {
      await api.delete(`/bank-accounts/${id}/`);
      toast.success('Bank account deleted');
      load();
    } catch (e: any) {
      setAccounts(prev);
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to delete account';
      toast.error(typeof msg === 'string' ? msg : 'Failed to delete account');
    }
  };

  const [shareTargetStore, setShareTargetStore] = useState<{ [accountId: number]: number | '' }>({});

  const linkAccountToStore = async (account: BankAccount, targetStoreId: number) => {
    if (!targetStoreId) return toast.error('Select a store to share with');
    try {
      await api.post('/bank-accounts/', {
        store: targetStoreId,
        account_name: account.account_name || account.name,
        account_number: account.account_number,
        bank_name: account.bank_name,
        account_type: 'Current',
        opening_balance: account.current_balance ?? 0,
      });
      toast.success('Account shared with store');
      setShareTargetStore((m) => ({ ...m, [account.id]: '' }));
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.error || 'Failed to share account';
      toast.error(typeof msg === 'string' ? msg : 'Failed to share account');
    }
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    // Simple CSV parse: date,amount,description
    const rows = text.split(/\r?\n/).filter(Boolean).slice(1); // skip header
    const payload = rows.map((r) => {
      const [date, amount, description] = r.split(',');
      return { date, amount: Number(amount), description };
    });
    try {
      await api.post('/bank-transactions/import/', { account: form.account, transactions: payload });
      toast.success('Statement imported');
      load();
    } catch { toast.error('Import failed'); }
  };

  const createAccount = async () => {
    if (!accForm.store) return toast.error('Please select a store. A store is required to create a bank account.');
    if (!accForm.account_name || !accForm.account_number || !accForm.bank_name) return toast.error('Please fill required fields');
    try {
      await api.post('/bank-accounts/', {
        store: accForm.store,
        account_name: accForm.account_name,
        account_number: accForm.account_number,
        bank_name: accForm.bank_name,
        branch_code: accForm.branch_code,
        account_type: accForm.account_type,
        opening_balance: Number(accForm.opening_balance || 0),
      });
      toast.success('Bank account created');
      setAccForm({ store: '', account_name: '', account_number: '', bank_name: '', branch_code: '', account_type: 'Current', opening_balance: '' });
      load();
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      // If backend requires a store, auto-create a default one and retry once
      if (status === 400 && (data?.store || (typeof data === 'object' && data && 'store' in data))) {
        try {
          // Create a minimal default store for the business
          await api.post('/stores/', { name: 'Main Store' });
          await api.post('/bank-accounts/', {
            store: accForm.store,
            account_name: accForm.account_name,
            account_number: accForm.account_number,
            bank_name: accForm.bank_name,
            branch_code: accForm.branch_code,
            account_type: accForm.account_type,
            opening_balance: Number(accForm.opening_balance || 0),
          });
          toast.success('Bank account created');
          setAccForm({ store: '', account_name: '', account_number: '', bank_name: '', branch_code: '', account_type: 'Current', opening_balance: '' });
          load();
          return;
        } catch (retryErr: any) {
          const msg = retryErr?.response?.data?.detail || retryErr?.response?.data?.error || 'Failed to create account';
          toast.error(typeof msg === 'string' ? msg : 'Failed to create account');
          return;
        }
      }
      const msg = data?.detail || data?.error || 'Failed to create account';
      toast.error(typeof msg === 'string' ? msg : 'Failed to create account');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-xl font-bold mb-6">Banking</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Accounts</h3>
          {loading ? <Skeleton lines={4} /> : accounts.length === 0 ? <EmptyState title="No bank accounts" description="Add accounts via the form." /> : (
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full bg-white rounded shadow"><thead><tr className="bg-gray-50"><th className="py-2 px-4 text-left">Name</th><th className="py-2 px-4 text-left">Number</th><th className="py-2 px-4 text-left">Store</th><th className="py-2 px-4 text-left">Balance</th><th className="py-2 px-4 text-left">Actions</th></tr></thead><tbody>
                {accounts.map(a => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{a.name || a.account_name}</td>
                    <td className="py-2 px-4">{a.account_number}</td>
                    <td className="py-2 px-4">{stores.find(s => s.id === (a as any).store)?.name || '—'}</td>
                    <td className="py-2 px-4">{(() => {
                      const val = (a as any).current_balance ?? (a as any).opening_balance ?? (a as any).balance;
                      if (val === undefined || val === null || val === '') return '—';
                      const num = Number(val);
                      return isNaN(num) ? String(val) : num.toFixed(2);
                    })()}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1"
                          value={(shareTargetStore as any)[a.id] || ''}
                          onChange={(e) => setShareTargetStore((m) => ({ ...m, [a.id]: e.target.value ? Number(e.target.value) : '' }))}
                        >
                          <option value="">Share to store…</option>
                          {stores
                            .filter(s => s.id !== (a as any).store)
                            .map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                        </select>
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            const target = (shareTargetStore as any)[a.id];
                            if (target) linkAccountToStore(a, target as number);
                            else toast.error('Select a store to share with');
                          }}
                        >Add</button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => { if (window.confirm('Delete this bank account?')) deleteAccount((a as any).id); }}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}

          <h3 className="text-lg font-semibold mb-3">Transactions</h3>
          {loading ? <Skeleton lines={6} /> : txns.length === 0 ? <EmptyState title="No transactions" description="Imported statements will show here." /> : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow"><thead><tr className="bg-gray-50"><th className="py-2 px-4 text-left">Account</th><th className="py-2 px-4 text-left">Date</th><th className="py-2 px-4 text-left">Amount</th><th className="py-2 px-4 text-left">Description</th><th className="py-2 px-4 text-left">Reconciled</th><th className="py-2 px-4 text-left">Actions</th></tr></thead><tbody>
                {txns.map(tx => {
                  const accountId = (tx as any).bank_account ?? (tx as any).account;
                  const accountName = accounts.find(a => (a as any).id === accountId)?.name || accounts.find(a => (a as any).id === accountId)?.account_name || accountId;
                  const dateStr = (tx as any).transaction_date || (tx as any).date;
                  const dateVal = dateStr ? new Date(dateStr) : null;
                  const dateDisplay = dateVal && !isNaN(dateVal.getTime()) ? dateVal.toLocaleDateString() : '—';
                  return (
                    <tr key={(tx as any).id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{accountName}</td>
                      <td className="py-2 px-4">{dateDisplay}</td>
                      <td className="py-2 px-4">{(tx as any).amount}</td>
                      <td className="py-2 px-4">{(tx as any).description || '—'}</td>
                      <td className="py-2 px-4"><input type="checkbox" checked={!!(tx as any).reconciled} onChange={() => toggleReconcile((tx as any).id, !(tx as any).reconciled)} /></td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-3">
                          <button className="text-blue-600 hover:text-blue-800" onClick={() => openEditTxn(tx)}>Edit</button>
                          <button className="text-red-600 hover:text-red-800" onClick={() => { if (window.confirm('Delete this transaction?')) deleteTxn((tx as any).id); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody></table>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">Add Bank Account</h3>
          <p className="text-sm text-gray-600 mb-3">A store is required to create a bank account. Select the store that owns this account.</p>
          <div className="space-y-3 mb-8">
            <select className="w-full border rounded px-3 py-2" value={accForm.store || ''} onChange={(e) => setAccForm({ ...accForm, store: e.target.value ? Number(e.target.value) : '' })}>
              <option value="">Select Store (required)</option>
              {stores.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <input className="w-full border rounded px-3 py-2" placeholder="Account Name" value={accForm.account_name} onChange={(e) => setAccForm({ ...accForm, account_name: e.target.value })} />
            <input className="w-full border rounded px-3 py-2" placeholder="Account Number" value={accForm.account_number} onChange={(e) => setAccForm({ ...accForm, account_number: e.target.value })} />
            <input className="w-full border rounded px-3 py-2" placeholder="Bank Name" value={accForm.bank_name} onChange={(e) => setAccForm({ ...accForm, bank_name: e.target.value })} />
            <input className="w-full border rounded px-3 py-2" placeholder="Branch Code (optional)" value={accForm.branch_code} onChange={(e) => setAccForm({ ...accForm, branch_code: e.target.value })} />
            <select className="w-full border rounded px-3 py-2" value={accForm.account_type} onChange={(e) => setAccForm({ ...accForm, account_type: e.target.value })}>
              <option>Current</option>
              <option>Savings</option>
              <option>Corporate</option>
            </select>
            <input className="w-full border rounded px-3 py-2" type="number" placeholder="Opening Balance" value={accForm.opening_balance} onChange={(e) => setAccForm({ ...accForm, opening_balance: e.target.value })} />
            <button onClick={createAccount} className="bg-green-600 text-white px-4 py-2 rounded">Create Account</button>
          </div>

          <h3 className="text-lg font-semibold mb-3">Add Transaction</h3>
          <div className="space-y-3 mb-6">
            <select className="w-full border rounded px-3 py-2" value={(form as any).account || ''} onChange={(e) => setForm({ ...form, account: Number(e.target.value) })}>
              <option value="">Select Account</option>
              {accounts.map((a) => (<option key={(a as any).id} value={(a as any).id}>{(a as any).name || (a as any).account_name}</option>))}
            </select>
            <select className="w-full border rounded px-3 py-2" value={(form as any).transaction_type || 'DEPOSIT'} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="PAYMENT">Payment</option>
              <option value="RECEIPT">Receipt</option>
              <option value="TRANSFER">Transfer</option>
            </select>
            <input type="date" className="w-full border rounded px-3 py-2" value={(form as any).date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input type="date" className="w-full border rounded px-3 py-2" value={(form as any).value_date || ''} onChange={(e) => setForm({ ...form, value_date: e.target.value })} placeholder="Value Date (optional)" />
            <input type="number" className="w-full border rounded px-3 py-2" placeholder="Amount" value={(form as any).amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            <input type="text" className="w-full border rounded px-3 py-2" placeholder="Reference (optional)" value={(form as any).reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            <input type="text" className="w-full border rounded px-3 py-2" placeholder="Description" value={(form as any).description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <button onClick={createTxn} className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
          </div>

          <h3 className="text-lg font-semibold mb-3">Import Statement (CSV)</h3>
          <div className="space-y-3">
            <select className="w-full border rounded px-3 py-2" value={(form as any).account || ''} onChange={(e) => setForm({ ...form, account: Number(e.target.value) })}>
              <option value="">Select Account</option>
              {accounts.map((a) => (<option key={(a as any).id} value={(a as any).id}>{(a as any).name || (a as any).account_name}</option>))}
            </select>
            <input type="file" accept=".csv" onChange={importCSV} />
          </div>
        </div>
      </div>
      {editTxnOpen && editingTxn && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>
            <div className="space-y-3">
              <select className="w-full border rounded px-3 py-2" value={(editForm as any).account || ''} onChange={(e) => setEditForm({ ...editForm, account: Number(e.target.value) })}>
                <option value="">Select Account</option>
                {accounts.map((a) => (<option key={(a as any).id} value={(a as any).id}>{(a as any).name || (a as any).account_name}</option>))}
              </select>
              <select className="w-full border rounded px-3 py-2" value={(editForm as any).transaction_type || 'DEPOSIT'} onChange={(e) => setEditForm({ ...editForm, transaction_type: e.target.value })}>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="PAYMENT">Payment</option>
                <option value="RECEIPT">Receipt</option>
                <option value="TRANSFER">Transfer</option>
              </select>
              <input type="date" className="w-full border rounded px-3 py-2" value={(editForm as any).date || ''} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
              <input type="date" className="w-full border rounded px-3 py-2" value={(editForm as any).value_date || ''} onChange={(e) => setEditForm({ ...editForm, value_date: e.target.value })} placeholder="Value Date (optional)" />
              <input type="number" className="w-full border rounded px-3 py-2" placeholder="Amount" value={(editForm as any).amount || ''} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} />
              <input type="text" className="w-full border rounded px-3 py-2" placeholder="Reference (optional)" value={(editForm as any).reference || ''} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} />
              <input type="text" className="w-full border rounded px-3 py-2" placeholder="Description" value={(editForm as any).description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              <div className="flex justify-end gap-2 pt-2">
                <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => { setEditTxnOpen(false); setEditingTxn(null); }}>Cancel</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={saveTxn}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banking; 