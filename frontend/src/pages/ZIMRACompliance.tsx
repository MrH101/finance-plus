import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { FiFileText, FiCheckCircle, FiAlertCircle, FiCalendar, FiDollarSign, FiDownload, FiUpload } from 'react-icons/fi';

interface ZIMRAConfig {
  id: number;
  business_name: string;
  vat_registration_number: string;
  paye_number: string;
  corporate_tax_number: string;
  vat_rate: number;
  vat_threshold: number;
  is_vat_registered: boolean;
  vat_period: string;
  fiscal_year_start: string;
  created_at: string;
}

interface VATReturn {
  id: number;
  period_start: string;
  period_end: string;
  total_sales: number;
  vat_on_sales: number;
  total_purchases: number;
  vat_on_purchases: number;
  net_vat_payable: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PAID' | 'OVERDUE';
  submission_date?: string;
  payment_date?: string;
}

interface PAYECalculation {
  id: number;
  employee_name: string;
  taxable_income: number;
  tax_free_threshold: number;
  paye_amount: number;
  created_at: string;
}

const ZIMRACompliance: React.FC = () => {
  const [config, setConfig] = useState<ZIMRAConfig | null>(null);
  const [vatReturns, setVatReturns] = useState<VATReturn[]>([]);
  const [payeCalculations, setPayeCalculations] = useState<PAYECalculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showVATModal, setShowVATModal] = useState(false);
  const [configData, setConfigData] = useState({
    business_name: '',
    vat_registration_number: '',
    paye_number: '',
    corporate_tax_number: '',
    vat_rate: 15,
    vat_threshold: 60000,
    is_vat_registered: false,
    vat_period: 'MONTHLY',
    fiscal_year_start: '2024-01-01',
  });
  const [vatData, setVatData] = useState({
    period_start: '',
    period_end: '',
    total_sales: '',
    total_purchases: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, vatRes, payeRes] = await Promise.all([
        api.get('/zimra-config/'),
        api.get('/vat-returns/'),
        api.get('/paye-calculations/')
      ]);
      setConfig(configRes.data?.results?.[0] || configRes.data?.[0] || null);
      setVatReturns(vatRes.data?.results || vatRes.data || []);
      setPayeCalculations(payeRes.data?.results || payeRes.data || []);
    } catch (err) {
      toast.error('Failed to load ZIMRA compliance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (config) {
        await api.put(`/zimra-config/${config.id}/`, configData);
        toast.success('ZIMRA configuration updated successfully!');
      } else {
        await api.post('/zimra-config/', configData);
        toast.success('ZIMRA configuration created successfully!');
      }
      setShowConfigModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    }
  };

  const calculateVAT = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vat-returns/', {
        ...vatData,
        total_sales: parseFloat(vatData.total_sales),
        total_purchases: parseFloat(vatData.total_purchases),
      });
      toast.success('VAT return calculated successfully!');
      setShowVATModal(false);
      setVatData({ period_start: '', period_end: '', total_sales: '', total_purchases: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to calculate VAT');
    }
  };

  const submitVATReturn = async (returnId: number) => {
    try {
      await api.post(`/vat-returns/${returnId}/submit/`);
      toast.success('VAT return submitted to ZIMRA successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to submit VAT return');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-ZW', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZW');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ZIMRA Compliance</h1>
          <p className="text-gray-600">Manage tax compliance with Zimbabwe Revenue Authority</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVATModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            <FiFileText className="w-4 h-4" />
            Calculate VAT
          </button>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {config ? 'Update Config' : 'Setup ZIMRA'}
          </button>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          ZIMRA Configuration
        </h2>
        {loading ? (
          <Skeleton lines={4} />
        ) : !config ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <FiAlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">ZIMRA Configuration Required</h3>
            </div>
            <p className="text-yellow-700 mb-4">You need to configure your ZIMRA details to manage tax compliance.</p>
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
            >
              Setup ZIMRA Configuration
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2 mb-2">
                <FiFileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Business</span>
              </div>
              <p className="text-sm text-gray-600">{config.business_name}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2 mb-2">
                <FiDollarSign className="w-5 h-5 text-green-600" />
                <span className="font-semibold">VAT Rate</span>
              </div>
              <p className="text-sm text-gray-600">{config.vat_rate}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2 mb-2">
                <FiCheckCircle className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">VAT Registered</span>
              </div>
              <p className="text-sm text-gray-600">{config.is_vat_registered ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2 mb-2">
                <FiCalendar className="w-5 h-5 text-orange-600" />
                <span className="font-semibold">VAT Period</span>
              </div>
              <p className="text-sm text-gray-600">{config.vat_period}</p>
            </div>
          </div>
        )}
      </div>

      {/* VAT Returns */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiFileText className="w-5 h-5" />
          VAT Returns
        </h2>
        {loading ? (
          <Skeleton lines={6} />
        ) : vatReturns.length === 0 ? (
          <EmptyState title="No VAT returns" description="Calculate your first VAT return to get started." />
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAT Payable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vatReturns.map((return_) => (
                  <tr key={return_.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(return_.period_start)}</div>
                        <div className="text-sm text-gray-500">to {formatDate(return_.period_end)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(return_.total_sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(return_.total_purchases)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatAmount(return_.net_vat_payable)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(return_.status)}`}>
                        {return_.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {return_.status === 'DRAFT' && (
                        <button
                          onClick={() => submitVATReturn(return_.id)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          Submit
                        </button>
                      )}
                      <button className="text-green-600 hover:text-green-900">
                        <FiDownload className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAYE Calculations */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiDollarSign className="w-5 h-5" />
          PAYE Calculations
        </h2>
        {loading ? (
          <Skeleton lines={6} />
        ) : payeCalculations.length === 0 ? (
          <EmptyState title="No PAYE calculations" description="PAYE calculations will appear here when payroll is processed." />
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Income</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax-Free Threshold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAYE Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payeCalculations.slice(0, 10).map((calculation) => (
                  <tr key={calculation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {calculation.employee_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(calculation.taxable_income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(calculation.tax_free_threshold)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatAmount(calculation.paye_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(calculation.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">ZIMRA Configuration</h3>
            <form onSubmit={saveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={configData.business_name}
                    onChange={(e) => setConfigData({ ...configData, business_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Registration Number</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={configData.vat_registration_number}
                    onChange={(e) => setConfigData({ ...configData, vat_registration_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAYE Number</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={configData.paye_number}
                    onChange={(e) => setConfigData({ ...configData, paye_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corporate Tax Number</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={configData.corporate_tax_number}
                    onChange={(e) => setConfigData({ ...configData, corporate_tax_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2"
                    value={configData.vat_rate}
                    onChange={(e) => setConfigData({ ...configData, vat_rate: parseFloat(e.target.value) || 15 })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2"
                    value={configData.vat_threshold}
                    onChange={(e) => setConfigData({ ...configData, vat_threshold: parseFloat(e.target.value) || 60000 })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Period</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={configData.vat_period}
                    onChange={(e) => setConfigData({ ...configData, vat_period: e.target.value })}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUALLY">Annually</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={configData.fiscal_year_start}
                    onChange={(e) => setConfigData({ ...configData, fiscal_year_start: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vat_registered"
                  className="mr-2"
                  checked={configData.is_vat_registered}
                  onChange={(e) => setConfigData({ ...configData, is_vat_registered: e.target.checked })}
                />
                <label htmlFor="vat_registered" className="text-sm text-gray-700">VAT Registered</label>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-100 rounded" onClick={() => setShowConfigModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VAT Calculation Modal */}
      {showVATModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Calculate VAT Return</h3>
            <form onSubmit={calculateVAT} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={vatData.period_start}
                    onChange={(e) => setVatData({ ...vatData, period_start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={vatData.period_end}
                    onChange={(e) => setVatData({ ...vatData, period_end: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Sales</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                  value={vatData.total_sales}
                  onChange={(e) => setVatData({ ...vatData, total_sales: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Purchases</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                  value={vatData.total_purchases}
                  onChange={(e) => setVatData({ ...vatData, total_purchases: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-100 rounded" onClick={() => setShowVATModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                  Calculate VAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZIMRACompliance;
