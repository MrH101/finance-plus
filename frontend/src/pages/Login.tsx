import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { FaUser, FaLock, FaSignInAlt, FaCalculator, FaMapMarkerAlt } from 'react-icons/fa';

const Login: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(formData.username, formData.password);
    if (!result.success) {
      // Error is handled by the auth slice
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      className="min-h-screen h-screen w-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80)',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30 z-0" />
      <div className="relative z-10 flex flex-col justify-center items-center w-full max-w-md mx-auto my-auto">
        <div className="backdrop-blur-md bg-white/70 rounded-xl shadow-2xl p-8 w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">F</span>
            </div>
            <span className="text-2xl font-bold text-blue-700">Finance Plus</span>
            <p className="text-gray-600 mt-2 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaUser />
              </span>
              <input
                type="text"
                name="username"
                required
                className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaLock />
              </span>
              <input
                type="password"
                name="password"
                required
                className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500">
                Demo Credentials:
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Admin: admin@example.com / admin123
              </p>
              <p className="text-xs text-gray-500">
                Employer: hoko1@gmail.com / admin123
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <Link to="/signup" className="flex flex-col items-center text-blue-700 hover:text-blue-900">
              <FaSignInAlt className="text-2xl mb-1" />
              <span className="text-xs font-medium">Register</span>
            </Link>
            <a href="#" className="flex flex-col items-center text-blue-700 hover:text-blue-900">
              <FaCalculator className="text-2xl mb-1" />
              <span className="text-xs font-medium">Tools & Calculators</span>
            </a>
            <a href="#" className="flex flex-col items-center text-blue-700 hover:text-blue-900">
              <FaMapMarkerAlt className="text-2xl mb-1" />
              <span className="text-xs font-medium">ATM & Branch</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
