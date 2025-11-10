import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import StatutoryService, { StatutoryReport, StatutoryReportFormData } from '../services/statutoryService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

interface StatutoryReportsProps {}

const StatutoryReports: React.FC<StatutoryReportsProps> = () => {
  const [reports, setReports] = useState<StatutoryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<StatutoryReport | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsData, summaryData] = await Promise.all([
        StatutoryService.getReports(),
        StatutoryService.getReportSummary(),
      ]);
      setReports(reportsData.results || reportsData);
      setSummary(summaryData);
    } catch (error) {
      toast.error('Failed to fetch statutory reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (formData: StatutoryReportFormData) => {
    try {
      await StatutoryService.createReport(formData);
      toast.success('Report created successfully');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create report');
      console.error('Error creating report:', error);
    }
  };

  const handleGenerateReport = async (reportId: number, reportType: string) => {
    try {
      let response;
      switch (reportType) {
        case 'VAT7':
          response = await StatutoryService.generateVAT7(reportId);
          break;
        case 'PAYE':
          response = await StatutoryService.generatePAYE(reportId);
          break;
        case 'NSSA':
          response = await StatutoryService.generateNSSA(reportId);
          break;
        default:
          toast.error('Unsupported report type');
          return;
      }
      toast.success(response.message || 'Report generated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error generating report:', error);
    }
  };

  const handleSubmitReport = async (reportId: number) => {
    try {
      await StatutoryService.submitReport(reportId);
      toast.success('Report submitted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to submit report');
      console.error('Error submitting report:', error);
    }
  };

  const handleApproveReport = async (reportId: number) => {
    try {
      await StatutoryService.approveReport(reportId);
      toast.success('Report approved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve report');
      console.error('Error approving report:', error);
    }
  };

  const handleRejectReport = async (reportId: number, reason: string) => {
    try {
      await StatutoryService.rejectReport(reportId, reason);
      toast.success('Report rejected successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject report');
      console.error('Error rejecting report:', error);
    }
  };

  const handleExportPDF = async (reportId: number) => {
    try {
      const blob = await StatutoryService.exportPDF(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statutory_report_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('Error exporting PDF:', error);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesType = filterType === 'all' || report.report_type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statutory Reports</h1>
          <p className="text-gray-600">Manage Zimbabwean tax compliance reports</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Reports</h3>
            <p className="text-2xl font-bold text-gray-900">{summary?.total_reports || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total VAT Payable</h3>
            <p className="text-2xl font-bold text-blue-600">
              ${summary?.total_vat_payable?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total PAYE Remitted</h3>
            <p className="text-2xl font-bold text-green-600">
              ${summary?.total_paye_remitted?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total NSSA Contributions</h3>
            <p className="text-2xl font-bold text-purple-600">
              ${summary?.total_nssa_contributions?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Draft Reports</h3>
            <p className="text-2xl font-bold text-gray-600">{summary?.draft_reports || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Submitted Reports</h3>
            <p className="text-2xl font-bold text-blue-600">{summary?.submitted_reports || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Approved Reports</h3>
            <p className="text-2xl font-bold text-green-600">{summary?.approved_reports || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Rejected Reports</h3>
            <p className="text-2xl font-bold text-red-600">{summary?.rejected_reports || 0}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Report Types</option>
                <option value="VAT7">VAT 7 Return</option>
                <option value="PAYE">PAYE Return</option>
                <option value="NSSA">NSSA Return</option>
                <option value="AIDS_LEVY">AIDS Levy Return</option>
                <option value="WITHHOLDING_TAX">Withholding Tax Return</option>
                <option value="CORPORATE_TAX">Corporate Tax Return</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <Button onClick={() => setShowAddModal(true)}>
                + Create Report
              </Button>
            </div>

            {/* Reports Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => {
                    const formatted = StatutoryService.formatReport(report);
                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatted.icon} {formatted.title}
                            </div>
                            <div className="text-sm text-gray-500">{formatted.subtitle}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.period_start} to {report.period_end}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                            {report.status_display}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${report.total_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {report.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => handleGenerateReport(report.id, report.report_type)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Generate
                                </button>
                                <button
                                  onClick={() => handleSubmitReport(report.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Submit
                                </button>
                              </>
                            )}
                            {report.status === 'SUBMITTED' && (
                              <>
                                <button
                                  onClick={() => handleApproveReport(report.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) handleRejectReport(report.id, reason);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleExportPDF(report.id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Export
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Report Modal */}
      {showAddModal && (
        <CreateReportModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateReport}
        />
      )}
    </div>
  );
};

// Create Report Modal Component
interface CreateReportModalProps {
  onClose: () => void;
  onSubmit: (data: StatutoryReportFormData) => void;
}

const CreateReportModal: React.FC<CreateReportModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<StatutoryReportFormData>({
    report_type: 'VAT7',
    period_start: '',
    period_end: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleReportTypeChange = (reportType: string) => {
    setFormData(prev => ({
      ...prev,
      report_type: reportType,
      ...StatutoryService.getDefaultPeriod(reportType),
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Statutory Report</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={formData.report_type}
                onChange={(e) => handleReportTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {StatutoryService.getReportTypes().map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Period Start"
              type="date"
              value={formData.period_start}
              onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
              required
            />
            <Input
              label="Period End"
              type="date"
              value={formData.period_end}
              onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Create Report
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatutoryReports; 