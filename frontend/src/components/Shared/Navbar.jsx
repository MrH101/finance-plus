import React from 'react';
import { Link } from 'react-router-dom';
import { Building, LogOut, Bell } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 dark:bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Building className="h-6 w-6" />
          <span className="text-xl font-bold">ERP System</span>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <Bell className="h-5 w-5 cursor-pointer" />
        <button onClick={logout} className="flex items-center space-x-2 hover:opacity-80">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;