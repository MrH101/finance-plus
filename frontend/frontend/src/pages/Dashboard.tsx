import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiDollarSign, FiUsers, FiTrendingUp, FiActivity, FiShoppingCart, FiPackage, FiCreditCard, FiSmartphone } from 'react-icons/fi';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface DashboardData {
  kpis: {
    revenue?: number;
    expenses?: number;
    profit?: number;
    cash_balance?: number;
    revenue_growth?: number;
  };
  counts: {
    products?: number;
    customers?: number;
    employees?: number;
    active_sessions?: number;
  };
  balances: {
    cash?: number;
    mobile_money?: number;
    bank?: number;
    total?: number;
  };
  recent_activity?: Array<{
    id: number | string;
    type: string;
    description?: string;
    created_at?: string;
  }>;
  revenue_this_month?: number;
  revenue_last_month?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<DashboardData>('/dashboard/', { signal: controller.signal });
        setData(res.data);
      } catch (error: any) {
        // Ignore canceled errors (component unmounted or request aborted)
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED' || controller.signal.aborted) {
          return;
        }
        console.error('Failed to load dashboard data:', error);
        // Only show error toast for actual errors, not canceled requests
        if (error?.response?.status === 401) {
          // Authentication error - user might need to login
          console.warn('Authentication required for dashboard');
        } else if (error?.response?.status !== 401) {
          toast.error('Failed to load dashboard data');
        }
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const fmt = (n?: number | null) => {
    if (n === null || n === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n));
  };

  const fmtNumber = (n?: number | null) => {
    if (n === null || n === undefined) return '—';
    return new Intl.NumberFormat('en-US').format(Number(n));
  };

  const kpis = data?.kpis || {};
  const counts = data?.counts || {};
  const balances = data?.balances || {};
  const recent = data?.recent_activity || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.first_name || user?.username || user?.email || 'User'}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
          {loading ? (
            <Skeleton lines={4} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                <FiDollarSign className="h-10 w-10 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                  <p className="text-xl font-bold text-blue-900">{fmt(kpis.revenue)}</p>
                  {kpis.revenue_growth !== undefined && (
                    <p className={`text-xs mt-1 ${kpis.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpis.revenue_growth >= 0 ? '↑' : '↓'} {Math.abs(kpis.revenue_growth).toFixed(1)}% vs last month
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-100">
                <FiActivity className="h-10 w-10 text-red-600 mr-4" />
                <div>
                  <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                  <p className="text-xl font-bold text-red-900">{fmt(kpis.expenses)}</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
                <FiTrendingUp className="h-10 w-10 text-green-600 mr-4" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Net Profit</p>
                  <p className="text-xl font-bold text-green-900">{fmt(kpis.profit)}</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                <FiCreditCard className="h-10 w-10 text-orange-600 mr-4" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">Total Balance</p>
                  <p className="text-xl font-bold text-orange-900">{fmt(kpis.cash_balance)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Counts and Balances */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Counts */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
            {loading ? (
              <Skeleton lines={4} />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center mb-2">
                    <FiPackage className="h-6 w-6 text-purple-600 mr-2" />
                    <p className="text-sm text-purple-600 font-medium">Products</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{fmtNumber(counts.products)}</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center mb-2">
                    <FiUsers className="h-6 w-6 text-indigo-600 mr-2" />
                    <p className="text-sm text-indigo-600 font-medium">Customers</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">{fmtNumber(counts.customers)}</p>
                </div>
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="flex items-center mb-2">
                    <FiUsers className="h-6 w-6 text-teal-600 mr-2" />
                    <p className="text-sm text-teal-600 font-medium">Employees</p>
                  </div>
                  <p className="text-2xl font-bold text-teal-900">{fmtNumber(counts.employees)}</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                  <div className="flex items-center mb-2">
                    <FiShoppingCart className="h-6 w-6 text-pink-600 mr-2" />
                    <p className="text-sm text-pink-600 font-medium">Active Sessions</p>
                  </div>
                  <p className="text-2xl font-bold text-pink-900">{fmtNumber(counts.active_sessions)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Account Balances */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Balances</h3>
            {loading ? (
              <Skeleton lines={4} />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center">
                    <FiDollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-700">Cash Till</span>
                  </div>
                  <span className="text-lg font-bold text-green-900">{fmt(balances.cash)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center">
                    <FiSmartphone className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-700">Mobile Money</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900">{fmt(balances.mobile_money)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center">
                    <FiCreditCard className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="text-sm font-medium text-indigo-700">Bank Account</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-900">{fmt(balances.bank)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-300">
                  <span className="text-sm font-semibold text-gray-700">Total Balance</span>
                  <span className="text-xl font-bold text-gray-900">{fmt(balances.total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {loading ? (
            <Skeleton lines={6} />
          ) : recent.length === 0 ? (
            <EmptyState 
              title="No recent activity" 
              description="You will see sales, transactions, and other activities here once they occur." 
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recent.map((item) => (
                    <tr key={String(item.id)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.description || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
