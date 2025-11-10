import React, { useEffect, useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiShield, FiUser, FiActivity, FiClock } from 'react-icons/fi';
import { advancedSystemService } from '../services/advancedService';
import toast from 'react-hot-toast';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    model: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        search: searchTerm
      };
      const response = await advancedSystemService.getAuditLogs(params);
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadLogs();
  };

  const clearFilters = () => {
    setFilters({
      user: '',
      action: '',
      model: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
  };

  const exportLogs = async () => {
    try {
      await advancedSystemService.exportReport('audit', 'csv', filters);
      toast.success('Export started');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getModelColor = (model: string) => {
    const colors: { [key: string]: string } = {
      'User': 'bg-blue-100 text-blue-800',
      'Employee': 'bg-green-100 text-green-800',
      'Product': 'bg-orange-100 text-orange-800',
      'Sale': 'bg-purple-100 text-purple-800',
      'Purchase': 'bg-indigo-100 text-indigo-800',
    };
    return colors[model] || 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = () => {
    return logs.filter((log: any) => 
      log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.record_id?.toString().includes(searchTerm)
    );
  };

  const getActivityStats = () => {
    const stats = {
      total: logs.length,
      creates: logs.filter((log: any) => log.action === 'CREATE').length,
      updates: logs.filter((log: any) => log.action === 'UPDATE').length,
      deletes: logs.filter((log: any) => log.action === 'DELETE').length,
      logins: logs.filter((log: any) => log.action === 'LOGIN').length,
    };
    return stats;
  };

  const stats = getActivityStats();

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Audit Logs</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <FiFilter />
            Filter
          </button>
          <button 
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        />
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="User"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            />
            <select 
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
            <select 
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            >
              <option value="">All Models</option>
              <option value="User">User</option>
              <option value="Employee">Employee</option>
              <option value="Product">Product</option>
              <option value="Sale">Sale</option>
              <option value="Purchase">Purchase</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            />
            <input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
            />
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
            </div>
            <FiActivity className="text-gray-600 text-2xl" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Creates</p>
              <p className="text-2xl font-bold text-green-700">{stats.creates}</p>
            </div>
            <FiActivity className="text-green-600 text-2xl" />
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Updates</p>
              <p className="text-2xl font-bold text-blue-700">{stats.updates}</p>
            </div>
            <FiActivity className="text-blue-600 text-2xl" />
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Deletes</p>
              <p className="text-2xl font-bold text-red-700">{stats.deletes}</p>
            </div>
            <FiActivity className="text-red-600 text-2xl" />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Logins</p>
              <p className="text-2xl font-bold text-purple-700">{stats.logins}</p>
            </div>
            <FiUser className="text-purple-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-semibold">User</th>
              <th className="py-3 px-4 text-left font-semibold">Action</th>
              <th className="py-3 px-4 text-left font-semibold">Model</th>
              <th className="py-3 px-4 text-left font-semibold">Record ID</th>
              <th className="py-3 px-4 text-left font-semibold">Timestamp</th>
              <th className="py-3 px-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs().map((log: any) => (
              <tr key={log.id} className="border-b hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-gray-400" />
                    <span className="font-medium">{log.user}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModelColor(log.model_name)}`}>
                    {log.model_name}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-sm">
                  #{log.record_id}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FiClock className="text-gray-400" />
                    <span className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button 
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      title="View Details"
                    >
                      <FiEye size={16} />
                    </button>
                    <button 
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                      title="Download"
                    >
                      <FiDownload size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredLogs().length === 0 && !loading && (
        <div className="text-center py-12">
          <FiShield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'Try adjusting your search or filter criteria.' 
              : 'No activity has been logged yet.'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading audit logs...</p>
        </div>
      )}
    </div>
  );
};

export default AuditLogs; 