import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';

interface Employee {
  id: number;
  username: string;
  email: string;
  role: string;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/');
      setEmployees(res.data.filter((u: Employee) => u.role === 'employee'));
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      password2: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      username: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email').required('Required'),
      password: editEmployee
        ? Yup.string().min(8, 'Minimum 8 characters')
        : Yup.string().min(8, 'Minimum 8 characters').required('Required'),
      password2: editEmployee
        ? Yup.string().oneOf([Yup.ref('password')], 'Passwords must match')
        : Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editEmployee) {
          await api.put(`/users/${editEmployee.id}/`, { username: values.username, email: values.email });
          toast.success('Employee updated!');
        } else {
          await api.post('/users/', { ...values, role: 'employee' });
          toast.success('Employee added!');
        }
        resetForm();
        setShowModal(false);
        setEditEmployee(null);
        fetchEmployees();
      } catch (err: any) {
        toast.error(err.response?.data?.errors?.[0] || err.response?.data?.errors || 'Failed to save employee');
      }
    },
  });

  const handleEdit = (emp: Employee) => {
    setEditEmployee(emp);
    formik.setValues({ username: emp.username, email: emp.email, password: '', password2: '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/users/${id}/`);
        toast.success('Employee deleted!');
        fetchEmployees();
      } catch (err: any) {
        toast.error('Failed to delete employee');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>
      <div className="mb-8">
        <button onClick={() => { setShowModal(true); setEditEmployee(null); formik.resetForm(); }} className="bg-blue-700 text-white px-4 py-2 rounded mb-4">+ Add Employee</button>
      {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-lg font-semibold mb-2">{editEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 gap-4">
                <input type="text" name="username" placeholder="Username" className="border rounded px-3 py-2" value={formik.values.username} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                <input type="email" name="email" placeholder="Email" className="border rounded px-3 py-2" value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                {!editEmployee && (
                  <>
                    <input type="password" name="password" placeholder="Password" className="border rounded px-3 py-2" value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                    <input type="password" name="password2" placeholder="Confirm Password" className="border rounded px-3 py-2" value={formik.values.password2} onChange={formik.handleChange} onBlur={formik.handleBlur} />
                  </>
                )}
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="bg-blue-700 text-white py-2 rounded hover:bg-blue-800 flex-1" disabled={formik.isSubmitting}>{formik.isSubmitting ? (editEmployee ? 'Saving...' : 'Adding...') : (editEmployee ? 'Save' : 'Add')}</button>
                  <button type="button" className="bg-gray-300 text-gray-700 py-2 rounded flex-1" onClick={() => { setShowModal(false); setEditEmployee(null); formik.resetForm(); }}>Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {formik.touched.username && formik.errors.username && (<div className="text-red-500 text-sm col-span-2">{formik.errors.username}</div>)}
                  {formik.touched.email && formik.errors.email && (<div className="text-red-500 text-sm col-span-2">{formik.errors.email}</div>)}
                  {formik.touched.password && formik.errors.password && (<div className="text-red-500 text-sm col-span-2">{formik.errors.password}</div>)}
                  {formik.touched.password2 && formik.errors.password2 && (<div className="text-red-500 text-sm col-span-2">{formik.errors.password2}</div>)}
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Current Employees</h2>
        {loading ? (
          <div>Loading...</div>
        ) : employees.length === 0 ? (
          <div className="text-gray-500">No employees found.</div>
        ) : (
          <table className="w-full border mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Username</th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-t">
                  <td className="py-2 px-4">{emp.username}</td>
                  <td className="py-2 px-4">{emp.email}</td>
                  <td className="py-2 px-4">
                    <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:underline mr-2">Edit</button>
                    <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement; 