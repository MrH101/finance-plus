import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiDollarSign, FiBarChart2, FiSettings, FiUsers, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header - full width, always at the top */}
        <header className="bg-white shadow-sm w-full px-8 py-4 flex items-center justify-between fixed top-0 left-0 z-40" style={{ minWidth: 0 }}>
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu className="h-6 w-6" />
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-900">Finance Plus</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <FiLogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </header>
        {/* Main content area */}
        <main className="flex-1 p-8 bg-gray-50 mt-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 