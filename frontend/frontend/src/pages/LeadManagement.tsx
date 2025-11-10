import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiPhone,
  FiBriefcase, FiDollarSign, FiTrendingUp, FiAward
} from 'react-icons/fi';
import { leadService } from '../services/extendedApi';

interface Lead {
  id: number;
  lead_number: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  expected_revenue: string;
  probability: number;
  assigned_to_name?: string;
}

const LeadManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    mobile: '',
    source: 'WEBSITE',
    status: 'NEW',
    industry: '',
    expected_revenue: '0',
    probability: 50,
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await leadService.getAll();
      setLeads(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await leadService.update(editingLead.id, formData);
        toast.success('Lead updated successfully');
      } else {
        await leadService.create(formData);
        toast.success('Lead created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save lead');
    }
  };

  const handleConvertToOpportunity = async (id: number) => {
    if (!window.confirm('Convert this lead to an opportunity?')) return;
    
    try {
      await leadService.convertToOpportunity(id);
      toast.success('Lead converted to opportunity successfully!');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to convert lead');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await leadService.delete(id);
      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      first_name: lead.first_name,
      last_name: lead.last_name,
      company_name: lead.company_name,
      email: lead.email,
      phone: lead.phone,
      mobile: '',
      source: lead.source,
      status: lead.status,
      industry: '',
      expected_revenue: lead.expected_revenue,
      probability: lead.probability,
      notes: '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingLead(null);
    setFormData({
      first_name: '',
      last_name: '',
      company_name: '',
      email: '',
      phone: '',
      mobile: '',
      source: 'WEBSITE',
      status: 'NEW',
      industry: '',
      expected_revenue: '0',
      probability: 50,
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      PROPOSAL: 'bg-purple-100 text-purple-800',
      NEGOTIATION: 'bg-indigo-100 text-indigo-800',
      WON: 'bg-emerald-100 text-emerald-800',
      LOST: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredLeads = leads.filter(lead => 
    filterStatus === 'ALL' || lead.status === filterStatus
  );

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    won: leads.filter(l => l.status === 'WON').length,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Management</h1>
        <p className="text-gray-600">Track and convert your sales leads</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Leads</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiUser className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">New Leads</p>
              <p className="text-3xl font-bold mt-2">{stats.new}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Qualified</p>
              <p className="text-3xl font-bold mt-2">{stats.qualified}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiAward className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Won</p>
              <p className="text-3xl font-bold mt-2">{stats.won}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiPlus className="h-5 w-5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <div key={lead.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {lead.first_name} {lead.last_name}
                </h3>
                <p className="text-sm text-gray-500">{lead.lead_number}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(lead)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(lead.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiBriefcase className="h-4 w-4 text-gray-400" />
                <span>{lead.company_name || 'No company'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{lead.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiPhone className="h-4 w-4 text-gray-400" />
                <span>{lead.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
              <div className="text-right">
                <div className="text-xs text-gray-500">Expected Revenue</div>
                <div className="text-sm font-semibold text-gray-900">${lead.expected_revenue}</div>
              </div>
            </div>

            {/* Probability Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Probability</span>
                <span>{lead.probability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${lead.probability}%` }}
                ></div>
              </div>
            </div>

            {lead.status === 'QUALIFIED' && (
              <button
                onClick={() => handleConvertToOpportunity(lead.id)}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Convert to Opportunity
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiUser className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No leads found</p>
          <p className="text-gray-400 mb-4">Start by creating your first lead</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-5 w-5" />
            Create Lead
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source *
                  </label>
                  <select
                    required
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="COLD_CALL">Cold Call</option>
                    <option value="WALK_IN">Walk In</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="ADVERTISEMENT">Advertisement</option>
                    <option value="EXHIBITION">Exhibition</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal Sent</option>
                    <option value="NEGOTIATION">In Negotiation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Revenue
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.expected_revenue}
                    onChange={(e) => setFormData({ ...formData, expected_revenue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probability (%) - {formData.probability}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
                  {editingLead ? 'Update Lead' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;

