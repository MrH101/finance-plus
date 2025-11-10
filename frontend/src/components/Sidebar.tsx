import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';
import { primaryNav } from '../config/navigation';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const allowed = (roles?: Array<'superadmin' | 'employer' | 'employee'>) => {
    if (!roles || roles.length === 0) return true;
    const isStaff = (user as any)?.is_staff === true;
    // Map legacy/alternate roles to app roles
    const rawRole = (user as any)?.role as string | undefined;
    const normalizedRole = (rawRole === 'admin' ? 'superadmin' : rawRole) as 'superadmin' | 'employer' | 'employee' | undefined;
    // Staff should have access to all gated items
    if (isStaff) return true;
    return normalizedRole ? roles.includes(normalizedRole) : false;
  };

  const filtered = primaryNav.filter((item) =>
    allowed(item.roles) && item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center px-6 py-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Finance Plus</h1>
            <p className="text-xs text-gray-400">ERP System</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {filtered.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {(user as any)?.role || ((user as any)?.is_staff ? 'superadmin' : 'user')}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white transition-colors"
            title="Logout"
          >
            <span className="text-lg">🚪</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 
