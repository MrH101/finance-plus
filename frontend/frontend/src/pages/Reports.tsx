import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

interface PayrollReport {
  id: number;
  report_type: string;
  report_type_display: string;
  period: string;
  total_employees: number;
  total_gross_pay: number;
  total_net_pay: number;
  total_tax: number;
  total_pension: number;
  generated_date: string;
  status: string;
  status_display: string;
}

interface TaxReport {
  id: number;
  report_type: string;
  report_type_display: string;
  tax_year: string;
  period: string;
  total_taxable_income: number;
  total_tax_paid: number;
  total_paye: number;
  total_nhima: number;
  total_aids_levy: number;
  generated_date: string;
  status: string;
  status_display: string;
}

interface FinancialReport {
  id: number;
  report_type: string;
  report_type_display: string;
  period: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  total_assets: number;
  total_liabilities: number;
  generated_date: string;
  status: string;
  status_display: string;
}

interface ScheduledReport {
  id: number;
  report_type: string;
  report_type_display: string;
  schedule_type: string;
  schedule_type_display: string;
  frequency: string;
  frequency_display: string;
  next_run: string;
  is_active: boolean;
  recipients: string[];
  last_run?: string;
  last_status?: string;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payroll');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [payrollReports, setPayrollReports] = useState<PayrollReport[]>([]);
  const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const tabs = [
    { key: 'payroll', label: 'Payroll Reports' },
    { key: 'tax', label: 'Tax Reports' },
    { key: 'financial', label: 'Financial Reports' },
    { key: 'scheduled', label: 'Scheduled Reports' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const extract = (res: any) => res?.data?.results || res?.data || [];

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'payroll': {
          const res = await api.get('/payroll-reports/');
          setPayrollReports(extract(res));
          break;
        }
        case 'tax': {
          const res = await api.get('/tax-reports/');
          setTaxReports(extract(res));
          break;
        }
        case 'financial': {
          const res = await api.get('/financial-reports/');
          setFinancialReports(extract(res));
          break;
        }
        case 'scheduled': {
          const res = await api.get('/scheduled-reports/');
          setScheduledReports(extract(res));
          break;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string, data: any) => {
    setGenerating(true);
    try {
      if (reportType === 'payroll') await api.post('/payroll-reports/generate/', data);
      if (reportType === 'tax') await api.post('/tax-reports/generate/', data);
      if (reportType === 'financial') await api.post('/financial-reports/generate/', data);
      setShowModal(false);
      setFormData({});
      fetchData();
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: number, reportType: string) => {
    let endpoint = '';
    if (reportType === 'payroll') endpoint = `/payroll-reports/${reportId}/download/`;
    if (reportType === 'tax') endpoint = `/tax-reports/${reportId}/download/`;
    if (reportType === 'financial') endpoint = `/financial-reports/${reportId}/download/`;
    const response = await api.get(endpoint, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report-${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateReport(modalType, formData);
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
    setFormData({});
  };

  const isEmpty = (arr: any[]) => !loading && (!arr || arr.length === 0);

  const renderPayrollReports = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Payroll Reports</h3>
        <button 
          onClick={() => openModal('payroll')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Generate Report
        </button>
      </div>
      {loading ? (
        <Skeleton lines={6} />
      ) : isEmpty(payrollReports) ? (
        <EmptyState title="No payroll reports" description="Generate your first payroll report to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payrollReports.map(report => (
            <div key={report.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{report.report_type_display}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  report.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  report.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {report.status_display}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Period: {report.period}</p>
              <p className="text-sm text-gray-600 mb-2">Employees: {report.total_employees}</p>
              <div className="space-y-1 mb-3">
                <p className="text-sm">Gross Pay: <span className="font-semibold">${report.total_gross_pay.toLocaleString()}</span></p>
                <p className="text-sm">Net Pay: <span className="font-semibold text-green-600">${report.total_net_pay.toLocaleString()}</span></p>
                <p className="text-sm">Tax: <span className="font-semibold text-red-600">${report.total_tax.toLocaleString()}</span></p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{new Date(report.generated_date).toLocaleDateString()}</span>
                {report.status === 'COMPLETED' && (
                  <button 
                    onClick={() => downloadReport(report.id, 'payroll')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Similar rendering for tax, financial, and scheduled with loading/empty
  const renderTaxReports = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Tax Reports</h3>
        <button 
          onClick={() => openModal('tax')}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + Generate Report
        </button>
      </div>
      {loading ? (
        <Skeleton lines={6} />
      ) : isEmpty(taxReports) ? (
        <EmptyState title="No tax reports" description="Generate your first tax report to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxReports.map(report => (
            <div key={report.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{report.report_type_display}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  report.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  report.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {report.status_display}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Period: {report.period}</p>
              <div className="space-y-1 mb-3">
                <p className="text-sm">Taxable Income: <span className="font-semibold">${report.total_taxable_income.toLocaleString()}</span></p>
                <p className="text-sm">Tax Paid: <span className="font-semibold text-red-600">${report.total_tax_paid.toLocaleString()}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFinancialReports = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Financial Reports</h3>
        <button 
          onClick={() => openModal('financial')}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          + Generate Report
        </button>
      </div>
      {loading ? (
        <Skeleton lines={6} />
      ) : isEmpty(financialReports) ? (
        <EmptyState title="No financial reports" description="Generate your first financial report to get started." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 text-left">Period</th>
                <th className="py-2 px-4 text-left">Revenue</th>
                <th className="py-2 px-4 text-left">Expenses</th>
                <th className="py-2 px-4 text-left">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {financialReports.map(report => (
                <tr key={report.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{report.period}</td>
                  <td className="py-2 px-4">${report.total_revenue.toLocaleString()}</td>
                  <td className="py-2 px-4">${report.total_expenses.toLocaleString()}</td>
                  <td className="py-2 px-4 font-semibold ${report.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}">${report.net_profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderScheduledReports = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Scheduled Reports</h3>
      </div>
      {loading ? (
        <Skeleton lines={6} />
      ) : isEmpty(scheduledReports) ? (
        <EmptyState title="No schedules" description="Create a schedule to automate report generation." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">Frequency</th>
                <th className="py-2 px-4 text-left">Next Run</th>
                <th className="py-2 px-4 text-left">Recipients</th>
              </tr>
            </thead>
            <tbody>
              {scheduledReports.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{item.report_type_display}</td>
                  <td className="py-2 px-4">{item.frequency_display}</td>
                  <td className="py-2 px-4">{new Date(item.next_run).toLocaleString()}</td>
                  <td className="py-2 px-4">{item.recipients.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Reports</h2>
        <div className="space-x-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1 rounded ${activeTab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'payroll' && renderPayrollReports()}
      {activeTab === 'tax' && renderTaxReports()}
      {activeTab === 'financial' && renderFinancialReports()}
      {activeTab === 'scheduled' && renderScheduledReports()}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Generate {modalType} report</h3>
            <form onSubmit={handleSubmit}>
              {/* Add minimal fields; details depend on backend requirements */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <input
                  type="month"
                  className="w-full border rounded px-3 py-2"
                  value={formData.period || ''}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="px-4 py-2 bg-gray-100 rounded" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={generating}>
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 