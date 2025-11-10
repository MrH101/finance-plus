import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { toast } from 'react-hot-toast';
import { DataTable } from '../components/DataTable';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface ARInvoice {
  id: number;
  invoice_number: string;
  customer: number;
  customer_name?: string;
  date: string;
  total: number;
  due_date?: string;
  status?: string;
}

const AccountsReceivable: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<ARInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<ARInvoice>>({});
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ARInvoice | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        api.get('/customers/'),
        api.get('/pos-sales/'),
      ]);
      const customersList = c.data?.results || c.data || [];
      const sales = (s.data?.results || s.data || []) as any[];
      const mapped: ARInvoice[] = (Array.isArray(sales) ? sales : []).map((x: any) => ({
        id: x.id,
        invoice_number: x.sale_number || `SALE-${x.id}`,
        customer: x.customer || x.customer_id || 0,
        customer_name: x.customer_name,
        date: x.created_at || x.date || new Date().toISOString(),
        total: parseFloat(x.total_amount || 0),
        status: x.status,
      }));
      setCustomers(Array.isArray(customersList) ? customersList : []);
      setInvoices(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createInvoice = async () => {
    if (!form.customer || !form.total) return;
    try {
      // Create a POS sale as an invoice
      await api.post('/pos-sales/', { customer: form.customer, total_amount: form.total, payment_method: 'CASH', status: 'DRAFT' });
      toast.success('Invoice created');
      setForm({});
      load();
    } catch (e) { toast.error('Failed to create invoice'); }
  };

  const deleteInvoice = async (id: number) => {
    const prev = [...invoices];
    setInvoices((cur) => cur.filter((x) => x.id !== id));
    try { await api.delete(`/pos-sales/${id}/`); toast.success('Invoice deleted'); } catch { setInvoices(prev); toast.error('Failed to delete'); }
  };

  const markPaid = async (id: number) => {
    const prev = [...invoices];
    setInvoices((cur) => cur.map((x) => x.id === id ? { ...x, status: 'PAID' } : x));
    try { await api.put(`/pos-sales/${id}/`, { status: 'PAID' }); toast.success('Marked as paid'); } catch { setInvoices(prev); toast.error('Failed to update'); }
  };

  const filtered = invoices.filter((inv) => {
    const matchesQ = q ? (
      (inv.invoice_number || '').toLowerCase().includes(q.toLowerCase()) ||
      (inv.customer_name || customers.find(c => c.id === inv.customer)?.name || '').toLowerCase().includes(q.toLowerCase())
    ) : true;
    const matchesStatus = statusFilter ? (inv.status === statusFilter) : true;
    return matchesQ && matchesStatus;
  });

  const columns = [
    { header: 'Invoice #', accessor: 'invoice_number' as const, sortable: true, render: (v: any, inv: ARInvoice) => v || inv.id },
    { header: 'Customer', accessor: 'customer_name' as const, sortable: true, render: (_: any, inv: ARInvoice) => inv.customer_name || customers.find(c => c.id === inv.customer)?.name || inv.customer },
    { header: 'Date', accessor: 'date' as const, sortable: true, render: (v: string) => new Date(v).toLocaleDateString() },
    { header: 'Total', accessor: 'total' as const, sortable: true },
    { header: 'Status', accessor: 'status' as const, sortable: true },
  ];

  const openEdit = (inv: ARInvoice) => {
    setEditing(inv);
    editFormik.setValues({
      customer: inv.customer,
      date: inv.date.slice(0,10),
      total: inv.total,
      status: inv.status || 'DRAFT',
    });
    setEditOpen(true);
  };

  const editFormik = useFormik<{ customer: number | string; date: string; total: number | string; status: string }>({
    initialValues: { customer: '', date: '', total: '', status: 'DRAFT' },
    validationSchema: Yup.object({
      customer: Yup.number().required('Customer is required'),
      date: Yup.string().required('Date is required'),
      total: Yup.number().required('Total is required').min(0, 'Must be positive'),
      status: Yup.string().oneOf(['DRAFT','SENT','PAID','OVERDUE']).required(),
    }),
    onSubmit: async (values) => {
      if (!editing) return;
      const prev = [...invoices];
      const optimistic = { ...editing, customer: Number(values.customer), date: values.date, total: Number(values.total), status: values.status } as ARInvoice;
      setInvoices((cur) => cur.map((x) => x.id === editing.id ? optimistic : x));
      try {
        await api.put(`/pos-sales/${editing.id}/`, {
          customer: Number(values.customer),
          date: values.date,
          total: Number(values.total),
          status: values.status,
        });
        toast.success('Invoice updated');
        setEditOpen(false);
        setEditing(null);
      } catch {
        setInvoices(prev);
        toast.error('Failed to update invoice');
      }
    },
  });

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Accounts Receivable</h2>
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2" placeholder="Search invoices/customers" value={q} onChange={(e) => setQ(e.target.value)} />
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
          <h3 className="text-lg font-semibold mb-3">Invoices</h3>
          {loading ? (
            <Skeleton lines={6} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No invoices" description="Create your first customer invoice." />
          ) : (
            <DataTable<ARInvoice>
              columns={columns as any}
              data={filtered}
              searchable
              onRowClick={openEdit}
              enableExport
              exportFileName="accounts_receivable.csv"
            />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">New Invoice</h3>
          <div className="space-y-3">
            <select className="w-full border rounded px-3 py-2" value={form.customer || ''} onChange={(e) => setForm({ ...form, customer: Number(e.target.value) })}>
              <option value="">Select Customer</option>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <input type="number" className="w-full border rounded px-3 py-2" placeholder="Total Amount" value={form.total || ''} onChange={(e) => setForm({ ...form, total: Number(e.target.value) })} />
            <button onClick={createInvoice} className="bg-blue-600 text-white px-4 py-2 rounded">Create Invoice</button>
          </div>
        </div>
      </div>

      {editOpen && editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Invoice</h3>
            <form onSubmit={editFormik.handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Customer</label>
                <select name="customer" className="w-full border rounded px-3 py-2" value={editFormik.values.customer} onChange={editFormik.handleChange}>
                  <option value="">Select Customer</option>
                  {customers.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                {editFormik.touched.customer && editFormik.errors.customer && (<div className="text-red-600 text-xs">{editFormik.errors.customer}</div>)}
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

export default AccountsReceivable; 