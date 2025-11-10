import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { DataTable } from '../components/DataTable';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { FiSmartphone, FiSend, FiDollarSign, FiShield, FiCheckCircle } from 'react-icons/fi';

interface MobileMoneyAccount {
  id: number;
  provider: 'ECOCASH' | 'TELECASH' | 'ONEMONEY';
  account_name: string;
  phone_number: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

interface MobileMoneyTransaction {
  id: number;
  account: number;
  transaction_type: 'SEND' | 'RECEIVE' | 'BUY_AIRTIME' | 'PAY_BILL';
  amount: number;
  phone_number: string;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  created_at: string;
}

const MobileMoneyIntegration: React.FC = () => {
  const [accounts, setAccounts] = useState<MobileMoneyAccount[]>([]);
  const [transactions, setTransactions] = useState<MobileMoneyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<MobileMoneyAccount | null>(null);
  const [activeTab, setActiveTab] = useState('accounts');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        api.get('/mobile-money-accounts/'),
        api.get('/mobile-money-transactions/')
      ]);
      setAccounts(accountsRes.data?.results || accountsRes.data || []);
      setTransactions(transactionsRes.data?.results || transactionsRes.data || []);
    } catch (err) {
      toast.error('Failed to load mobile money data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const accountFormik = useFormik({
    initialValues: {
      provider: 'ECOCASH' as 'ECOCASH' | 'TELECASH' | 'ONEMONEY',
      account_name: '',
      phone_number: '',
      currency: 'USD',
      is_active: true,
    },
    validationSchema: Yup.object({
      provider: Yup.string().required('Provider is required'),
      account_name: Yup.string().required('Account name is required'),
      phone_number: Yup.string().required('Phone number is required').matches(/^\+263[0-9]{9}$/, 'Invalid Zimbabwe phone number'),
      currency: Yup.string().required('Currency is required'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        if (editingAccount) {
          await api.put(`/mobile-money-accounts/${editingAccount.id}/`, values);
          toast.success('Mobile money account updated successfully!');
        } else {
          await api.post('/mobile-money-accounts/', values);
          toast.success('Mobile money account created successfully!');
        }
        resetForm();
        setShowModal(false);
        setEditingAccount(null);
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to save account');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const sendMoneyFormik = useFormik({
    initialValues: {
      account_id: '',
      amount: '',
      phone_number: '',
      reference: '',
    },
    validationSchema: Yup.object({
      account_id: Yup.string().required('Account is required'),
      amount: Yup.number().required('Amount is required').min(0.01, 'Amount must be positive'),
      phone_number: Yup.string().required('Phone number is required').matches(/^\+263[0-9]{9}$/, 'Invalid Zimbabwe phone number'),
      reference: Yup.string().required('Reference is required'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        await api.post('/mobile-money-transactions/', {
          ...values,
          account: parseInt(values.account_id),
          transaction_type: 'SEND',
          amount: parseFloat(values.amount),
        });
        toast.success('Money sent successfully!');
        resetForm();
        setShowSendModal(false);
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to send money');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (account: MobileMoneyAccount) => {
    setEditingAccount(account);
    accountFormik.setValues({
      provider: account.provider,
      account_name: account.account_name,
      phone_number: account.phone_number,
      currency: account.currency,
      is_active: account.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this mobile money account?')) {
      try {
        await api.delete(`/mobile-money-accounts/${id}/`);
        toast.success('Account deleted successfully!');
        fetchData();
      } catch (err) {
        toast.error('Failed to delete account');
      }
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'ECOCASH': return '🟢';
      case 'TELECASH': return '🔵';
      case 'ONEMONEY': return '🟡';
      default: return '📱';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'ECOCASH': return 'EcoCash';
      case 'TELECASH': return 'TeleCash';
      case 'ONEMONEY': return 'OneMoney';
      default: return provider;
    }
  };

  const accountColumns = [
    {
      header: 'Provider',
      accessor: 'provider' as const,
      render: (provider: string) => (
        <div className="flex items-center">
          <span className="text-2xl mr-2">{getProviderIcon(provider)}</span>
          <span className="font-medium">{getProviderName(provider)}</span>
        </div>
      ),
    },
    {
      header: 'Account',
      accessor: 'account_name' as const,
      render: (_: any, account: MobileMoneyAccount) => (
        <div>
          <div className="font-medium">{account.account_name}</div>
          <div className="text-sm text-gray-500">{account.phone_number}</div>
        </div>
      ),
    },
    {
      header: 'Balance',
      accessor: 'balance' as const,
      render: (balance: number, account: MobileMoneyAccount) => (
        <div className="text-right">
          <div className="font-semibold">{account.currency} {balance.toFixed(2)}</div>
        </div>
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
  ];

  const transactionColumns = [
    {
      header: 'Type',
      accessor: 'transaction_type' as const,
      render: (type: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          type === 'SEND' ? 'bg-red-100 text-red-800' :
          type === 'RECEIVE' ? 'bg-green-100 text-green-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {type.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount' as const,
      render: (amount: number) => (
        <div className="font-semibold">${amount.toFixed(2)}</div>
      ),
    },
    {
      header: 'Phone Number',
      accessor: 'phone_number' as const,
    },
    {
      header: 'Reference',
      accessor: 'reference' as const,
    },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (status: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
          status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'created_at' as const,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const isEmpty = !loading && (activeTab === 'accounts' ? accounts.length === 0 : transactions.length === 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile Money Integration</h1>
          <p className="text-gray-600">Manage EcoCash, TeleCash, and OneMoney accounts for Zimbabwe</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            <FiSend className="w-4 h-4" />
            Send Money
          </button>
          <button
            onClick={() => {
              accountFormik.resetForm();
              setEditingAccount(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <FiSmartphone className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiSmartphone className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiDollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ${accounts.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🟢</span>
            <div>
              <p className="text-sm text-gray-600">EcoCash</p>
              <p className="text-2xl font-bold text-gray-900">
                {accounts.filter(a => a.provider === 'ECOCASH').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <FiCheckCircle className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Accounts</p>
              <p className="text-2xl font-bold text-gray-900">
                {accounts.filter(a => a.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded ${activeTab === 'accounts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Transactions
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton lines={6} />
      ) : isEmpty ? (
        <EmptyState
          title={`No ${activeTab} found`}
          description={`Add your first mobile money ${activeTab.slice(0, -1)} to get started.`}
          action={
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Add Account
            </button>
          }
        />
      ) : (
        <DataTable
          columns={activeTab === 'accounts' ? accountColumns : transactionColumns}
          data={activeTab === 'accounts' ? accounts : transactions}
          searchable
          enableExport
          exportFileName={`mobile-money-${activeTab}.csv`}
        />
      )}

      {/* Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingAccount ? 'Edit Account' : 'Add Mobile Money Account'}
            </h3>
            <form onSubmit={accountFormik.handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    name="provider"
                    value={accountFormik.values.provider}
                    onChange={accountFormik.handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="ECOCASH">EcoCash</option>
                    <option value="TELECASH">TeleCash</option>
                    <option value="ONEMONEY">OneMoney</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    name="account_name"
                    value={accountFormik.values.account_name}
                    onChange={accountFormik.handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Business Account"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={accountFormik.values.phone_number}
                    onChange={accountFormik.handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+263771234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    name="currency"
                    value={accountFormik.values.currency}
                    onChange={accountFormik.handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={accountFormik.values.is_active}
                    onChange={accountFormik.handleChange}
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
                  disabled={accountFormik.isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {accountFormik.isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Money Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Send Money</h3>
            <form onSubmit={sendMoneyFormik.handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                  <select
                    name="account_id"
                    value={sendMoneyFormik.values.account_id}
                    onChange={sendMoneyFormik.handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Account</option>
                    {accounts.filter(a => a.is_active).map(account => (
                      <option key={account.id} value={account.id}>
                        {getProviderName(account.provider)} - {account.account_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={sendMoneyFormik.values.amount}
                    onChange={sendMoneyFormik.handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={sendMoneyFormik.values.phone_number}
                    onChange={sendMoneyFormik.handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="+263771234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input
                    type="text"
                    name="reference"
                    value={sendMoneyFormik.values.reference}
                    onChange={sendMoneyFormik.handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Payment reference"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendMoneyFormik.isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  {sendMoneyFormik.isSubmitting ? 'Sending...' : 'Send Money'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMoneyIntegration;
