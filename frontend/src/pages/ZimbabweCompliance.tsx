import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiFileText, FiCalendar, FiTrendingUp, FiAlertTriangle,
  FiCheckCircle, FiClock, FiSettings, FiDownload, FiPlus, FiEdit,
  FiRefreshCw, FiEye, FiSend, FiCreditCard
} from 'react-icons/fi';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import zimbabweService, { 
  ZIMRAConfiguration, VATReturn, Currency, ZimbabweAnalytics,
  MobileMoneyIntegration, MobileMoneyPayment
} from '../services/zimbabweService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/Modal';

const ZimbabweCompliance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ZimbabweAnalytics | null>(null);
  const [zimraConfig, setZimraConfig] = useState<ZIMRAConfiguration | null>(null);
  const [vatReturns, setVatReturns] = useState<VATReturn[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [mobileIntegrations, setMobileIntegrations] = useState<MobileMoneyIntegration[]>([]);
  const [mobilePayments, setMobilePayments] = useState<MobileMoneyPayment[]>([]);
  
  const [showZimraModal, setShowZimraModal] = useState(false);
  const [showVatModal, setShowVatModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsData, zimraConfigs, vatData, currencyData, mobileData, paymentData] = await Promise.all([
        zimbabweService.getZimbabweAnalytics(),
        zimbabweService.getZIMRAConfig(),
        zimbabweService.getVATReturns(),
        zimbabweService.getCurrencies(),
        zimbabweService.getMobileMoneyIntegrations(),
        zimbabweService.getMobileMoneyPayments()
      ]);

      setAnalytics(analyticsData);
      setZimraConfig(zimraConfigs[0] || null);
      setVatReturns(vatData);
      setCurrencies(currencyData);
      setMobileIntegrations(mobileData);
      setMobilePayments(paymentData);
    } catch (error) {
      console.error('Error fetching Zimbabwe compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const zimraFormik = useFormik({
    initialValues: {
      vat_registration_number: zimraConfig?.vat_registration_number || '',
      paye_number: zimraConfig?.paye_number || '',
      corporate_tax_number: zimraConfig?.corporate_tax_number || '',
      vat_rate: zimraConfig?.vat_rate || 15,
      vat_threshold: zimraConfig?.vat_threshold || 60000,
      is_vat_registered: zimraConfig?.is_vat_registered || false,
      vat_period: zimraConfig?.vat_period || 'MONTHLY',
      fiscal_year_start: zimraConfig?.fiscal_year_start || '2024-01-01'
    },
    validationSchema: Yup.object({
      vat_registration_number: Yup.string().required('VAT registration number is required'),
      vat_rate: Yup.number().min(0).max(100).required('VAT rate is required'),
      vat_threshold: Yup.number().min(0).required('VAT threshold is required')
    }),
    onSubmit: async (values) => {
      try {
        if (zimraConfig) {
          await zimbabweService.updateZIMRAConfig(zimraConfig.id, values);
          toast.success('ZIMRA configuration updated successfully');
        } else {
          await zimbabweService.createZIMRAConfig(values);
          toast.success('ZIMRA configuration created successfully');
        }
        setShowZimraModal(false);
        fetchData();
      } catch (error) {
        toast.error('Failed to save ZIMRA configuration');
      }
    }
  });

  const vatFormik = useFormik({
    initialValues: {
      period_start: '',
      period_end: '',
      total_sales: 0,
      vat_on_sales: 0,
      total_purchases: 0,
      vat_on_purchases: 0,
      due_date: ''
    },
    validationSchema: Yup.object({
      period_start: Yup.date().required('Period start is required'),
      period_end: Yup.date().required('Period end is required'),
      total_sales: Yup.number().min(0).required('Total sales is required'),
      total_purchases: Yup.number().min(0).required('Total purchases is required'),
      due_date: Yup.date().required('Due date is required')
    }),
    onSubmit: async (values) => {
      try {
        await zimbabweService.createVATReturn({
          ...values,
          vat_on_sales: values.total_sales * (zimraConfig?.vat_rate || 15) / 100,
          vat_on_purchases: values.total_purchases * (zimraConfig?.vat_rate || 15) / 100
        });
        toast.success('VAT return created successfully');
        setShowVatModal(false);
        fetchData();
      } catch (error) {
        toast.error('Failed to create VAT return');
      }
    }
  });

  const currencyFormik = useFormik({
    initialValues: {
      code: '',
      name: '',
      symbol: '',
      exchange_rate_to_usd: 1,
      is_base_currency: false,
      is_active: true
    },
    validationSchema: Yup.object({
      code: Yup.string().length(3).required('Currency code is required'),
      name: Yup.string().required('Currency name is required'),
      symbol: Yup.string().required('Currency symbol is required'),
      exchange_rate_to_usd: Yup.number().min(0).required('Exchange rate is required')
    }),
    onSubmit: async (values) => {
      try {
        await zimbabweService.createCurrency(values);
        toast.success('Currency created successfully');
        setShowCurrencyModal(false);
        fetchData();
      } catch (error) {
        toast.error('Failed to create currency');
      }
    }
  });

  const handleSubmitVATReturn = async (vatReturn: VATReturn) => {
    try {
      await zimbabweService.submitVATReturn(vatReturn.id);
      toast.success('VAT return submitted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to submit VAT return');
    }
  };

  const handleUpdateExchangeRates = async () => {
    try {
      await zimbabweService.updateExchangeRates();
      toast.success('Exchange rates updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update exchange rates');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Zimbabwe compliance data..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zimbabwe Compliance Dashboard</h1>
        <p className="text-gray-600">Manage ZIMRA compliance, multi-currency, and mobile money integrations</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ZIMRA Status</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.zimra_compliance.configured ? 'Configured' : 'Not Setup'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${analytics?.zimra_compliance.configured ? 'bg-green-100' : 'bg-red-100'}`}>
              {analytics?.zimra_compliance.configured ? (
                <FiCheckCircle className={`h-6 w-6 ${analytics?.zimra_compliance.vat_registered ? 'text-green-600' : 'text-yellow-600'}`} />
              ) : (
                <FiAlertTriangle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Currencies</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.currencies.length || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiDollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mobile Money</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.mobile_money.integrations_count || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiCreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.inventory.low_stock_alerts || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiAlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FiTrendingUp },
              { id: 'zimra', name: 'ZIMRA Compliance', icon: FiFileText },
              { id: 'currencies', name: 'Multi-Currency', icon: FiDollarSign },
              { id: 'mobile-money', name: 'Mobile Money', icon: FiCreditCard }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent VAT Returns */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent VAT Returns</h3>
              <button
                onClick={() => setShowVatModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="h-4 w-4 mr-2" />
                New VAT Return
              </button>
            </div>
            <div className="p-6">
              {vatReturns.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No VAT returns found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Sales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VAT Payable
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vatReturns.slice(0, 5).map((vatReturn) => (
                        <tr key={vatReturn.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(vatReturn.period_start), 'MMM dd')} - {format(new Date(vatReturn.period_end), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${vatReturn.total_sales.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${vatReturn.net_vat_payable.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              vatReturn.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              vatReturn.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                              vatReturn.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {vatReturn.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {vatReturn.status === 'DRAFT' && (
                              <button
                                onClick={() => handleSubmitVATReturn(vatReturn)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                <FiSend className="h-4 w-4" />
                              </button>
                            )}
                            <button className="text-gray-600 hover:text-gray-900">
                              <FiEye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setShowZimraModal(true)}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <FiSettings className="h-6 w-6 text-blue-600 mr-3" />
                <span className="text-sm font-medium">Setup ZIMRA</span>
              </button>
              <button
                onClick={() => setShowCurrencyModal(true)}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <FiDollarSign className="h-6 w-6 text-green-600 mr-3" />
                <span className="text-sm font-medium">Add Currency</span>
              </button>
              <button
                onClick={handleUpdateExchangeRates}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <FiRefreshCw className="h-6 w-6 text-purple-600 mr-3" />
                <span className="text-sm font-medium">Update Rates</span>
              </button>
              <button
                onClick={() => setShowMobileMoneyModal(true)}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <FiCreditCard className="h-6 w-6 text-orange-600 mr-3" />
                <span className="text-sm font-medium">Mobile Money</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'currencies' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Currency Management</h3>
            <div className="flex space-x-3">
              <button
                onClick={handleUpdateExchangeRates}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Update Rates
              </button>
              <button
                onClick={() => setShowCurrencyModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Add Currency
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exchange Rate (USD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Currency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currencies.map((currency) => (
                    <tr key={currency.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{currency.code}</div>
                          <div className="text-sm text-gray-500">{currency.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currency.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currency.exchange_rate_to_usd.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {currency.is_base_currency && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Base
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          currency.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {currency.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(currency.last_updated), 'MMM dd, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showZimraModal}
        onClose={() => setShowZimraModal(false)}
        title="ZIMRA Configuration"
      >
        <form onSubmit={zimraFormik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">VAT Registration Number</label>
            <input
              type="text"
              {...zimraFormik.getFieldProps('vat_registration_number')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            {zimraFormik.touched.vat_registration_number && zimraFormik.errors.vat_registration_number && (
              <p className="mt-1 text-sm text-red-600">{zimraFormik.errors.vat_registration_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">PAYE Number</label>
            <input
              type="text"
              {...zimraFormik.getFieldProps('paye_number')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">VAT Rate (%)</label>
            <input
              type="number"
              step="0.01"
              {...zimraFormik.getFieldProps('vat_rate')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...zimraFormik.getFieldProps('is_vat_registered')}
                checked={zimraFormik.values.is_vat_registered}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">VAT Registered</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowZimraModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={zimraFormik.isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {zimraFormik.isSubmitting ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showVatModal}
        onClose={() => setShowVatModal(false)}
        title="New VAT Return"
      >
        <form onSubmit={vatFormik.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Period Start</label>
              <input
                type="date"
                {...vatFormik.getFieldProps('period_start')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Period End</label>
              <input
                type="date"
                {...vatFormik.getFieldProps('period_end')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Sales</label>
            <input
              type="number"
              step="0.01"
              {...vatFormik.getFieldProps('total_sales')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Purchases</label>
            <input
              type="number"
              step="0.01"
              {...vatFormik.getFieldProps('total_purchases')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              {...vatFormik.getFieldProps('due_date')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowVatModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={vatFormik.isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {vatFormik.isSubmitting ? 'Creating...' : 'Create VAT Return'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        title="Add Currency"
      >
        <form onSubmit={currencyFormik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency Code</label>
            <input
              type="text"
              maxLength={3}
              placeholder="USD"
              {...currencyFormik.getFieldProps('code')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Currency Name</label>
            <input
              type="text"
              placeholder="US Dollar"
              {...currencyFormik.getFieldProps('name')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Symbol</label>
            <input
              type="text"
              placeholder="$"
              {...currencyFormik.getFieldProps('symbol')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Exchange Rate to USD</label>
            <input
              type="number"
              step="0.000001"
              {...currencyFormik.getFieldProps('exchange_rate_to_usd')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...currencyFormik.getFieldProps('is_base_currency')}
                checked={currencyFormik.values.is_base_currency}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Set as base currency</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCurrencyModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={currencyFormik.isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {currencyFormik.isSubmitting ? 'Adding...' : 'Add Currency'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ZimbabweCompliance;
