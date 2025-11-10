import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import ProjectService, { ProjectExpense, ExpenseFormData, Project } from '../services/projectService';
import { FiPlus, FiSearch, FiFilter, FiEdit3, FiTrash2, FiDollarSign, FiCalendar, FiCheckCircle, FiXCircle, FiReceipt, FiBarChart2 } from 'react-icons/fi';

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<ProjectExpense | null>(null);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterApproved, setFilterApproved] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await ProjectService.getExpenses({
        search,
        project: filterProject !== 'all' ? parseInt(filterProject) : undefined,
        expense_type: filterType !== 'all' ? filterType : undefined,
        is_approved: filterApproved !== 'all' ? filterApproved === 'approved' : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setExpenses(response.results);
    } catch (err) {
      toast.error('Failed to load expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await ProjectService.getProjects();
      setProjects(response.results);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchProjects();
  }, [search, filterProject, filterType, filterApproved, dateFrom, dateTo]);

  const formik = useFormik<ExpenseFormData>({
    initialValues: {
      project: 0,
      expense_type: 'OTHER',
      description: '',
      amount: 0,
      currency: 'ZWL',
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      receipt_number: '',
      notes: '',
    },
    validationSchema: Yup.object({
      project: Yup.number().required('Project is required').min(1, 'Please select a project'),
      expense_type: Yup.string().required('Expense type is required'),
      description: Yup.string().required('Description is required'),
      amount: Yup.number().required('Amount is required').min(0.01, 'Amount must be greater than 0'),
      expense_date: Yup.date().required('Expense date is required'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        if (editExpense) {
          await ProjectService.updateExpense(editExpense.id, values);
          toast.success('Expense updated successfully!');
        } else {
          await ProjectService.createExpense(values);
          toast.success('Expense created successfully!');
        }
        resetForm();
        setShowModal(false);
        setEditExpense(null);
        await fetchExpenses();
      } catch (err: any) {
        console.error('Error saving expense:', err);
        toast.error(err.response?.data?.message || 'Failed to save expense');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (expense: ProjectExpense) => {
    setEditExpense(expense);
    formik.setValues({
      project: expense.project,
      expense_type: expense.expense_type,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      expense_date: expense.expense_date,
      vendor: expense.vendor,
      receipt_number: expense.receipt_number,
      notes: expense.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      try {
        await ProjectService.deleteExpense(id);
        toast.success('Expense deleted successfully!');
        fetchExpenses();
      } catch (err) {
        toast.error('Failed to delete expense');
        console.error('Error deleting expense:', err);
      }
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await ProjectService.approveExpense(id);
      toast.success('Expense approved successfully!');
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to approve expense');
      console.error('Error approving expense:', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await ProjectService.rejectExpense(id);
      toast.success('Expense rejected successfully!');
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to reject expense');
      console.error('Error rejecting expense:', err);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(search.toLowerCase()) ||
                         expense.vendor.toLowerCase().includes(search.toLowerCase()) ||
                         expense.receipt_number.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortBy) {
      case 'expense_date':
        return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
      case 'amount':
        return b.amount - a.amount;
      case 'expense_type':
        return a.expense_type.localeCompare(b.expense_type);
      case 'description':
        return a.description.localeCompare(b.description);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedExpenses = expenses.filter(e => e.is_approved).length;
  const pendingExpenses = expenses.filter(e => !e.is_approved).length;
  const totalExpenses = expenses.length;

  const getExpenseTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'MATERIALS': 'bg-blue-100 text-blue-800',
      'EQUIPMENT': 'bg-green-100 text-green-800',
      'SERVICES': 'bg-yellow-100 text-yellow-800',
      'TRAVEL': 'bg-purple-100 text-purple-800',
      'SUBCONTRACTOR': 'bg-indigo-100 text-indigo-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600">Track and manage project expenses with approval workflows.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="flex-1 md:flex-none md:w-80 border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={() => {
              setEditExpense(null);
              formik.resetForm();
              formik.setFieldValue('expense_date', new Date().toISOString().split('T')[0]);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FiPlus /> New Expense
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Expenses</div>
              <div className="text-2xl font-semibold">{totalExpenses}</div>
            </div>
            <FiReceipt className="text-blue-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-semibold">${totalAmount.toFixed(2)}</div>
            </div>
            <FiDollarSign className="text-green-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Approved</div>
              <div className="text-2xl font-semibold">{approvedExpenses}</div>
            </div>
            <FiCheckCircle className="text-green-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-semibold">{pendingExpenses}</div>
            </div>
            <FiBarChart2 className="text-yellow-500 text-xl" />
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Types</option>
          {ProjectService.getExpenseTypes().map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select
          value={filterApproved}
          onChange={(e) => setFilterApproved(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From Date"
          className="border border-gray-300 rounded-md px-3 py-2"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To Date"
          className="border border-gray-300 rounded-md px-3 py-2"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="expense_date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="expense_type">Sort by Type</option>
          <option value="description">Sort by Description</option>
        </select>
      </div>

      {/* Expense Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {sortedExpenses.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No expenses found. Try adjusting your search or create a new expense.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
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
                  {sortedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                          {expense.receipt_number && (
                            <div className="text-sm text-gray-500">Receipt: {expense.receipt_number}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {projects.find(p => p.id === expense.project)?.name || 'Unknown Project'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getExpenseTypeColor(expense.expense_type)}`}>
                          {expense.expense_type_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${expense.amount.toFixed(2)} {expense.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.vendor || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          expense.is_approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          {!expense.is_approved && (
                            <>
                              <button
                                onClick={() => handleApprove(expense.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(expense.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editExpense ? 'Edit Expense' : 'Create New Expense'}
            </h2>
            <form onSubmit={formik.handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    name="project"
                    value={formik.values.project}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={0}>Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.project && formik.errors.project && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.project}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Type *
                  </label>
                  <select
                    name="expense_type"
                    value={formik.values.expense_type}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {ProjectService.getExpenseTypes().map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formik.touched.expense_type && formik.errors.expense_type && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.expense_type}</div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Describe the expense..."
                  />
                  {formik.touched.description && formik.errors.description && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.description}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {formik.touched.amount && formik.errors.amount && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.amount}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formik.values.currency}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="ZWL">ZWL</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    name="expense_date"
                    value={formik.values.expense_date}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {formik.touched.expense_date && formik.errors.expense_date && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.expense_date}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    value={formik.values.vendor}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Vendor name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    name="receipt_number"
                    value={formik.values.receipt_number}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Receipt number (optional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Additional notes (optional)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {formik.isSubmitting ? 'Saving...' : (editExpense ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;

