import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaBuilding, FaCalculator, FaMapMarkerAlt, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

const EmployerSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Create account via API
      const { default: authService } = await import('../services/authService');
      await authService.signup({
        username: formData.email,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        businessName: formData.businessName,
      });
      // Auto-login after successful signup
      await login(formData.email, formData.password);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
            <p className="text-gray-600 mt-2 text-sm">Create your business account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaUser />
                </span>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaUser />
                </span>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaEnvelope />
              </span>
              <input
                type="email"
                name="email"
                required
                className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaPhone />
              </span>
              <input
                type="tel"
                name="phone"
                required
                className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                placeholder="+263 77 123 4567"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaBuilding />
              </span>
              <input
                type="text"
                name="businessName"
                required
                className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                placeholder="Business name"
                value={formData.businessName}
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
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaLock />
              </span>
              <input
                type="password"
                name="confirmPassword"
                required
                className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <Link to="/login" className="flex flex-col items-center text-blue-700 hover:text-blue-900">
              <FaSignInAlt className="text-2xl mb-1" />
              <span className="text-xs font-medium">Login</span>
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

export default EmployerSignup;
