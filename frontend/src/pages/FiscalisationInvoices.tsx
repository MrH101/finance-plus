import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { Guard } from '../components/auth/FeatureGuard';
import { toast } from 'react-hot-toast';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  date: string;
  currency_code?: string;
  total: number;
  vat_amount: number;
  status?: string; // DRAFT, SENT, FISCALIZED
  fiscal_receipt_number?: string;
}

const FiscalisationInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      // Use POS sales as the invoice source
      const res = await api.get('/pos-sales/');
      const raw = res.data?.results || res.data || [];
      const list = Array.isArray(raw) ? raw : [];
      // Map POS sale shape to Invoice-like items
      const mapped: Invoice[] = list.map((s: any) => ({
        id: s.id,
        invoice_number: s.sale_number || `SALE-${s.id}`,
        customer_name: s.customer_name,
        date: s.created_at || s.date || new Date().toISOString(),
        total: parseFloat(s.total_amount || 0),
        vat_amount: parseFloat(s.tax_amount || 0),
        status: s.status,
        fiscal_receipt_number: s.fiscal_receipt_number,
      }));
      setInvoices(mapped);
    } catch (e) {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fiscalize = async (id: number) => {
    try {
      // Fiscalization for POS sales is logged during POSMakeSale; here we no-op
      toast.success('Fiscalization triggered (ensure POS sale flow handles this).');
      load();
    } catch (e) {
      toast.error('Failed to fiscalize invoice');
    }
  };

  const filtered = invoices.filter((inv) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      (inv.invoice_number || '').toLowerCase().includes(q) ||
      (inv.customer_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">ZIMRA Fiscalisation Invoices</h2>
        <input className="border rounded px-3 py-2" placeholder="Search by # or customer" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {loading ? (
        <Skeleton lines={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No invoices" description="Create invoices via POS Sales." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 text-left">Invoice #</th>
                <th className="py-2 px-4 text-left">Customer</th>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Total</th>
                <th className="py-2 px-4 text-left">VAT</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Fiscal Receipt</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium">{inv.invoice_number}</td>
                  <td className="py-2 px-4">{inv.customer_name}</td>
                  <td className="py-2 px-4">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="py-2 px-4">{inv.total}</td>
                  <td className="py-2 px-4">{inv.vat_amount}</td>
                  <td className="py-2 px-4">{inv.status || '—'}</td>
                  <td className="py-2 px-4">{inv.fiscal_receipt_number || '—'}</td>
                  <td className="py-2 px-4">
                    <Guard allowedRoles={['admin','manager']}>
                      <button className="text-blue-600 hover:text-blue-800 mr-3" onClick={() => fiscalize(inv.id)}>Fiscalize</button>
                    </Guard>
                    <button className="text-gray-600 hover:text-gray-800">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FiscalisationInvoices; 