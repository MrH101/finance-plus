// src/components/Modules/FinancialReports.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { LineChart, TrendingUp, Wallet, Activity } from 'lucide-react';
import ModuleTile from '../Dashboard/ModuleTile';

const FinancialReports = () => {
  const reports = [
    {
      title: 'Income Statement',
      icon: <TrendingUp className="w-8 h-8" />,
      path: '/financial-reports/income-statement',
      description: 'View revenue, expenses, and net income',
    },
    {
      title: 'Balance Sheet',
      icon: <Wallet className="w-8 h-8" />,
      path: '/financial-reports/balance-sheet',
      description: 'View assets, liabilities, and equity',
    },
    {
      title: 'Cash Flow Statement',
      icon: <Activity className="w-8 h-8" />,
      path: '/financial-reports/cashflow-statement',
      description: 'View cash inflows and outflows',
    },
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">
          <LineChart className="inline-block mr-2" />
          Financial Reports
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            <Link key={index} to={report.path}>
              <ModuleTile module={report} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;