import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { DataTable } from '../components/DataTable';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { FiDollarSign, FiRefreshCw, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

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
  from_currency: number;
  to_currency: number;
  rate: number;
  date: string;
  source: string;
}

const CurrencyManagement: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [updatingRates, setUpdatingRates] = useState(false);

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

  const formik = useFormik({
    initialValues: {
      code: '',
      name: '',
      symbol: '',
      exchange_rate_to_usd: 1.0,
      is_base_currency: false,
      is_active: true,
    },
    validationSchema: Yup.object({
      code: Yup.string().required('Currency code is required').length(3, 'Must be 3 characters'),
      name: Yup.string().required('Currency name is required'),
      symbol: Yup.string().required('Currency symbol is required'),
      exchange_rate_to_usd: Yup.number().required('Exchange rate is required').min(0.000001, 'Rate must be positive'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        if (editingCurrency) {
          await api.put(`/currencies/${editingCurrency.id}/`, values);
          toast.success('Currency updated successfully!');
        } else {
          await api.post('/currencies/', values);
          toast.success('Currency created successfully!');
        }
        resetForm();
        setShowModal(false);
        setEditingCurrency(null);
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to save currency');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    formik.setValues({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchange_rate_to_usd: currency.exchange_rate_to_usd,
      is_base_currency: currency.is_base_currency,
      is_active: currency.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this currency?')) {
      try {
        await api.delete(`/currencies/${id}/`);
        toast.success('Currency deleted successfully!');
        fetchData();
      } catch (err) {
        toast.error('Failed to delete currency');
      }
    }
  };

  const updateExchangeRates = async () => {
    setUpdatingRates(true);
    try {
      await api.post('/currencies/update-rates/');
      toast.success('Exchange rates updated successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to update exchange rates');
    } finally {
      setUpdatingRates(false);
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

  const columns = [
    {
      header: 'Currency',
      accessor: 'code' as const,
      render: (_: any, currency: Currency) => (
        <div className="flex items-center">
          <span className="text-lg mr-2">{currency.symbol}</span>
          <div>
            <div className="font-medium">{currency.code}</div>
            <div className="text-sm text-gray-500">{currency.name}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Rate to USD',
      accessor: 'exchange_rate_to_usd' as const,
      render: (rate: number) => `$${rate.toFixed(6)}`,
    },
    {
      header: 'Base Currency',
      accessor: 'is_base_currency' as const,
      render: (isBase: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${isBase ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
          {isBase ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active' as const,
      render: (isActive: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Last Updated',
      accessor: 'last_updated' as const,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const isEmpty = !loading && currencies.length === 0;

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
            disabled={updatingRates}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${updatingRates ? 'animate-spin' : ''}`} />
            Update Rates
          </button>
          <button
            onClick={() => {
              formik.resetForm();
              setEditingCurrency(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <FiPlus className="w-4 h-4" />
            Add Currency
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiDollarSign className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Currencies</p>
              <p className="text-2xl font-bold text-gray-900">{currencies.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiRefreshCw className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Currencies</p>
              <p className="text-2xl font-bold text-gray-900">{currencies.filter(c => c.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🇿🇼</span>
            <div>
              <p className="text-sm text-gray-600">ZWL Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencies.find(c => c.code === 'ZWL')?.exchange_rate_to_usd.toFixed(2) || '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🇺🇸</span>
            <div>
              <p className="text-sm text-gray-600">USD Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencies.find(c => c.code === 'USD')?.exchange_rate_to_usd.toFixed(2) || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton lines={6} />
      ) : isEmpty ? (
        <EmptyState
          title="No currencies configured"
          description="Add your first currency to enable multi-currency support."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Add Currency
            </button>
          }
        />
      ) : (
        <DataTable<Currency>
          columns={columns}
          data={currencies}
          searchable
          enableExport
          exportFileName="currencies.csv"
        />
      )}

      {/* Currency Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
            </h3>
            <form onSubmit={formik.handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                  <input
                    type="text"
                    name="code"
                    value={formik.values.code}
                    onChange={formik.handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="USD, ZWL, EUR"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="US Dollar, Zimbabwe Dollar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                  <input
                    type="text"
                    name="symbol"
                    value={formik.values.symbol}
                    onChange={formik.handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="$"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate to USD</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="exchange_rate_to_usd"
                    value={formik.values.exchange_rate_to_usd}
                    onChange={formik.handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_base_currency"
                    checked={formik.values.is_base_currency}
                    onChange={formik.handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Set as base currency</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formik.values.is_active}
                    onChange={formik.handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {formik.isSubmitting ? 'Saving...' : 'Save'}
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
