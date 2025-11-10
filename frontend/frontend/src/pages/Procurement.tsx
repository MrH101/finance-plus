import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { toast } from 'react-hot-toast';

interface Supplier { id: number; name: string; email?: string; phone?: string; }
interface PO { id: number; po_number?: string; supplier: number; supplier_name?: string; date: string; total: number; status?: string; }

const Procurement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pos, setPOs] = useState<PO[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<PO>>({});
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([ api.get('/suppliers/'), api.get('/purchase-orders/') ]);
      setSuppliers(s.data?.results || s.data || []);
      setPOs(p.data?.results || p.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createPO = async () => {
    if (!form.supplier || !form.total) return;
    try { await api.post('/purchase-orders/', { supplier: form.supplier, total: form.total, date: new Date().toISOString().slice(0,10) }); toast.success('PO created'); setForm({}); load(); } catch { toast.error('Failed to create PO'); }
  };

  const approvePO = async (id: number) => {
    const prev = [...pos];
    setPOs((cur) => cur.map((p) => p.id === id ? { ...p, status: 'APPROVED' } : p));
    try { await api.post(`/purchase-orders/${id}/approve/`); toast.success('PO approved'); } catch { setPOs(prev); toast.error('Failed to approve'); }
  };

  const rejectPO = async (id: number) => {
    const prev = [...pos];
    setPOs((cur) => cur.map((p) => p.id === id ? { ...p, status: 'REJECTED' } : p));
    try { await api.post(`/purchase-orders/${id}/reject/`); toast.success('PO rejected'); } catch { setPOs(prev); toast.error('Failed to reject'); }
  };

  const filtered = pos.filter((po) => {
    const matchesQ = q ? (
      (po.po_number || '').toLowerCase().includes(q.toLowerCase()) ||
      (po.supplier_name || suppliers.find(s => s.id === po.supplier)?.name || '').toLowerCase().includes(q.toLowerCase())
    ) : true;
    const matchesStatus = statusFilter ? (po.status === statusFilter) : true;
    return matchesQ && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Procurement</h2>
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2" placeholder="Search POs/suppliers" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Purchase Orders</h3>
          {loading ? <Skeleton lines={6} /> : filtered.length === 0 ? <EmptyState title="No purchase orders" description="Create your first PO." /> : (
            <div className="overflow-x-auto"><table className="min-w-full bg-white rounded shadow"><thead><tr className="bg-gray-50"><th className="py-2 px-4 text-left">PO #</th><th className="py-2 px-4 text-left">Supplier</th><th className="py-2 px-4 text-left">Date</th><th className="py-2 px-4 text-left">Total</th><th className="py-2 px-4 text-left">Status</th><th className="py-2 px-4 text-left">Actions</th></tr></thead><tbody>
              {filtered.map(po => (<tr key={po.id} className="border-b hover:bg-gray-50"><td className="py-2 px-4 font-medium">{po.po_number || po.id}</td><td className="py-2 px-4">{po.supplier_name || suppliers.find(s => s.id === po.supplier)?.name || po.supplier}</td><td className="py-2 px-4">{new Date(po.date).toLocaleDateString()}</td><td className="py-2 px-4">{po.total}</td><td className="py-2 px-4">{po.status || '—'}</td><td className="py-2 px-4 text-sm"><button onClick={() => approvePO(po.id)} className="text-green-600 hover:text-green-800 mr-3">Approve</button><button onClick={() => rejectPO(po.id)} className="text-red-600 hover:text-red-800">Reject</button></td></tr>))}
            </tbody></table></div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">New Purchase Order</h3>
          <div className="space-y-3">
            <select className="w-full border rounded px-3 py-2" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: Number(e.target.value) })}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <input type="number" className="w-full border rounded px-3 py-2" placeholder="Total Amount" value={form.total || ''} onChange={(e) => setForm({ ...form, total: Number(e.target.value) })} />
            <button onClick={createPO} className="bg-blue-600 text-white px-4 py-2 rounded">Create PO</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Procurement; 