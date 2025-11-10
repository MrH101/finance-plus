import React, { useState } from 'react';

const tabs = [
  { key: 'financial', label: 'Financial' },
  { key: 'hr', label: 'HR' },
  { key: 'sales', label: 'Sales' },
];

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('financial');

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-pink-700">Analytics</h2>
      <div className="mb-6 flex gap-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 ${activeTab === tab.key ? 'border-pink-600 text-pink-700' : 'border-transparent text-gray-500 hover:text-pink-600'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div>
          <div className="mb-6">
            <div className="bg-pink-50 rounded-lg p-6 shadow flex flex-col items-center mb-4">
              <span className="text-5xl mb-2">📈</span>
              <h3 className="font-semibold text-lg mb-1">Financial Chart</h3>
              <p className="text-gray-500 text-sm">No data yet. Connect your financial data source.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-pink-700">—</span>
                <span className="text-gray-500 text-sm">Total Revenue</span>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-pink-700">—</span>
                <span className="text-gray-500 text-sm">Total Expenses</span>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-pink-700">—</span>
                <span className="text-gray-500 text-sm">Net Profit</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* HR Tab */}
      {activeTab === 'hr' && (
        <div>
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-6 shadow flex flex-col items-center mb-4">
              <span className="text-5xl mb-2">👥</span>
              <h3 className="font-semibold text-lg mb-1">HR Chart</h3>
              <p className="text-gray-500 text-sm">No data yet. Connect your HR data source.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-700">—</span>
                <span className="text-gray-500 text-sm">Employees</span>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-700">—</span>
                <span className="text-gray-500 text-sm">Turnover Rate</span>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-700">—</span>
                <span className="text-gray-500 text-sm">Attendance</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div>
          <div className="mb-6">
            <div className="bg-green-50 rounded-lg p-6 shadow flex flex-col items-center mb-4">
              <span className="text-5xl mb-2">🛒</span>
              <h3 className="font-semibold text-lg mb-1">Sales Chart</h3>
              <p className="text-gray-500 text-sm">No data yet. Connect your sales data source.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-green-700">—</span>
                <span className="text-gray-500 text-sm">Total Sales</span>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-green-700">—</span>
                <span className="text-gray-500 text-sm">Orders</span>
              </div>
              <div className="bg-white rounded shadow p-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-green-700">—</span>
                <span className="text-gray-500 text-sm">Avg. Order Value</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics; 