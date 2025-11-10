import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiDownload, FiFilter, FiSearch, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { advancedBudgetService } from '../services/advancedService';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'budgets', label: 'Budgets', icon: FiTrendingUp },
  { key: 'accountsPayable', label: 'Accounts Payable', icon: FiTrendingDown },
  { key: 'accountsReceivable', label: 'Accounts Receivable', icon: FiDollarSign },
];

const Budgets: React.FC = () => {
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<any[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ 
    name: '', 
    amount: '', 
    start_date: '', 
    end_date: '',
    description: '',
    category: ''
  });
  const [editId, setEditId] = useState<number|null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const toArray = (val: any) => (Array.isArray(val) ? val : (val && val.results && Array.isArray(val.results) ? val.results : []));

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, payablesRes, receivablesRes] = await Promise.all([
        advancedBudgetService.getBudgets(),
        advancedBudgetService.getAccountsPayable(),
        advancedBudgetService.getAccountsReceivable()
      ]);
      setBudgets(toArray(budgetsRes.data));
      setAccountsPayable(toArray(payablesRes.data));
      setAccountsReceivable(toArray(receivablesRes.data));
    } catch (error) {
      toast.error('Failed to load data');
      setBudgets([]);
      setAccountsPayable([]);
      setAccountsReceivable([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await advancedBudgetService.updateBudget(editId, form);
        toast.success('Budget updated successfully');
      } else {
        await advancedBudgetService.createBudget(form);
        toast.success('Budget created successfully');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ name: '', amount: '', start_date: '', end_date: '', description: '', category: '' });
      loadData();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await advancedBudgetService.deleteBudget(id);
        toast.success('Deleted successfully');
        loadData();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const filteredData = () => {
    const data = activeTab === 'budgets' ? budgets : 
                 activeTab === 'accountsPayable' ? accountsPayable : 
                 accountsReceivable;
    const list = Array.isArray(data) ? data : [];
    return list.filter((item: any) => 
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const calculateTotals = () => {
    const data = filteredData();
    return data.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Financial Management</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <FiFilter />
            Filter
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus />
            Add New
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="date"
              placeholder="Start Date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="End Date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Categories</option>
              <option>Operations</option>
              <option>Marketing</option>
              <option>IT</option>
            </select>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`flex items-center gap-2 px-4 py-2 font-semibold border-b-2 transition-colors duration-150 ${
              activeTab === tab.key 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Total Budgets</p>
              <p className="text-2xl font-bold text-blue-700">${calculateTotals().toLocaleString()}</p>
            </div>
            <FiTrendingUp className="text-blue-600 text-2xl" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Accounts Payable</p>
              <p className="text-2xl font-bold text-green-700">
                ${accountsPayable.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}
              </p>
            </div>
            <FiTrendingDown className="text-green-600 text-2xl" />
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Accounts Receivable</p>
              <p className="text-2xl font-bold text-yellow-700">
                ${accountsReceivable.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}
              </p>
            </div>
            <FiDollarSign className="text-yellow-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'budgets' && (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-3 px-4 text-left font-semibold">Name</th>
                  <th className="py-3 px-4 text-left font-semibold">Amount</th>
                  <th className="py-3 px-4 text-left font-semibold">Category</th>
                  <th className="py-3 px-4 text-left font-semibold">Period</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData().map((b: any) => (
                  <tr key={b.id} className="border-b hover:bg-blue-50 transition">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{b.name}</p>
                        <p className="text-sm text-gray-500">{b.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">${parseFloat(b.amount).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {b.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {b.start_date} - {b.end_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        new Date(b.end_date) > new Date() 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {new Date(b.end_date) > new Date() ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditId(b.id); setForm(b); setShowModal(true); }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(b.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <FiDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'accountsPayable' && (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-green-50">
                  <th className="py-3 px-4 text-left font-semibold">Supplier</th>
                  <th className="py-3 px-4 text-left font-semibold">Amount</th>
                  <th className="py-3 px-4 text-left font-semibold">Due Date</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData().map((a: any) => (
                  <tr key={a.id} className="border-b hover:bg-green-50 transition">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{a.supplier?.name}</p>
                        <p className="text-sm text-gray-500">{a.supplier?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">${parseFloat(a.amount).toLocaleString()}</td>
                    <td className="py-3 px-4">{a.due_date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        a.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {a.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <FiEdit />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <FiDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'accountsReceivable' && (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-yellow-50">
                  <th className="py-3 px-4 text-left font-semibold">Customer</th>
                  <th className="py-3 px-4 text-left font-semibold">Amount</th>
                  <th className="py-3 px-4 text-left font-semibold">Due Date</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData().map((a: any) => (
                  <tr key={a.id} className="border-b hover:bg-yellow-50 transition">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{a.customer?.name}</p>
                        <p className="text-sm text-gray-500">{a.customer?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">${parseFloat(a.amount).toLocaleString()}</td>
                    <td className="py-3 px-4">{a.due_date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        a.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {a.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <FiEdit />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <FiDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h4 className="text-lg font-bold mb-4">{editId ? 'Edit' : 'Add'} Budget</h4>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                placeholder="Budget Name" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required
              />
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                placeholder="Amount" 
                type="number"
                value={form.amount} 
                onChange={e => setForm({ ...form, amount: e.target.value })} 
                required
              />
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                placeholder="Category" 
                value={form.category} 
                onChange={e => setForm({ ...form, category: e.target.value })} 
              />
              <textarea 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                placeholder="Description" 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                rows={3}
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                  placeholder="Start Date" 
                  type="date"
                  value={form.start_date} 
                  onChange={e => setForm({ ...form, start_date: e.target.value })} 
                  required
                />
                <input 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" 
                  placeholder="End Date" 
                  type="date"
                  value={form.end_date} 
                  onChange={e => setForm({ ...form, end_date: e.target.value })} 
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition" 
                  onClick={() => { 
                    setShowModal(false); 
                    setEditId(null); 
                    setForm({ name: '', amount: '', start_date: '', end_date: '', description: '', category: '' }); 
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  {editId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets; 