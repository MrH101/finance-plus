import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import HRService from '../services/hrService';
import { FiUsers, FiTrendingUp, FiDollarSign, FiCalendar, FiBarChart2, FiFilter, FiDownload, FiEye, FiEdit3, FiTrash2, FiPlus, FiSearch, FiClock, FiTarget, FiAward } from 'react-icons/fi';

interface Department {
  id: number;
  name: string;
  cost_center: string;
  manager?: {
    id: number;
    name: string;
    position: string;
  };
  modules?: Module[];
  employee_count?: number;
  budget?: number;
  actual_spending?: number;
  performance_score?: number;
  projects_count?: number;
  created_at?: string;
}

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  performance_rating?: number;
  salary?: number;
  join_date?: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface Module {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface DepartmentAnalytics {
  total_employees: number;
  average_salary: number;
  turnover_rate: number;
  performance_trend: number;
  budget_utilization: number;
  project_completion_rate: number;
}

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<DepartmentAnalytics | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [departmentEmployees, setDepartmentEmployees] = useState<Employee[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [departmentsRes, employeesRes, modulesRes] = await Promise.all([
        HRService.getDepartments(),
        HRService.getPotentialManagers(),
        HRService.getModules()
      ]);
      
      const departmentsData = Array.isArray(departmentsRes) ? departmentsRes : (departmentsRes as any)?.results || [];
      const employeesData = Array.isArray(employeesRes) ? employeesRes : (employeesRes as any)?.results || [];
      const modulesData = Array.isArray(modulesRes) ? modulesRes : (modulesRes as any)?.results || [];
      
      setDepartments(departmentsData);
      setEmployees(employeesData);
      setModules(modulesData);
      
      // Fetch analytics data
      const analyticsData = await fetchAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      toast.error('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (): Promise<DepartmentAnalytics> => {
    // Mock analytics data - in real implementation, this would come from API
    return {
      total_employees: 45,
      average_salary: 65000,
      turnover_rate: 8.5,
      performance_trend: 12.3,
      budget_utilization: 87.2,
      project_completion_rate: 94.1
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: '',
      cost_center: '',
      manager_id: null as number | null,
      module_ids: [] as number[],
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Department name is required'),
      cost_center: Yup.string().required('Cost center is required'),
      manager_id: Yup.number().nullable(),
      module_ids: Yup.array().of(Yup.number()),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      // Optimistic create/update
      const prev = [...departments];
      try {
        if (editDepartment) {
          const updated: Department = {
            ...editDepartment,
            name: values.name,
            cost_center: values.cost_center,
            manager: values.manager_id ? employees.find(e => e.id === values.manager_id) ? { id: values.manager_id!, name: employees.find(e => e.id === values.manager_id)!.name, position: employees.find(e => e.id === values.manager_id)!.position } : undefined : undefined,
            modules: modules.filter(m => values.module_ids.includes(m.id))
          } as any;
          setDepartments((cur) => cur.map((d) => (d.id === updated.id ? updated : d)));
          await HRService.updateDepartment(editDepartment.id, values);
          toast.success('Department updated successfully!');
        } else {
          const tempId = Math.random();
          const optimistic: Department = {
            id: tempId as any,
            name: values.name,
            cost_center: values.cost_center,
            manager: undefined,
            modules: modules.filter(m => values.module_ids.includes(m.id)),
          };
          setDepartments((cur) => [optimistic, ...cur]);
          const created = await HRService.createDepartment(values);
          setDepartments((cur) => cur.map((d) => (d.id === tempId ? created : d)) as any);
          toast.success('Department created successfully!');
        }
        resetForm();
        setShowModal(false);
        setEditDepartment(null);
      } catch (err: any) {
        setDepartments(prev);
        console.error('Error saving department:', err);
        toast.error(err.response?.data?.message || 'Failed to save department');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (department: Department) => {
    setEditDepartment(department);
    formik.setValues({
      name: department.name,
      cost_center: department.cost_center,
      manager_id: department.manager?.id || null,
      module_ids: department.modules?.map((m: Module) => m.id) || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      const prev = [...departments];
      setDepartments((cur) => cur.filter((d) => d.id !== id));
      try {
        await HRService.deleteDepartment(id);
        toast.success('Department deleted successfully!');
      } catch (err) {
        setDepartments(prev);
        toast.error('Failed to delete department');
        console.error('Error deleting department:', err);
      }
    }
  };

  const handleAssignManager = async (departmentId: number, employeeId: number) => {
    const prev = [...departments];
    const employee = employees.find(e => e.id === employeeId);
    setDepartments((cur) => cur.map((d) => d.id === departmentId ? { ...d, manager: employee ? { id: employeeId, name: employee.name, position: employee.position } : undefined } : d));
    try {
      await HRService.assignDepartmentManager(departmentId, employeeId);
      toast.success('Manager assigned successfully!');
      setShowManagerModal(false);
      setSelectedDepartment(null);
    } catch (err) {
      setDepartments(prev);
      toast.error('Failed to assign manager');
      console.error('Error assigning manager:', err);
    }
  };

  const openManagerModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowManagerModal(true);
  };

  const openEmployeeModal = async (department: Department) => {
    setSelectedDepartment(department);
    // Fetch employees for this department
    try {
      const deptEmployees = employees.filter(emp => emp.department === department.name);
      setDepartmentEmployees(deptEmployees);
      setShowEmployeeModal(true);
    } catch (err) {
      toast.error('Failed to load department employees');
    }
  };

  const filteredDepartments = departments.filter((d) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.cost_center.toLowerCase().includes(q) ||
      (d.manager?.name || '').toLowerCase().includes(q)
    );
  });

  const sortedDepartments = [...filteredDepartments].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'employees':
        return (b.employee_count || 0) - (a.employee_count || 0);
      case 'budget':
        return (b.budget || 0) - (a.budget || 0);
      case 'performance':
        return (b.performance_score || 0) - (a.performance_score || 0);
      default:
        return 0;
    }
  });

  const totalDepartments = departments.length;
  const withoutManager = departments.filter((d) => !d.manager).length;
  const totalEmployees = departments.reduce((sum, d) => sum + (d.employee_count || 0), 0);
  const totalBudget = departments.reduce((sum, d) => sum + (d.budget || 0), 0);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: FiBarChart2 },
    { key: 'analytics', label: 'Analytics', icon: FiTrendingUp },
    { key: 'employees', label: 'Employees', icon: FiUsers },
    { key: 'budget', label: 'Budget', icon: FiDollarSign },
    { key: 'performance', label: 'Performance', icon: FiTarget },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Comprehensive department management with analytics and performance tracking.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments..."
            className="flex-1 md:flex-none md:w-80 border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={() => {
              setEditDepartment(null);
              formik.resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FiPlus /> Add Department
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Departments</div>
              <div className="text-2xl font-semibold">{totalDepartments}</div>
            </div>
            <FiUsers className="text-blue-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Employees</div>
              <div className="text-2xl font-semibold">{totalEmployees}</div>
            </div>
            <FiUsers className="text-green-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Budget</div>
              <div className="text-2xl font-semibold">{Number.isFinite(totalBudget) ? `$${totalBudget.toLocaleString()}` : '—'}</div>
            </div>
            <FiDollarSign className="text-yellow-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Avg Performance</div>
              <div className="text-2xl font-semibold">—</div>
            </div>
            <FiTarget className="text-purple-500 text-xl" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Filters and Sorting */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="name">Sort by Name</option>
              <option value="employees">Sort by Employees</option>
              <option value="budget">Sort by Budget</option>
              <option value="performance">Sort by Performance</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Departments</option>
              <option value="with-manager">With Manager</option>
              <option value="without-manager">Without Manager</option>
            </select>
          </div>

          {/* Department Cards */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : sortedDepartments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
              No departments found. Try adjusting your search or add a new department.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedDepartments.map((department) => (
                <div key={department.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                      <p className="text-sm text-gray-600">Cost Center: {department.cost_center}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiUsers /> {department.employee_count || 0} employees
                        </span>
                        <span className="flex items-center gap-1">
                          <FiDollarSign /> ${(department.budget || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEmployeeModal(department)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="View Employees"
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => handleEdit(department)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Edit"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        onClick={() => handleDelete(department.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Manager</h4>
                    {department.manager ? (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="font-medium">{department.manager.name}</p>
                        <p className="text-sm text-gray-600">{department.manager.position}</p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded p-3">
                        <p className="text-sm text-yellow-700">No manager assigned</p>
                      </div>
                    )}
                  </div>

                  {/* Performance Metrics */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Performance</span>
                      <span className="text-sm font-semibold text-green-600">{department.performance_score || 85}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${department.performance_score || 85}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openManagerModal(department)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition text-sm"
                    >
                      {department.manager ? 'Change Manager' : 'Assign Manager'}
                    </button>
                    <button
                      onClick={() => setShowAnalytics(true)}
                      className="bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition text-sm"
                      title="View Analytics"
                    >
                      <FiBarChart2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Department Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Average Salary</span>
                <span className="font-semibold">${analytics.average_salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Turnover Rate</span>
                <span className="font-semibold">{analytics.turnover_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Performance Trend</span>
                <span className="font-semibold text-green-600">+{analytics.performance_trend}%</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Budget & Projects</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Budget Utilization</span>
                <span className="font-semibold">{analytics.budget_utilization}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Project Completion</span>
                <span className="font-semibold">{analytics.project_completion_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editDepartment ? 'Edit Department' : 'Add New Department'}
            </h2>
            <form onSubmit={formik.handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., IT Department"
                />
                {formik.touched.name && formik.errors.name && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.name}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Center
                </label>
                <input
                  type="text"
                  name="cost_center"
                  value={formik.values.cost_center}
                  onChange={formik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., IT001"
                />
                {formik.touched.cost_center && formik.errors.cost_center && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.cost_center}</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager
                </label>
                <select
                  name="manager_id"
                  value={formik.values.manager_id || ''}
                  onChange={formik.handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select a manager (optional)</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.user?.first_name} {employee.user?.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modules
                </label>
                <select
                  name="module_ids"
                  multiple
                  value={formik.values.module_ids.map(String)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                    formik.setFieldValue('module_ids', values);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple modules</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {formik.isSubmitting ? 'Saving...' : (editDepartment ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Assignment Modal */}
      {showManagerModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Assign Manager to {selectedDepartment.name}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Manager
              </label>
              <select
                id="manager-select"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select an employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position} ({employee.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowManagerModal(false);
                  setSelectedDepartment(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const select = document.getElementById('manager-select') as HTMLSelectElement;
                  const employeeId = parseInt(select.value);
                  if (employeeId) {
                    handleAssignManager(selectedDepartment.id, employeeId);
                  } else {
                    toast.error('Please select an employee');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Assign Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee List Modal */}
      {showEmployeeModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Employees in {selectedDepartment.name}
              </h2>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Join Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departmentEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${(employee.salary || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (employee.performance_rating || 0) >= 80 ? 'bg-green-100 text-green-800' :
                          (employee.performance_rating || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {employee.performance_rating || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement; 