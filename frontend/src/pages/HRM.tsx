import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
}
interface Department {
  id: number;
  name: string;
  head: string;
}
interface Attendance {
  id: number;
  employee: string;
  date: string;
  status: string;
}

const tabs = [
  { key: 'employees', label: 'Employees' },
  { key: 'departments', label: 'Departments' },
  { key: 'attendance', label: 'Attendance' },
];

const HRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [editAtt, setEditAtt] = useState<Attendance | null>(null);
  const [empForm, setEmpForm] = useState({ name: '', email: '', department: '', role: '' });
  const [deptForm, setDeptForm] = useState({ name: '', head: '' });
  const [attForm, setAttForm] = useState({ employee: '', date: '', status: '' });
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, attRes] = await Promise.all([
        api.get('/employees/'),
        api.get('/departments/'),
        api.get('/attendance/'),
      ]);
      setEmployees(empRes.data?.results || empRes.data || []);
      setDepartments(deptRes.data?.results || deptRes.data || []);
      setAttendance(attRes.data?.results || attRes.data || []);
    } catch (err) {
      toast.error('Failed to load HRM data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, []);

  // Employee CRUD
  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editEmp) {
        await api.put(`/employees/${editEmp.id}/`, empForm);
        toast.success('Employee updated!');
      } else {
        await api.post('/employees/', empForm);
        toast.success('Employee added!');
      }
      setShowEmpModal(false);
      setEditEmp(null);
      setEmpForm({ name: '', email: '', department: '', role: '' });
      fetchAll();
    } catch {
      toast.error('Failed to save employee');
    }
  };
  const handleEmpEdit = (emp: Employee) => {
    setEditEmp(emp);
    setEmpForm({ name: emp.name, email: emp.email, department: emp.department, role: emp.role });
    setShowEmpModal(true);
  };
  const handleEmpDelete = async (id: number) => {
    if (window.confirm('Delete this employee?')) {
      try {
        await api.delete(`/employees/${id}/`);
        toast.success('Employee deleted!');
        fetchAll();
      } catch {
        toast.error('Failed to delete employee');
      }
    }
  };

  // Department CRUD
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDept) {
        await api.put(`/departments/${editDept.id}/`, deptForm);
        toast.success('Department updated!');
      } else {
        await api.post('/departments/', deptForm);
        toast.success('Department added!');
      }
      setShowDeptModal(false);
      setEditDept(null);
      setDeptForm({ name: '', head: '' });
      fetchAll();
    } catch {
      toast.error('Failed to save department');
    }
  };
  const handleDeptEdit = (dept: Department) => {
    setEditDept(dept);
    setDeptForm({ name: dept.name, head: dept.head });
    setShowDeptModal(true);
  };
  const handleDeptDelete = async (id: number) => {
    if (window.confirm('Delete this department?')) {
      try {
        await api.delete(`/departments/${id}/`);
        toast.success('Department deleted!');
        fetchAll();
      } catch {
        toast.error('Failed to delete department');
      }
    }
  };

  // Attendance CRUD
  const handleAttSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editAtt) {
        await api.put(`/attendance/${editAtt.id}/`, attForm);
        toast.success('Attendance updated!');
      } else {
        await api.post('/attendance/', attForm);
        toast.success('Attendance added!');
      }
      setShowAttModal(false);
      setEditAtt(null);
      setAttForm({ employee: '', date: '', status: '' });
      fetchAll();
    } catch {
      toast.error('Failed to save attendance');
    }
  };
  const handleAttEdit = (att: Attendance) => {
    setEditAtt(att);
    setAttForm({ employee: att.employee, date: att.date, status: att.status });
    setShowAttModal(true);
  };
  const handleAttDelete = async (id: number) => {
    if (window.confirm('Delete this attendance record?')) {
      try {
        await api.delete(`/attendance/${id}/`);
        toast.success('Attendance deleted!');
        fetchAll();
      } catch {
        toast.error('Failed to delete attendance');
      }
    }
  };

  const isEmpty = (arr: any[]) => !loading && (!arr || arr.length === 0);

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Human Resource Management (HRM)</h2>
      <div className="mb-6 flex gap-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 ${activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Employees</h3>
            <button onClick={() => { setShowEmpModal(true); setEditEmp(null); setEmpForm({ name: '', email: '', department: '', role: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">+ Add Employee</button>
          </div>
          {loading ? (
            <Skeleton lines={6} />
          ) : isEmpty(employees) ? (
            <EmptyState title="No employees" description="Create your first employee to get started." />
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Department</th>
                  <th className="py-2 px-4 text-left">Role</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {employees.map(emp => (
                  <tr key={emp.id} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{emp.name}</td>
                    <td className="py-2 px-4">{emp.email}</td>
                    <td className="py-2 px-4">{emp.department}</td>
                    <td className="py-2 px-4">{emp.role}</td>
                    <td className="py-2 px-4">
                      <button onClick={() => handleEmpEdit(emp)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleEmpDelete(emp.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          {/* Add/Edit Employee Modal */}
          {showEmpModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-2">{editEmp ? 'Edit Employee' : 'Add Employee'}</h2>
                <form onSubmit={handleEmpSubmit} className="grid grid-cols-1 gap-4">
                  <input type="text" placeholder="Name" className="border rounded px-3 py-2" value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} />
                  <input type="email" placeholder="Email" className="border rounded px-3 py-2" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} />
                  <input type="text" placeholder="Department" className="border rounded px-3 py-2" value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} />
                  <input type="text" placeholder="Role" className="border rounded px-3 py-2" value={empForm.role} onChange={e => setEmpForm({ ...empForm, role: e.target.value })} />
                  <div className="flex gap-2 mt-2">
                    <button type="submit" className="bg-blue-700 text-white py-2 rounded hover:bg-blue-800 flex-1">{editEmp ? 'Save' : 'Add'}</button>
                    <button type="button" className="bg-gray-300 text-gray-700 py-2 rounded flex-1" onClick={() => { setShowEmpModal(false); setEditEmp(null); setEmpForm({ name: '', email: '', department: '', role: '' }); }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Departments</h3>
            <button onClick={() => { setShowDeptModal(true); setEditDept(null); setDeptForm({ name: '', head: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">+ Add Department</button>
          </div>
          {loading ? (
            <Skeleton lines={6} />
          ) : isEmpty(departments) ? (
            <EmptyState title="No departments" description="Create your first department to get started." />
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Head</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept.id} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{dept.name}</td>
                    <td className="py-2 px-4">{dept.head}</td>
                    <td className="py-2 px-4">
                      <button onClick={() => handleDeptEdit(dept)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDeptDelete(dept.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          {/* Add/Edit Department Modal */}
          {showDeptModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-2">{editDept ? 'Edit Department' : 'Add Department'}</h2>
                <form onSubmit={handleDeptSubmit} className="grid grid-cols-1 gap-4">
                  <input type="text" placeholder="Name" className="border rounded px-3 py-2" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} />
                  <input type="text" placeholder="Head" className="border rounded px-3 py-2" value={deptForm.head} onChange={e => setDeptForm({ ...deptForm, head: e.target.value })} />
                  <div className="flex gap-2 mt-2">
                    <button type="submit" className="bg-blue-700 text-white py-2 rounded hover:bg-blue-800 flex-1">{editDept ? 'Save' : 'Add'}</button>
                    <button type="button" className="bg-gray-300 text-gray-700 py-2 rounded flex-1" onClick={() => { setShowDeptModal(false); setEditDept(null); setDeptForm({ name: '', head: '' }); }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Attendance</h3>
            <button onClick={() => { setShowAttModal(true); setEditAtt(null); setAttForm({ employee: '', date: '', status: '' }); }} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">+ Add Attendance</button>
          </div>
          {loading ? (
            <Skeleton lines={6} />
          ) : isEmpty(attendance) ? (
            <EmptyState title="No attendance records" description="Create your first attendance record to get started." />
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-2 px-4 text-left">Employee</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(att => (
                  <tr key={att.id} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{att.employee}</td>
                    <td className="py-2 px-4">{att.date}</td>
                    <td className="py-2 px-4">{att.status}</td>
                    <td className="py-2 px-4">
                      <button onClick={() => handleAttEdit(att)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleAttDelete(att.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          {/* Add/Edit Attendance Modal */}
          {showAttModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-2">{editAtt ? 'Edit Attendance' : 'Add Attendance'}</h2>
                <form onSubmit={handleAttSubmit} className="grid grid-cols-1 gap-4">
                  <input type="text" placeholder="Employee" className="border rounded px-3 py-2" value={attForm.employee} onChange={e => setAttForm({ ...attForm, employee: e.target.value })} />
                  <input type="date" placeholder="Date" className="border rounded px-3 py-2" value={attForm.date} onChange={e => setAttForm({ ...attForm, date: e.target.value })} />
                  <input type="text" placeholder="Status" className="border rounded px-3 py-2" value={attForm.status} onChange={e => setAttForm({ ...attForm, status: e.target.value })} />
                  <div className="flex gap-2 mt-2">
                    <button type="submit" className="bg-blue-700 text-white py-2 rounded hover:bg-blue-800 flex-1">{editAtt ? 'Save' : 'Add'}</button>
                    <button type="button" className="bg-gray-300 text-gray-700 py-2 rounded flex-1" onClick={() => { setShowAttModal(false); setEditAtt(null); setAttForm({ employee: '', date: '', status: '' }); }}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HRM; 