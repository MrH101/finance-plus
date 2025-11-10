import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiSmartphone, FiDollarSign, FiCheckCircle,
  FiXCircle, FiClock, FiRefreshCw, FiAlertCircle, FiTrendingUp
} from 'react-icons/fi';
import { mobileMoneyPaymentService } from '../services/extendedApi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface MobileMoneyPayment {
  id: number;
  transaction_ref: string;
  payment_method: string;
  phone_number: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
  completed_at?: string;
  customer_name?: string;
  invoice_number?: string;
}

const MobileMoneyPayments: React.FC = () => {
  const { user } = useAuth();
  const rawRole = (user as any)?.role ?? (user as any)?.user_role ?? (user as any)?.user?.role;
  const roleStr = rawRole ? String(rawRole).trim().toLowerCase() : '';
  const canManage = roleStr === 'employer' || roleStr === 'manager' || roleStr === 'admin' || roleStr === 'superadmin';
  const [payments, setPayments] = useState<MobileMoneyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [paymentEndpoint, setPaymentEndpoint] = useState<'/mobile-money-payments/' | '/mobile-money-transactions/'>('/mobile-money-payments/');

  const [formData, setFormData] = useState({
    payment_method: 'ECOCASH',
    phone_number: '',
    amount: '',
    currency: 'USD',
    customer_name: '',
    invoice_number: '',
    description: '',
  });

  const paymentMethods = [
    { value: 'ECOCASH', label: 'EcoCash', color: 'from-red-500 to-red-600', icon: '💰' },
    { value: 'ONEMONEY', label: 'OneMoney', color: 'from-blue-500 to-blue-600', icon: '💵' },
    { value: 'INNBUCKS', label: 'Innbucks', color: 'from-green-500 to-green-600', icon: '💳' },
  ];

  useEffect(() => {
    fetchPayments();
    fetchAccounts();
    // Poll for payment updates every 30 seconds
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPayments = async () => {
    try {
      // Try primary endpoint
      const response = await mobileMoneyPaymentService.getAll();
      setPaymentEndpoint('/mobile-money-payments/');
      setPayments(response.data?.results || response.data || []);
    } catch (err: any) {
      // Fallback to legacy endpoint
      if (err?.response?.status === 404) {
        try {
          const res = await api.get('/mobile-money-transactions/');
          setPaymentEndpoint('/mobile-money-transactions/');
          const raw = res.data?.results || res.data || [];
          const normalized: MobileMoneyPayment[] = Array.isArray(raw)
            ? raw.map((r: any) => ({
                id: r.id,
                transaction_ref: r.transaction_ref || r.reference || `TX-${r.id}`,
                payment_method: r.payment_method || r.provider || 'MOBILE_MONEY',
                phone_number: r.phone_number || r.msisdn || '',
                amount: String(r.amount),
                currency: r.currency || r.currency_code || 'USD',
                status: r.status || 'PENDING',
                created_at: r.created_at || r.timestamp,
                completed_at: r.completed_at,
                customer_name: r.customer_name,
                invoice_number: r.invoice_number,
              }))
            : [];
          setPayments(normalized);
        } catch (e) {
          toast.error('Failed to load payments');
        }
      } else {
        toast.error('Failed to load payments');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load MM accounts for manual transactions
  const [accounts, setAccounts] = useState<{ id: number; label: string }[]>([]);
  const fetchAccounts = async () => {
    try {
      const res = await api.get('/mobile-money-accounts/');
      const raw = res.data?.results || res.data || [];
      const opts = Array.isArray(raw)
        ? raw.map((r: any) => ({ id: r.id, label: r.account_name || `${r.provider} - ${r.phone_number}` }))
        : [];
      setAccounts(opts);
    } catch {
      setAccounts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (paymentEndpoint === '/mobile-money-payments/') {
        await mobileMoneyPaymentService.create(formData);
      } else {
        // Legacy
        await api.post('/mobile-money-transactions/', {
          amount: formData.amount,
          currency: formData.currency,
          phone_number: formData.phone_number,
          description: formData.description,
          customer_name: formData.customer_name,
          invoice_number: formData.invoice_number,
          payment_method: formData.payment_method,
        });
      }
      toast.success('Payment initiated! Please complete the payment on your phone.');
      setShowModal(false);
      resetForm();
      fetchPayments();
      
      // Show payment instructions
      toast.success(
        `Please dial *151# for ${formData.payment_method} and complete the transaction`,
        { duration: 10000 }
      );
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
    }
  };

  // Manual Transaction (Create Transaction)
  const [txnForm, setTxnForm] = useState<{ account?: number; type?: string; amount?: string; reference?: string; description?: string; date?: string }>({ type: 'DEPOSIT' });
  const createTransaction = async () => {
    if (!txnForm.account || !txnForm.amount) {
      toast.error('Account and amount are required');
      return;
    }
    try {
      const basePayload = {
        transaction_type: (txnForm.type || 'DEPOSIT').toString().toUpperCase(),
        amount: Number(txnForm.amount),
        reference: txnForm.reference || '',
        description: (txnForm.description && txnForm.description.trim()) || txnForm.reference || 'Manual transaction',
        transaction_date: txnForm.date || new Date().toISOString().slice(0, 10),
        value_date: txnForm.date || new Date().toISOString().slice(0, 10),
        status: 'COMPLETED',
      } as any;

      // Primary shape expected by backend
      try {
        await api.post('/mobile-money-transactions/', {
          mobile_account: txnForm.account,
          ...basePayload,
        });
      } catch (inner: any) {
        // Retry with alternate payload key names if field error
        if (inner?.response?.status === 400) {
          const data = inner.response.data || {};
          // Try legacy key `account`
          try {
            await api.post('/mobile-money-transactions/', {
              account: txnForm.account,
              ...basePayload,
            });
          } catch (legacy: any) {
            // Try legacy key `mobile_money_account`
            if (legacy?.response?.status === 400) {
              await api.post('/mobile-money-transactions/', {
                mobile_money_account: txnForm.account,
                ...basePayload,
              });
            } else {
              throw legacy;
            }
          }
        } else {
          throw inner;
        }
      }
      toast.success('Transaction created');
      setTxnForm({ type: 'DEPOSIT' });
      fetchPayments();
    } catch (e: any) {
      const data = e?.response?.data;
      let msg = data?.detail || data?.error || 'Failed to create transaction';
      if (typeof data === 'object' && data) {
        const firstKey = Object.keys(data)[0];
        const val = (data as any)[firstKey];
        if (Array.isArray(val) && val.length) msg = val[0];
      }
      toast.error(msg);
      // Surface details for debugging
      // eslint-disable-next-line no-console
      console.error('Create MM Transaction error:', e?.response?.data || e);
    }
  };

  const handleCheckStatus = async (id: number, transactionRef: string) => {
    try {
      toast.loading('Checking payment status...', { id: 'check-status' });
      let response;
      if (paymentEndpoint === '/mobile-money-payments/') {
        response = await mobileMoneyPaymentService.checkStatus(id);
      } else {
        // Legacy may not support status check; refetch list as a best-effort
        await fetchPayments();
        toast.dismiss('check-status');
        toast.info('Status refreshed');
        return;
      }
      toast.dismiss('check-status');
      
      if (response.data.status === 'COMPLETED') {
        toast.success('Payment completed successfully!');
      } else if (response.data.status === 'FAILED') {
        toast.error('Payment failed');
      } else {
        toast.info(`Payment status: ${response.data.status}`);
      }
      
      fetchPayments();
    } catch (error) {
      toast.dismiss('check-status');
      toast.error('Failed to check payment status');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this payment?')) return;
    
    try {
      if (paymentEndpoint === '/mobile-money-payments/') {
        await mobileMoneyPaymentService.cancel(id);
      } else {
        // Legacy may not support cancel; do nothing but refresh
      }
      toast.success('Payment cancelled');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to cancel payment');
    }
  };

  const resetForm = () => {
    setFormData({
      payment_method: 'ECOCASH',
      phone_number: '',
      amount: '',
      currency: 'USD',
      customer_name: '',
      invoice_number: '',
      description: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <FiCheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAILED':
        return <FiXCircle className="h-5 w-5 text-red-600" />;
      case 'PROCESSING':
        return <FiRefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'PENDING':
        return <FiClock className="h-5 w-5 text-yellow-600" />;
      default:
        return <FiAlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getMethodColor = (method: string) => {
    const methodObj = paymentMethods.find(m => m.value === method);
    return methodObj ? methodObj.color : 'from-gray-500 to-gray-600';
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'ALL' || payment.status === filterStatus;
    const matchesMethod = filterMethod === 'ALL' || payment.payment_method === filterMethod;
    return matchesStatus && matchesMethod;
  });

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'COMPLETED').length,
    pending: payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').length,
    failed: payments.filter(p => p.status === 'FAILED').length,
    totalAmount: payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
    successRate: payments.length > 0 
      ? (payments.filter(p => p.status === 'COMPLETED').length / payments.length) * 100 
      : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mobile Money Payments</h1>
        <p className="text-gray-600">Accept payments via EcoCash, OneMoney, and Innbucks</p>
      </div>

      {/* Payment Methods Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {paymentMethods.map((method) => (
          <div key={method.value} className={`bg-gradient-to-br ${method.color} rounded-xl shadow-lg p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">{method.icon}</div>
              <FiSmartphone className="h-8 w-8 text-white opacity-80" />
            </div>
            <h3 className="text-xl font-bold mb-2">{method.label}</h3>
            <p className="text-sm opacity-90 mb-3">Zimbabwe Mobile Money</p>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <p className="text-xs opacity-80 mb-1">Transactions</p>
              <p className="text-2xl font-bold">
                {payments.filter(p => p.payment_method === method.value).length}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Payments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiSmartphone className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">${stats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiDollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.successRate.toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
              {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Method:</span>
              <button
                onClick={() => setFilterMethod('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
                  filterMethod === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ALL
              </button>
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setFilterMethod(method.value)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${
                    filterMethod === method.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <FiPlus className="h-5 w-5" />
              New Payment
            </button>
          )}
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{payment.transaction_ref}</p>
                      {payment.customer_name && (
                        <p className="text-sm text-gray-500">{payment.customer_name}</p>
                      )}
                      {payment.invoice_number && (
                        <p className="text-xs text-gray-400">Invoice: {payment.invoice_number}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${getMethodColor(payment.payment_method)} rounded-lg text-white text-sm font-medium`}>
                      <FiSmartphone className="h-4 w-4" />
                      {payment.payment_method}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {payment.phone_number}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-green-600">
                      ${parseFloat(payment.amount).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{payment.currency}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 w-fit ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      <p>{new Date(payment.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {canManage && (payment.status === 'PENDING' || payment.status === 'PROCESSING') && (
                        <>
                          <button
                            onClick={() => handleCheckStatus(payment.id, payment.transaction_ref)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Check Status"
                          >
                            <FiRefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(payment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <FiXCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <FiSmartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No payments found</p>
            <p className="text-gray-400">Initiate your first mobile money payment</p>
          </div>
        )}
      </div>

      {/* Manual Transaction (Create Transaction) */}
      {canManage && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Create Transaction</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select className="border rounded px-3 py-2" value={txnForm.account || ''} onChange={(e) => setTxnForm({ ...txnForm, account: Number(e.target.value) })}>
              <option value="">Select Account</option>
              {accounts.map(a => (<option key={a.id} value={a.id}>{a.label}</option>))}
            </select>
            <select className="border rounded px-3 py-2" value={txnForm.type || 'DEPOSIT'} onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="PAYMENT">Payment</option>
              <option value="RECEIPT">Receipt</option>
              <option value="TRANSFER">Transfer</option>
            </select>
            <input className="border rounded px-3 py-2" type="number" placeholder="Amount" value={txnForm.amount || ''} onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Reference (optional)" value={txnForm.reference || ''} onChange={(e) => setTxnForm({ ...txnForm, reference: e.target.value })} />
            <input className="border rounded px-3 py-2" type="date" value={txnForm.date || ''} onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })} />
          </div>
          <div className="mt-3">
            <input className="border rounded px-3 py-2 w-full" placeholder="Description (optional)" value={txnForm.description || ''} onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })} />
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={createTransaction} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create Transaction</button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Initiate Mobile Money Payment</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  required
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.icon} {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+263771234567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD</option>
                  <option value="ZWL">ZWL</option>
                  <option value="ZAR">ZAR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Payment Instructions:</p>
                    <p>After clicking "Initiate Payment", you will receive a prompt on your phone to complete the transaction.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Initiate Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMoneyPayments;

