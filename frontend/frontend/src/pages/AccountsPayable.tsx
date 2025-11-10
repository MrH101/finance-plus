import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { toast } from 'react-hot-toast';
import { DataTable } from '../components/DataTable';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface APBill {
  id: number;
  bill_number: string;
  supplier: number;
  supplier_name?: string;
  date: string;
  total: number;
  due_date?: string;
  status?: string;
}

const AccountsPayable: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bills, setBills] = useState<APBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<APBill>>({});
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<APBill | null>(null);
  const [billEndpoint, setBillEndpoint] = useState<'/bills/' | '/purchase-orders/'>('/bills/');

  const load = async () => {
    setLoading(true);
    try {
      // Suppliers first, with fallback to vendors
      let suppliersList: any[] = [];
      try {
        const s = await api.get('/suppliers/');
        suppliersList = s.data?.results || s.data || [];
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const v = await api.get('/vendors/');
          const raw = v.data?.results || v.data || [];
          suppliersList = Array.isArray(raw) ? raw.map((r: any) => ({ id: r.id, name: r.name || r.vendor_name, email: r.email, phone: r.phone })) : [];
        } else {
          throw err;
        }
      }
      setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);

      // Bills with fallback to purchase orders
      let billsList: any[] = [];
      try {
        const b = await api.get('/bills/');
        setBillEndpoint('/bills/');
        billsList = b.data?.results || b.data || [];
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const po = await api.get('/purchase-orders/');
          setBillEndpoint('/purchase-orders/');
          const raw = po.data?.results || po.data || [];
          billsList = Array.isArray(raw)
            ? raw.map((r: any): APBill => ({
                id: r.id,
                bill_number: r.order_number || r.po_number || String(r.id),
                supplier: r.vendor || r.vendor_id || r.supplier_id,
                supplier_name: r.vendor_name || r.vendor?.name || r.supplier_name,
                date: r.order_date || r.created_at || new Date().toISOString(),
                total: r.total_amount || r.amount || 0,
                due_date: r.due_date,
                status: r.status || 'DRAFT',
              }))
            : [];
        } else {
          throw err;
        }
      }
      setBills(Array.isArray(billsList) ? billsList : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createBill = async () => {
    if (!form.supplier || !form.total || !form.date) return;
    try {
      if (billEndpoint === '/bills/') {
        await api.post('/bills/', { supplier: form.supplier, total: form.total, date: form.date });
      } else {
        // Map to purchase order create
        await api.post('/purchase-orders/', {
          vendor: form.supplier,
          order_date: form.date,
          total_amount: form.total,
          status: 'DRAFT',
        });
      }
      toast.success('Bill created');
      setForm({});
      load();
    } catch (e) { toast.error('Failed to create bill'); }
  };

  const deleteBill = async (id: number) => {
    const prev = [...bills];
    setBills((cur) => cur.filter((x) => x.id !== id));
    try {
      if (billEndpoint === '/bills/') {
        await api.delete(`/bills/${id}/`);
      } else {
        await api.delete(`/purchase-orders/${id}/`);
      }
      toast.success('Bill deleted');
    } catch {
      setBills(prev);
      toast.error('Failed to delete');
    }
  };

  const markPaid = async (id: number) => {
    const prev = [...bills];
    setBills((cur) => cur.map((x) => x.id === id ? { ...x, status: 'PAID' } : x));
    try {
      if (billEndpoint === '/bills/') {
        await api.put(`/bills/${id}/`, { status: 'PAID' });
      } else {
        await api.put(`/purchase-orders/${id}/`, { status: 'PAID' });
      }
      toast.success('Marked as paid');
    } catch {
      setBills(prev);
      toast.error('Failed to update');
    }
  };

  const filtered = bills.filter((bill) => {
    const matchesQ = q ? (
      (bill.bill_number || '').toLowerCase().includes(q.toLowerCase()) ||
      (bill.supplier_name || suppliers.find(s => s.id === bill.supplier)?.name || '').toLowerCase().includes(q.toLowerCase())
    ) : true;
    const matchesStatus = statusFilter ? (bill.status === statusFilter) : true;
    return matchesQ && matchesStatus;
  });

  const columns = [
    { header: 'Bill #', accessor: 'bill_number' as const, sortable: true, render: (v: any, b: APBill) => v || b.id },
    { header: 'Supplier', accessor: 'supplier_name' as const, sortable: true, render: (_: any, b: APBill) => b.supplier_name || suppliers.find(s => s.id === b.supplier)?.name || b.supplier },
    { header: 'Date', accessor: 'date' as const, sortable: true, render: (v: string) => new Date(v).toLocaleDateString() },
    { header: 'Total', accessor: 'total' as const, sortable: true },
    { header: 'Status', accessor: 'status' as const, sortable: true },
  ];

  const openEdit = (b: APBill) => {
    setEditing(b);
    editFormik.setValues({ supplier: b.supplier, date: b.date.slice(0,10), total: b.total, status: b.status || 'DRAFT' });
    setEditOpen(true);
  };

  const editFormik = useFormik<{ supplier: number | string; date: string; total: number | string; status: string }>({
    initialValues: { supplier: '', date: '', total: '', status: 'DRAFT' },
    validationSchema: Yup.object({
      supplier: Yup.number().required('Supplier is required'),
      date: Yup.string().required('Date is required'),
      total: Yup.number().required('Total is required').min(0, 'Must be positive'),
      status: Yup.string().oneOf(['DRAFT','SENT','PAID','OVERDUE']).required(),
    }),
    onSubmit: async (values) => {
      if (!editing) return;
      const prev = [...bills];
      const optimistic = { ...editing, supplier: Number(values.supplier), date: values.date, total: Number(values.total), status: values.status } as APBill;
      setBills((cur) => cur.map((x) => x.id === editing.id ? optimistic : x));
      try {
        await api.put(`/bills/${editing.id}/`, { supplier: Number(values.supplier), date: values.date, total: Number(values.total), status: values.status });
        toast.success('Bill updated');
        setEditOpen(false);
        setEditing(null);
      } catch {
        setBills(prev);
        toast.error('Failed to update bill');
      }
    },
  });

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Accounts Payable</h2>
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2" placeholder="Search bills/suppliers" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Bills</h3>
          {loading ? (
            <Skeleton lines={6} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No bills" description="Create your first supplier bill." />
          ) : (
            <DataTable<APBill>
              columns={columns as any}
              data={filtered}
              searchable
              onRowClick={openEdit}
              enableExport
              exportFileName="accounts_payable.csv"
            />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">New Bill</h3>
          <div className="space-y-3">
            <select className="w-full border rounded px-3 py-2" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: Number(e.target.value) })}>
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <input type="date" className="w-full border rounded px-3 py-2" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input type="number" className="w-full border rounded px-3 py-2" placeholder="Total Amount" value={form.total || ''} onChange={(e) => setForm({ ...form, total: Number(e.target.value) })} />
            <button onClick={createBill} className="bg-blue-600 text-white px-4 py-2 rounded">Create Bill</button>
          </div>
        </div>
      </div>

      {editOpen && editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Bill</h3>
            <form onSubmit={editFormik.handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Supplier</label>
                <select name="supplier" className="w-full border rounded px-3 py-2" value={editFormik.values.supplier} onChange={editFormik.handleChange}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
                {editFormik.touched.supplier && editFormik.errors.supplier && (<div className="text-red-600 text-xs">{editFormik.errors.supplier}</div>)}
              </div>
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input name="date" type="date" className="w-full border rounded px-3 py-2" value={editFormik.values.date} onChange={editFormik.handleChange} />
                {editFormik.touched.date && editFormik.errors.date && (<div className="text-red-600 text-xs">{editFormik.errors.date}</div>)}
              </div>
              <div>
                <label className="block text-sm mb-1">Total</label>
                <input name="total" type="number" className="w-full border rounded px-3 py-2" value={editFormik.values.total} onChange={editFormik.handleChange} />
                {editFormik.touched.total && editFormik.errors.total && (<div className="text-red-600 text-xs">{editFormik.errors.total}</div>)}
              </div>
              <div>
                <label className="block text-sm mb-1">Status</label>
                <select name="status" className="w-full border rounded px-3 py-2" value={editFormik.values.status} onChange={editFormik.handleChange}>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 bg-gray-100 rounded" onClick={() => { setEditOpen(false); setEditing(null); }}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable; 