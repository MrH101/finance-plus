import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiCalendar,
  FiTrendingUp, FiTarget, FiAward, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { opportunityService } from '../services/extendedApi';

interface Opportunity {
  id: number;
  opportunity_number: string;
  opportunity_name: string;
  customer_name: string;
  expected_revenue: string;
  probability: string;
  stage: string;
  expected_closing_date: string;
  lead_source: string;
  assigned_to_name?: string;
}

const OpportunityPipeline: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [selectedStage, setSelectedStage] = useState('ALL');

  const [formData, setFormData] = useState({
    opportunity_name: '',
    customer: '',
    expected_revenue: '',
    probability: '50',
    stage: 'QUALIFICATION',
    expected_closing_date: '',
    lead_source: 'WEBSITE',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    description: '',
  });

  const stages = [
    { value: 'PROSPECTING', label: 'Prospecting', color: 'from-gray-500 to-gray-600' },
    { value: 'QUALIFICATION', label: 'Qualification', color: 'from-blue-500 to-blue-600' },
    { value: 'NEEDS_ANALYSIS', label: 'Needs Analysis', color: 'from-purple-500 to-purple-600' },
    { value: 'VALUE_PROPOSITION', label: 'Value Proposition', color: 'from-indigo-500 to-indigo-600' },
    { value: 'PROPOSAL', label: 'Proposal/Quote', color: 'from-yellow-500 to-yellow-600' },
    { value: 'NEGOTIATION', label: 'Negotiation', color: 'from-orange-500 to-orange-600' },
    { value: 'CLOSED_WON', label: 'Closed Won', color: 'from-green-500 to-green-600' },
    { value: 'CLOSED_LOST', label: 'Closed Lost', color: 'from-red-500 to-red-600' },
  ];

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await opportunityService.getAll();
      setOpportunities(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOpp) {
        await opportunityService.update(editingOpp.id, formData);
        toast.success('Opportunity updated successfully');
      } else {
        await opportunityService.create(formData);
        toast.success('Opportunity created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchOpportunities();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save opportunity');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    
    try {
      await opportunityService.delete(id);
      toast.success('Opportunity deleted successfully');
      fetchOpportunities();
    } catch (error) {
      toast.error('Failed to delete opportunity');
    }
  };

  const resetForm = () => {
    setEditingOpp(null);
    setFormData({
      opportunity_name: '',
      customer: '',
      expected_revenue: '',
      probability: '50',
      stage: 'QUALIFICATION',
      expected_closing_date: '',
      lead_source: 'WEBSITE',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      description: '',
    });
  };

  const getStageColor = (stage: string) => {
    const stageObj = stages.find(s => s.value === stage);
    return stageObj ? stageObj.color : 'from-gray-500 to-gray-600';
  };

  const filteredOpportunities = opportunities.filter(opp =>
    selectedStage === 'ALL' || opp.stage === selectedStage
  );

  const stats = {
    total: opportunities.length,
    totalRevenue: opportunities.reduce((sum, o) => sum + parseFloat(o.expected_revenue || '0'), 0),
    avgProbability: opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + parseFloat(o.probability || '0'), 0) / opportunities.length
      : 0,
    wonDeals: opportunities.filter(o => o.stage === 'CLOSED_WON').length,
    weighted: opportunities.reduce((sum, o) => 
      sum + (parseFloat(o.expected_revenue || '0') * parseFloat(o.probability || '0') / 100), 0
    ),
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Pipeline</h1>
        <p className="text-gray-600">Track and manage sales opportunities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Opportunities</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTarget className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Value</p>
              <p className="text-2xl font-bold mt-2">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Weighted Value</p>
              <p className="text-2xl font-bold mt-2">${stats.weighted.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg Probability</p>
              <p className="text-3xl font-bold mt-2">{stats.avgProbability.toFixed(0)}%</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTarget className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Won Deals</p>
              <p className="text-3xl font-bold mt-2">{stats.wonDeals}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiAward className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStage('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedStage === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ALL
            </button>
            {stages.map((stage) => (
              <button
                key={stage.value}
                onClick={() => setSelectedStage(stage.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedStage === stage.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiPlus className="h-5 w-5" />
            New Opportunity
          </button>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOpportunities.map((opp) => (
          <div key={opp.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {opp.opportunity_name}
                </h3>
                <p className="text-sm text-gray-500">{opp.opportunity_number}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingOpp(opp);
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(opp.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className={`bg-gradient-to-br ${getStageColor(opp.stage)} rounded-lg p-4 mb-4`}>
              <p className="text-white text-sm font-medium">
                {stages.find(s => s.value === opp.stage)?.label || opp.stage}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-white bg-opacity-30 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${opp.probability}%` }}
                  />
                </div>
                <span className="text-white text-xs font-medium">{opp.probability}%</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="text-sm font-medium text-gray-900">{opp.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Revenue:</span>
                <span className="text-sm font-bold text-green-600">
                  ${parseFloat(opp.expected_revenue).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Weighted Value:</span>
                <span className="text-sm font-medium text-blue-600">
                  ${(parseFloat(opp.expected_revenue) * parseFloat(opp.probability) / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="h-4 w-4 text-gray-400" />
                <span>Closing: {new Date(opp.expected_closing_date).toLocaleDateString()}</span>
              </div>
            </div>

            {opp.assigned_to_name && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <FiTarget className="h-3 w-3" />
                  {opp.assigned_to_name}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiTarget className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No opportunities found</p>
          <p className="text-gray-400 mb-4">Start tracking your sales opportunities</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-5 w-5" />
            New Opportunity
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingOpp ? 'Edit Opportunity' : 'Create Opportunity'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opportunity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.opportunity_name}
                    onChange={(e) => setFormData({ ...formData, opportunity_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Revenue *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.expected_revenue}
                    onChange={(e) => setFormData({ ...formData, expected_revenue: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage *
                  </label>
                  <select
                    required
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {stages.map((stage) => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probability (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Closing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expected_closing_date}
                    onChange={(e) => setFormData({ ...formData, expected_closing_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Source
                  </label>
                  <select
                    value={formData.lead_source}
                    onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="COLD_CALL">Cold Call</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                    <option value="EMAIL">Email</option>
                    <option value="PARTNER">Partner</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {editingOpp ? 'Update Opportunity' : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityPipeline;

