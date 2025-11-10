import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { Guard } from '../components/auth/FeatureGuard';
import { toast } from 'react-hot-toast';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_usd: number;
  is_base_currency: boolean;
  is_active: boolean;
  last_updated?: string;
}

const CurrencySettings: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/currencies/');
      setCurrencies(res.data?.results || res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateCurrency = async (id: number, patch: Partial<Currency>) => {
    const prev = [...currencies];
    setCurrencies((cur) => cur.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    try {
      await api.put(`/currencies/${id}/`, { ...currencies.find(c => c.id === id), ...patch });
      toast.success('Currency updated');
    } catch (e) {
      setCurrencies(prev);
      toast.error('Failed to update currency');
    }
  };

  const setBaseCurrency = async (id: number) => {
    const prev = [...currencies];
    setCurrencies((cur) => cur.map((c) => ({ ...c, is_base_currency: c.id === id })));
    try {
      await api.put(`/currencies/${id}/`, { is_base_currency: true });
      toast.success('Base currency updated');
    } catch (e) {
      setCurrencies(prev);
      toast.error('Failed to set base currency');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Currency Configuration</h2>
          <p className="text-sm text-gray-500">Manage USD/ZWL and other currencies, exchange rates, and base currency.</p>
        </div>
      </div>

      {loading ? (
        <Skeleton lines={6} />
      ) : (currencies?.length || 0) === 0 ? (
        <EmptyState title="No currencies" description="Add currencies via backend or initial setup script." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 text-left">Code</th>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Symbol</th>
                <th className="py-2 px-4 text-left">Rate → USD</th>
                <th className="py-2 px-4 text-left">Base</th>
                <th className="py-2 px-4 text-left">Active</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium">{c.code}</td>
                  <td className="py-2 px-4">{c.name}</td>
                  <td className="py-2 px-4">{c.symbol}</td>
                  <td className="py-2 px-4">
                    <Guard allowedRoles={['admin','manager']} fallback={<span>{c.exchange_rate_to_usd}</span>}>
                      <input
                        type="number"
                        step="0.000001"
                        className="border rounded px-2 py-1 w-32"
                        value={c.exchange_rate_to_usd}
                        onChange={(e) => setCurrencies((cur) => cur.map((x) => x.id === c.id ? { ...x, exchange_rate_to_usd: Number(e.target.value) } : x))}
                        onBlur={() => updateCurrency(c.id, { exchange_rate_to_usd: c.exchange_rate_to_usd })}
                      />
                    </Guard>
                  </td>
                  <td className="py-2 px-4">
                    <Guard allowedRoles={['admin']} fallback={<span>{c.is_base_currency ? 'Yes' : 'No'}</span>}>
                      <input type="radio" name="baseCurrency" checked={c.is_base_currency} onChange={() => setBaseCurrency(c.id)} />
                    </Guard>
                  </td>
                  <td className="py-2 px-4">
                    <Guard allowedRoles={['admin','manager']} fallback={<span>{c.is_active ? 'Active' : 'Inactive'}</span>}>
                      <input type="checkbox" checked={c.is_active} onChange={() => updateCurrency(c.id, { is_active: !c.is_active })} />
                    </Guard>
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-500">{c.last_updated ? new Date(c.last_updated).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CurrencySettings; 