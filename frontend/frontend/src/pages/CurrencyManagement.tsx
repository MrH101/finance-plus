import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { FiDollarSign, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiGlobe } from 'react-icons/fi';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_usd: number;
  is_base_currency: boolean;
  is_active: boolean;
  last_updated: string;
}

interface ExchangeRate {
  id: number;
  from_currency: Currency;
  to_currency: Currency;
  rate: number;
  date: string;
  source: string;
}

const CurrencyManagement: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    symbol: '',
    exchange_rate_to_usd: 1,
    is_base_currency: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [currenciesRes, ratesRes] = await Promise.all([
        api.get('/currencies/'),
        api.get('/exchange-rates/')
      ]);
      setCurrencies(currenciesRes.data?.results || currenciesRes.data || []);
      setExchangeRates(ratesRes.data?.results || ratesRes.data || []);
    } catch (err) {
      toast.error('Failed to load currency data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateExchangeRates = async () => {
    setUpdating(true);
    try {
      await api.post('/currencies/update-rates/');
      toast.success('Exchange rates updated successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to update exchange rates');
    } finally {
      setUpdating(false);
    }
  };

  const addCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/currencies/', newCurrency);
      toast.success('Currency added successfully!');
      setShowAddModal(false);
      setNewCurrency({ code: '', name: '', symbol: '', exchange_rate_to_usd: 1, is_base_currency: false });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add currency');
    }
  };

  const toggleCurrencyStatus = async (id: number, isActive: boolean) => {
    try {
      await api.patch(`/currencies/${id}/`, { is_active: !isActive });
      toast.success(`Currency ${isActive ? 'deactivated' : 'activated'} successfully!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update currency status');
    }
  };

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('en-ZW', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(rate);
  };

  const getRateChange = (currency: Currency) => {
    // Mock rate change - in real implementation, compare with previous rates
    const change = Math.random() * 0.1 - 0.05; // ±5% change
    return {
      value: change,
      isPositive: change > 0,
    };
  };

  const zimbabweCurrencies = currencies.filter(c => ['USD', 'ZWL', 'ZAR', 'BWP'].includes(c.code));
  const otherCurrencies = currencies.filter(c => !['USD', 'ZWL', 'ZAR', 'BWP'].includes(c.code));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Currency Management</h1>
          <p className="text-gray-600">Manage multi-currency support for Zimbabwe's economic environment</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={updateExchangeRates}
            disabled={updating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Updating...' : 'Update Rates'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            + Add Currency
          </button>
        </div>
      </div>

      {/* Zimbabwe Key Currencies */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiGlobe className="w-5 h-5" />
          Zimbabwe Key Currencies
        </h2>
        {loading ? (
          <Skeleton lines={4} />
        ) : zimbabweCurrencies.length === 0 ? (
          <EmptyState title="No currencies configured" description="Add currencies to get started with multi-currency support." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zimbabweCurrencies.map((currency) => {
              const change = getRateChange(currency);
              return (
                <div key={currency.id} className="bg-white p-6 rounded-lg shadow border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FiDollarSign className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-lg">{currency.code}</span>
                      {currency.is_base_currency && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Base</span>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 text-sm ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {change.isPositive ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
                      {Math.abs(change.value * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Exchange Rate to USD</p>
                      <p className="text-xl font-bold">{formatRate(currency.exchange_rate_to_usd)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Symbol</p>
                      <p className="text-lg">{currency.symbol}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className={`px-2 py-1 rounded text-xs ${currency.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {currency.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => toggleCurrencyStatus(currency.id, currency.is_active)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {currency.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Other Currencies */}
      {otherCurrencies.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Other Currencies</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate to USD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {otherCurrencies.map((currency) => (
                  <tr key={currency.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{currency.symbol}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{currency.code}</div>
                          <div className="text-sm text-gray-500">{currency.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatRate(currency.exchange_rate_to_usd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${currency.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {currency.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(currency.last_updated).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleCurrencyStatus(currency.id, currency.is_active)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {currency.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Currency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Currency</h3>
            <form onSubmit={addCurrency} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., USD, ZWL"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  placeholder="e.g., US Dollar, Zimbabwe Dollar"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  placeholder="e.g., $, Z$"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate to USD</label>
                <input
                  type="number"
                  step="0.000001"
                  className="w-full border rounded px-3 py-2"
                  value={newCurrency.exchange_rate_to_usd}
                  onChange={(e) => setNewCurrency({ ...newCurrency, exchange_rate_to_usd: parseFloat(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_base"
                  className="mr-2"
                  checked={newCurrency.is_base_currency}
                  onChange={(e) => setNewCurrency({ ...newCurrency, is_base_currency: e.target.checked })}
                />
                <label htmlFor="is_base" className="text-sm text-gray-700">Set as base currency</label>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-100 rounded" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Add Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyManagement;
