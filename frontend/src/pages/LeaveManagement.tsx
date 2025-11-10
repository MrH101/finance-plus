import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiCheck, FiX, FiCalendar,
  FiClock, FiUser, FiFileText, FiAlertCircle
} from 'react-icons/fi';
import { leaveApplicationService } from '../services/extendedApi';

interface LeaveApplication {
  id: number;
  application_number: string;
  employee_name: string;
  leave_type_name: string;
  from_date: string;
  to_date: string;
  number_of_days: string;
  reason: string;
  status: string;
  approved_by_name?: string;
}

const LeaveManagement: React.FC = () => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    leave_type: '',
    from_date: '',
    to_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await leaveApplicationService.getAll();
      setApplications(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leaveApplicationService.create(formData);
      toast.success('Leave application submitted successfully');
      setShowModal(false);
      resetForm();
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this leave application?')) return;
    
    try {
      await leaveApplicationService.approve(id);
      toast.success('Leave application approved successfully!');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to approve leave application');
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      await leaveApplicationService.reject(selectedApplication.id, rejectionReason);
      toast.success('Leave application rejected');
      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectionReason('');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to reject leave application');
    }
  };

  const resetForm = () => {
    setFormData({
      leave_type: '',
      from_date: '',
      to_date: '',
      reason: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredApplications = applications.filter(app =>
    filterStatus === 'ALL' || app.status === filterStatus
  );

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Management</h1>
        <p className="text-gray-600">Manage employee leave applications and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Applications</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFileText className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-2">{stats.pending}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiClock className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Approved</p>
              <p className="text-3xl font-bold mt-2">{stats.approved}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiCheck className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Rejected</p>
              <p className="text-3xl font-bold mt-2">{stats.rejected}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiX className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiPlus className="h-5 w-5" />
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApplications.map((application) => (
          <div key={application.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {application.employee_name}
                </h3>
                <p className="text-sm text-gray-500">{application.application_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                {application.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiFileText className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{application.leave_type_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="h-4 w-4 text-gray-400" />
                <span>{new Date(application.from_date).toLocaleDateString()} - {new Date(application.to_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiClock className="h-4 w-4 text-gray-400" />
                <span>{application.number_of_days} days</span>
              </div>
            </div>

            <div className="py-3 border-t border-gray-100 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Reason:</span> {application.reason}
              </p>
            </div>

            {application.status === 'PENDING' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(application.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FiCheck className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedApplication(application);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FiX className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}

            {application.approved_by_name && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {application.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {application.approved_by_name}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No leave applications found</p>
          <p className="text-gray-400 mb-4">Start by applying for leave</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-5 w-5" />
            Apply for Leave
          </button>
        </div>
      )}

      {/* Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Apply for Leave</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type *
                </label>
                <select
                  required
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Leave Type</option>
                  <option value="1">Annual Leave</option>
                  <option value="2">Sick Leave</option>
                  <option value="3">Maternity Leave</option>
                  <option value="4">Paternity Leave</option>
                  <option value="5">Compassionate Leave</option>
                  <option value="6">Study Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.from_date}
                    onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.to_date}
                    onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Please provide a reason for your leave..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
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
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FiAlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Reject Leave Application</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Please provide a reason for rejecting this leave application.
              </p>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedApplication(null);
                    setRejectionReason('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;

