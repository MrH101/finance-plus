import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiPieChart,
  FiTrendingUp, FiTrendingDown, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import { budgetService, costCenterService } from '../services/extendedApi';

interface Budget {
  id: number;
  budget_name: string;
  fiscal_year: string;
  cost_center_name: string;
  total_budget: string;
  total_spent: string;
  total_committed: string;
  available_budget: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface CostCenter {
  id: number;
  code: string;
  name: string;
}

const BudgetManagement: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({
    budget_name: '',
    fiscal_year: '',
    cost_center: '',
    start_date: '',
    end_date: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchBudgets();
    fetchCostCenters();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await budgetService.getAll();
      setBudgets(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCostCenters = async () => {
    try {
      const response = await costCenterService.getAll();
      setCostCenters(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load cost centers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await budgetService.update(editingBudget.id, formData);
        toast.success('Budget updated successfully');
      } else {
        await budgetService.create(formData);
        toast.success('Budget created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchBudgets();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save budget');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await budgetService.delete(id);
      toast.success('Budget deleted successfully');
      fetchBudgets();
    } catch (error) {
      toast.error('Failed to delete budget');
    }
  };

  const resetForm = () => {
    setEditingBudget(null);
    setFormData({
      budget_name: '',
      fiscal_year: '',
      cost_center: '',
      start_date: '',
      end_date: '',
      description: '',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      FROZEN: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBudgetHealth = (budget: Budget) => {
    const spent = parseFloat(budget.total_spent || '0');
    const total = parseFloat(budget.total_budget || '1');
    const percentage = (spent / total) * 100;

    if (percentage >= 90) return { color: 'text-red-600', icon: FiAlertCircle, label: 'Critical' };
    if (percentage >= 75) return { color: 'text-yellow-600', icon: FiAlertCircle, label: 'Warning' };
    return { color: 'text-green-600', icon: FiCheckCircle, label: 'Healthy' };
  };

  const filteredBudgets = budgets.filter(budget =>
    filterStatus === 'ALL' || budget.status === filterStatus
  );

  const stats = {
    total: budgets.length,
    active: budgets.filter(b => b.status === 'ACTIVE').length,
    totalBudget: budgets.reduce((sum, b) => sum + parseFloat(b.total_budget || '0'), 0),
    totalSpent: budgets.reduce((sum, b) => sum + parseFloat(b.total_spent || '0'), 0),
    totalAvailable: budgets.reduce((sum, b) => sum + parseFloat(b.available_budget || '0'), 0),
  };

  const overallUtilization = stats.totalBudget > 0 
    ? (stats.totalSpent / stats.totalBudget) * 100 
    : 0;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
        <p className="text-gray-600">Monitor and control organizational budgets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Budgets</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
              <p className="text-blue-100 text-xs mt-1">{stats.active} Active</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiPieChart className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Allocated</p>
              <p className="text-2xl font-bold mt-2">${stats.totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Spent</p>
              <p className="text-2xl font-bold mt-2">${stats.totalSpent.toLocaleString()}</p>
              <p className="text-red-100 text-xs mt-1">{overallUtilization.toFixed(1)}% utilized</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTrendingDown className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Available</p>
              <p className="text-2xl font-bold mt-2">${stats.totalAvailable.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiTrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'DRAFT', 'ACTIVE', 'FROZEN', 'CLOSED'].map((status) => (
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
            Create Budget
          </button>
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBudgets.map((budget) => {
          const health = getBudgetHealth(budget);
          const HealthIcon = health.icon;
          const spentPercentage = parseFloat(budget.total_budget) > 0
            ? (parseFloat(budget.total_spent) / parseFloat(budget.total_budget)) * 100
            : 0;
          const committedPercentage = parseFloat(budget.total_budget) > 0
            ? (parseFloat(budget.total_committed) / parseFloat(budget.total_budget)) * 100
            : 0;

          return (
            <div key={budget.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {budget.budget_name}
                  </h3>
                  <p className="text-sm text-gray-500">{budget.cost_center_name}</p>
                  <p className="text-xs text-gray-400 mt-1">FY {budget.fiscal_year}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                    {budget.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                {/* Budget Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Budget</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${parseFloat(budget.total_budget).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Available</p>
                      <p className="text-lg font-bold text-green-600">
                        ${parseFloat(budget.available_budget).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Spent</p>
                      <p className="text-lg font-bold text-red-600">
                        ${parseFloat(budget.total_spent).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Committed</p>
                      <p className="text-lg font-bold text-yellow-600">
                        ${parseFloat(budget.total_committed).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Spent</span>
                      <span className="font-medium">{spentPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          spentPercentage >= 90 ? 'bg-red-500' : 
                          spentPercentage >= 75 ? 'bg-yellow-500' : 
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Committed</span>
                      <span className="font-medium">{committedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(committedPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Health Status */}
                <div className={`flex items-center gap-2 ${health.color}`}>
                  <HealthIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Budget Health: {health.label}</span>
                </div>

                {/* Period */}
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <p>Period: {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setEditingBudget(budget);
                    setShowModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FiEdit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(budget.id)}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBudgets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiPieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No budgets found</p>
          <p className="text-gray-400 mb-4">Create your first budget</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-5 w-5" />
            Create Budget
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.budget_name}
                    onChange={(e) => setFormData({ ...formData, budget_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2024"
                    value={formData.fiscal_year}
                    onChange={(e) => setFormData({ ...formData, fiscal_year: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost Center *
                  </label>
                  <select
                    required
                    value={formData.cost_center}
                    onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Cost Center</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={2}
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
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;

