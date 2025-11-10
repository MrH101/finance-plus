import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaCalculator, FaMapMarkerAlt, FaSignInAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface SignupFormValues {
  username: string;
  email: string;
  phone: string;
  password: string;
  password2: string;
  role: string;
}

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    username: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    phone: Yup.string().required('Required'),
    password: Yup.string().min(8, 'Minimum 8 characters').required('Required'),
    password2: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Required'),
    role: Yup.string().required('Required'),
  });

  const formik = useFormik<SignupFormValues>({
    initialValues: {
      username: '',
      email: '',
      phone: '',
      password: '',
      password2: '',
      role: 'EMPLOYER',
    },
    validationSchema,
    onSubmit: async (values: SignupFormValues) => {
      try {
        console.log('Signup form data being sent:', values);
        
        await signup({
          username: values.username,
          email: values.email,
          phone: values.phone,
          password: values.password,
          password2: values.password2,
          role: values.role,
        });
        
        toast.success('Account created successfully!');
      } catch (error: any) {
        console.error('Signup failed:', error);
        toast.error(error.response?.data?.error || 'Signup failed');
      }
    },
  });

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
            <p className="text-gray-600 mt-2 text-sm">Create your account</p>
          </div>
          
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="space-y-4">
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
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.username && formik.errors.username && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.username}</div>
                )}
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
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.email}</div>
                )}
              </div>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaPhone />
                </span>
                <input
                  type="text"
                  name="phone"
                  required
                  className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                  placeholder="Phone number"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.phone}</div>
                )}
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
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.password}</div>
                )}
              </div>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaLock />
                </span>
                <input
                  type="password"
                  name="password2"
                  required
                  className="pl-10 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                  placeholder="Confirm Password"
                  value={formik.values.password2}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password2 && formik.errors.password2 && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.password2}</div>
                )}
              </div>
              
              <div className="relative">
                <select
                  name="role"
                  required
                  className="pl-3 pr-3 py-2 w-full rounded-md border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white bg-opacity-80"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled
                >
                  <option value="EMPLOYER">Employer</option>
                </select>
                {formik.touched.role && formik.errors.role && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.role}</div>
                )}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? 'Creating Account...' : 'Create Account'}
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

export default Signup;
