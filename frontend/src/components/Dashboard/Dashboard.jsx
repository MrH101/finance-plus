import React from 'react';
import { Link } from 'react-router-dom';
import { Building, Package, Users, DollarSign, LineChart, ClipboardList } from 'lucide-react';
import ModuleTile from './ModuleTile';

const Dashboard = () => {
  const modules = [
    {
      title: 'Stores',
      icon: <Building className="w-8 h-8" />,
      path: '/stores',
      description: 'Manage store locations and inventory',
    },
    {
      title: 'Products',
      icon: <Package className="w-8 h-8" />,
      path: '/products',
      description: 'Manage product catalog and pricing',
    },
    {
      title: 'Employees',
      icon: <Users className="w-8 h-8" />,
      path: '/employees',
      description: 'Manage employee records and roles',
    },
    {
      title: 'Payroll',
      icon: <DollarSign className="w-8 h-8" />,
      path: '/payroll',
      description: 'Process payroll and tax calculations',
    },
    {
      title: 'Inventory',
      icon: <ClipboardList className="w-8 h-8" />,
      path: '/inventory',
      description: 'Track and manage inventory levels',
    },
    {
      title: 'Reports',
      icon: <LineChart className="w-8 h-8" />,
      path: '/reports',
      description: 'Generate financial and operational reports',
    },
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <ModuleTile key={index} module={module} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;