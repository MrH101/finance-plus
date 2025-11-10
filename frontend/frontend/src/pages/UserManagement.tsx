import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import HRService from '../services/hrService';
import { DataTable } from '../components/DataTable';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Employee {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  position: string;
  department: {
    name: string;
  };
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, employeesRes] = await Promise.all([
        HRService.getUsers(),
        HRService.getEmployees()
      ]);
      setUsers(usersRes);
      setEmployees((employeesRes as any).results || employeesRes);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createUserFormik = useFormik({
    initialValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      password2: '',
      role: 'employee',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      first_name: Yup.string().required('First name is required'),
      last_name: Yup.string().required('Last name is required'),
      phone: Yup.string().required('Phone number is required'),
      password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
      password2: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
      role: Yup.string().required('Role is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      const tempId = Math.random();
      const optimistic = {
        id: tempId as any,
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        is_active: true,
        created_at: new Date().toISOString(),
      } as any;
      const prev = [...users];
      setUsers((cur) => [optimistic, ...cur]);
      try {
        const created = await HRService.createUser(values);
        setUsers((cur) => cur.map((u) => (u.id === tempId ? created : u)) as any);
        toast.success('User created successfully!');
        resetForm();
        setShowCreateModal(false);
      } catch (err: any) {
        setUsers(prev);
        toast.error(err.response?.data?.message || 'Failed to create user');
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      password: '',
      password2: '',
    },
    validationSchema: Yup.object({
      password: Yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
      password2: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!selectedUser) return;
      try {
        await HRService.updateUserPassword(selectedUser.id, values.password);
        toast.success('Password updated successfully!');
        resetForm();
        setShowPasswordModal(false);
        setSelectedUser(null);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update password');
      }
    },
  });

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    const prev = [...users];
    setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u)));
    try {
      await HRService.updateUserStatus(userId, !isActive);
      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully!`);
    } catch (err) {
      setUsers(prev);
      toast.error('Failed to update user status');
    }
  };

  const bulkActivate = async (activate: boolean) => {
    if (selectedIds.length === 0) return;
    const prev = [...users];
    setUsers((cur) => cur.map((u) => (selectedIds.includes(u.id) ? { ...u, is_active: activate } : u)));
    try {
      await Promise.all(
        users
          .filter((u) => selectedIds.includes(u.id))
          .map((u) => HRService.updateUserStatus(u.id, activate))
      );
      toast.success(`Selected users ${activate ? 'activated' : 'deactivated'}!`);
    } catch (err) {
      setUsers(prev);
      toast.error('Failed to update some users');
    }
  };

  const columns = [
    { header: 'User', accessor: 'username' as const, render: (_: any, u: User) => (
      <div>
        <div className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</div>
        <div className="text-xs text-gray-500">{u.email}</div>
        <div className="text-xs text-gray-400">@{u.username}</div>
      </div>
    )},
    { header: 'Role', accessor: 'role' as const },
    { header: 'Status', accessor: 'is_active' as const, render: (v: boolean) => (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{v ? 'Active' : 'Inactive'}</span>
    )},
    { header: 'Created', accessor: 'created_at' as const, render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              createUserFormik.resetForm();
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            + Create User
          </button>
          <button onClick={() => bulkActivate(true)} className="px-3 py-2 border rounded-md text-sm">Activate</button>
          <button onClick={() => bulkActivate(false)} className="px-3 py-2 border rounded-md text-sm">Deactivate</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <DataTable<User>
          columns={columns as any}
          data={users}
          searchable
          selectableRows
          onSelectionChange={setSelectedIds}
          enableExport
          exportFileName="users.csv"
        />
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New User</h2>
            <form onSubmit={createUserFormik.handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={createUserFormik.values.first_name}
                    onChange={createUserFormik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {createUserFormik.touched.first_name && createUserFormik.errors.first_name && (
                    <div className="text-red-500 text-sm mt-1">{createUserFormik.errors.first_name}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={createUserFormik.values.last_name}
                    onChange={createUserFormik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {createUserFormik.touched.last_name && createUserFormik.errors.last_name && (
                    <div className="text-red-500 text-sm mt-1">{createUserFormik.errors.last_name}</div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={createUserFormik.values.username}
                  onChange={createUserFormik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {createUserFormik.touched.username && createUserFormik.errors.username && (
                  <div className="text-red-500 text-sm mt-1">{createUserFormik.errors.username}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={createUserFormik.values.email}
                  onChange={createUserFormik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {createUserFormik.touched.email && createUserFormik.errors.email && (
                  <div className="text-red-500 text-sm mt-1">{createUserFormik.errors.email}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={createUserFormik.values.phone}
                  onChange={createUserFormik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {createUserFormik.touched.phone && createUserFormik.errors.phone && (
                  <div className="text-red-500 text-sm mt-1">{createUserFormik.errors.phone}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  name="role"
                  value={createUserFormik.values.role}
                  onChange={createUserFormik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="employee">Employee</option>
                  <option value="employer">Employer</option>
                </select>
                {createUserFormik.touched.role && createUserFormik.errors.role && (
                  <div className="text-red-500 text-sm mt-1">{createUserFormik.errors.role}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={createUserFormik.values.password}
                  onChange={createUserFormik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {createUserFormik.touched.password && createUserFormik.errors.password && (
                  <div className="text-red-500 text-sm mt-1">{createUserFormik.errors.password}</div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="password2"
                  value={createUserFormik.values.password2}
                  onChange={createUserFormik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {createUserFormik.touched.password2 && createUserFormik.errors.password2 && (
                  <div className="text-red-500 text-sm mt-1">{createUserFormik.errors.password2}</div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserFormik.isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createUserFormik.isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Reset Password for {selectedUser.first_name} {selectedUser.last_name}
            </h2>
            <form onSubmit={passwordFormik.handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={passwordFormik.values.password}
                  onChange={passwordFormik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {passwordFormik.touched.password && passwordFormik.errors.password && (
                  <div className="text-red-500 text-sm mt-1">{passwordFormik.errors.password}</div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="password2"
                  value={passwordFormik.values.password2}
                  onChange={passwordFormik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {passwordFormik.touched.password2 && passwordFormik.errors.password2 && (
                  <div className="text-red-500 text-sm mt-1">{passwordFormik.errors.password2}</div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordFormik.isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {passwordFormik.isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 