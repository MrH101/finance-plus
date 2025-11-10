import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { toast } from 'react-hot-toast';

interface BOM { id: number; name: string; code?: string; product?: string; quantity?: number; }
interface WorkOrder { id: number; wo_number?: string; bom: number; quantity: number; status?: string; created_at?: string; }

const Manufacturing: React.FC = () => {
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [wos, setWOs] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<WorkOrder>>({});
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const [b, w] = await Promise.all([ api.get('/bills-of-materials/'), api.get('/work-orders/') ]);
      setBOMs(b.data?.results || b.data || []);
      setWOs(w.data?.results || w.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createWO = async () => {
    if (!form.bom || !form.quantity) return;
    try { await api.post('/work-orders/', { bom: form.bom, quantity: form.quantity }); toast.success('Work Order created'); setForm({}); load(); } catch { toast.error('Failed to create Work Order'); }
  };

  const transition = async (id: number, status: string) => {
    const prev = [...wos];
    setWOs((cur) => cur.map((w) => w.id === id ? { ...w, status } : w));
    try { await api.post(`/work-orders/${id}/transition/`, { status }); toast.success(`WO ${status.toLowerCase()}`); } catch { setWOs(prev); toast.error('Failed to update'); }
  };

  const filtered = statusFilter ? wos.filter((w) => w.status === statusFilter) : wos;

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Manufacturing</h2>
        <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <h3 className="text-lg font-semibold mb-3">Bills of Materials</h3>
      {loading ? <Skeleton lines={4} /> : boms.length === 0 ? <EmptyState title="No BOMs" description="Create BOMs via admin or API." /> : (
        <div className="overflow-x-auto mb-8"><table className="min-w-full bg-white rounded shadow"><thead><tr className="bg-gray-50"><th className="py-2 px-4 text-left">Name</th><th className="py-2 px-4 text-left">Product</th><th className="py-2 px-4 text-left">Qty</th></tr></thead><tbody>
          {boms.map(b => (<tr key={b.id} className="border-b hover:bg-gray-50"><td className="py-2 px-4 font-medium">{b.name}</td><td className="py-2 px-4">{b.product || '—'}</td><td className="py-2 px-4">{b.quantity || '—'}</td></tr>))}
        </tbody></table></div>
      )}

      <h3 className="text-lg font-semibold mb-3">Work Orders</h3>
      {loading ? <Skeleton lines={6} /> : filtered.length === 0 ? <EmptyState title="No Work Orders" description="Create your first Work Order." /> : (
        <div className="overflow-x-auto"><table className="min-w-full bg-white rounded shadow"><thead><tr className="bg-gray-50"><th className="py-2 px-4 text-left">WO #</th><th className="py-2 px-4 text-left">BOM</th><th className="py-2 px-4 text-left">Qty</th><th className="py-2 px-4 text-left">Status</th><th className="py-2 px-4 text-left">Actions</th></tr></thead><tbody>
          {filtered.map(w => (<tr key={w.id} className="border-b hover:bg-gray-50"><td className="py-2 px-4 font-medium">{w.wo_number || w.id}</td><td className="py-2 px-4">{boms.find(b => b.id === w.bom)?.name || w.bom}</td><td className="py-2 px-4">{w.quantity}</td><td className="py-2 px-4">{w.status || '—'}</td><td className="py-2 px-4 text-sm"><button onClick={() => transition(w.id, 'IN_PROGRESS')} className="text-blue-600 hover:text-blue-800 mr-3">Start</button><button onClick={() => transition(w.id, 'COMPLETED')} className="text-green-600 hover:text-green-800 mr-3">Complete</button><button onClick={() => transition(w.id, 'CANCELLED')} className="text-red-600 hover:text-red-800">Cancel</button></td></tr>))}
        </tbody></table></div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">New Work Order</h3>
        <div className="space-y-3">
          <select className="w-full border rounded px-3 py-2" value={form.bom || ''} onChange={(e) => setForm({ ...form, bom: Number(e.target.value) })}>
            <option value="">Select BOM</option>
            {boms.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
          <input type="number" className="w-full border rounded px-3 py-2" placeholder="Quantity" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <button onClick={createWO} className="bg-blue-600 text-white px-4 py-2 rounded">Create Work Order</button>
        </div>
      </div>
    </div>
  );
};

export default Manufacturing; 