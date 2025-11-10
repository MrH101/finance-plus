import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  project_type_display: string;
  status: string;
  status_display: string;
  start_date: string;
  end_date: string;
  budget: number;
  actual_cost: number;
  progress: number;
  project_manager_name: string;
  customer_name: string;
  created_at: string;
  updated_at: string;
}

interface ProjectTask {
  id: number;
  project: number;
  title: string;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  assigned_to_name: string;
  start_date: string;
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

interface ProjectExpense {
  id: number;
  project: number;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  approved_by_name: string;
  created_at: string;
}

const ProjectManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const tabs = [
    { key: 'projects', label: 'Projects' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'projects':
          const projectsResponse = await api.get('/projects/');
          setProjects(projectsResponse.data);
          break;
        case 'tasks':
          const tasksResponse = await api.get('/project-tasks/');
          setProjectTasks(tasksResponse.data);
          break;
        case 'expenses':
          const expensesResponse = await api.get('/project-expenses/');
          setProjectExpenses(expensesResponse.data);
          break;
      }
      // Fetch users and customers for dropdowns
      const usersResponse = await api.get('/users/');
      setUsers(usersResponse.data);
      const customersResponse = await api.get('/customers/');
      setCustomers(customersResponse.data);
    } catch (error) {
      toast.error('Failed to load project data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      switch (modalType) {
        case 'project':
          if (formData.id) {
            await api.put(`/projects/${formData.id}/`, formData);
            toast.success('Project updated!');
          } else {
            await api.post('/projects/', formData);
            toast.success('Project added!');
          }
          break;
        case 'task':
          if (formData.id) {
            await api.put(`/project-tasks/${formData.id}/`, formData);
            toast.success('Task updated!');
          } else {
            await api.post('/project-tasks/', formData);
            toast.success('Task added!');
          }
          break;
        case 'expense':
          if (formData.id) {
            await api.put(`/project-expenses/${formData.id}/`, formData);
            toast.success('Expense updated!');
          } else {
            await api.post('/project-expenses/', formData);
            toast.success('Expense added!');
          }
          break;
      }
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (error) {
      toast.error('Failed to save record');
      console.error('Error creating record:', error);
    } finally {
      setLoading(false);
    }
  };

  // Edit/Delete handlers
  const handleEdit = (type: string, item: any) => {
    setModalType(type);
    setFormData(item);
    setShowModal(true);
  };
  const handleDelete = async (type: string, id: number) => {
    if (window.confirm('Delete this record?')) {
      try {
        let url = '';
        if (type === 'project') url = `/projects/${id}/`;
        if (type === 'task') url = `/project-tasks/${id}/`;
        if (type === 'expense') url = `/project-expenses/${id}/`;
        await api.delete(url);
        toast.success('Record deleted!');
        fetchData();
      } catch {
        toast.error('Failed to delete record');
      }
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
    setFormData({});
  };

  const renderProjects = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Projects</h3>
        <button 
          onClick={() => openModal('project')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Add Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <div key={project.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{project.name}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                project.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                project.status === 'ON_HOLD' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {project.status_display}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{project.description}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Type: <span className="font-semibold">{project.project_type_display}</span></p>
              <p className="text-sm">Manager: <span className="font-semibold">{project.project_manager_name || 'Unassigned'}</span></p>
              <p className="text-sm">Progress: <span className="font-semibold">{project.progress}%</span></p>
              <p className="text-sm">Budget: <span className="font-semibold text-green-600">${project.budget?.toLocaleString() || '0'}</span></p>
              <p className="text-sm">Actual Cost: <span className="font-semibold text-red-600">${project.actual_cost?.toLocaleString() || '0'}</span></p>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit('project', project)} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete('project', project.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Project Tasks</h3>
        <button 
          onClick={() => openModal('task')}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + Add Task
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectTasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{task.title}</h4>
              <div className="flex flex-col gap-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                  task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                  task.status === 'REVIEW' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status_display}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                  task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority_display}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Assigned to: <span className="font-semibold">{task.assigned_to_name || 'Unassigned'}</span></p>
              <p className="text-sm">Progress: <span className="font-semibold">{task.progress}%</span></p>
              <p className="text-sm">Estimated: <span className="font-semibold">{task.estimated_hours}h</span></p>
              <p className="text-sm">Actual: <span className="font-semibold">{task.actual_hours}h</span></p>
              {task.due_date && (
                <p className="text-sm">Due: <span className="font-semibold">{new Date(task.due_date).toLocaleDateString()}</span></p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Created: {new Date(task.created_at).toLocaleDateString()}
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleEdit('task', task)} className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete('task', task.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Project Expenses</h3>
        <button 
          onClick={() => openModal('expense')}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          + Add Expense
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Description</th>
              <th className="py-2 px-4 text-left">Amount</th>
              <th className="py-2 px-4 text-left">Category</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Approved By</th>
              <th className="py-2 px-4 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {projectExpenses.map(expense => (
              <tr key={expense.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{expense.description}</td>
                <td className="py-2 px-4 font-semibold text-red-600">${expense.amount.toLocaleString()}</td>
                <td className="py-2 px-4">{expense.category}</td>
                <td className="py-2 px-4">{new Date(expense.expense_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{expense.approved_by_name || 'Pending'}</td>
                <td className="py-2 px-4">{new Date(expense.created_at).toLocaleDateString()}</td>
                <td className="py-2 px-4">
                  <button onClick={() => handleEdit('expense', expense)} className="text-blue-600 hover:underline mr-2">Edit</button>
                  <button onClick={() => handleDelete('expense', expense.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Project Dashboard</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Projects</h5>
          <p className="text-2xl font-bold text-blue-600">{projects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Active Projects</h5>
          <p className="text-2xl font-bold text-yellow-600">
            {projects.filter(p => p.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Tasks</h5>
          <p className="text-2xl font-bold text-green-600">{projectTasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Expenses</h5>
          <p className="text-2xl font-bold text-red-600">
            ${projectExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-4">Project Status</h5>
          <div className="space-y-2">
            {['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map(status => {
              const count = projects.filter(p => p.status === status).length;
              return (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm">{status}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-4">Task Status</h5>
          <div className="space-y-2">
            {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(status => {
              const count = projectTasks.filter(t => t.status === status).length;
              return (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm">{status}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const getModalTitle = () => {
      switch (modalType) {
        case 'project': return 'Add Project';
        case 'task': return 'Add Task';
        case 'expense': return 'Add Expense';
        default: return 'Add Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'project':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Project Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.project_type || ''}
                onChange={(e) => setFormData({...formData, project_type: e.target.value})}
              >
                <option value="">Select Project Type</option>
                <option value="INTERNAL">Internal</option>
                <option value="CLIENT">Client Project</option>
                <option value="RESEARCH">Research & Development</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.project_manager || ''}
                onChange={(e) => setFormData({...formData, project_manager: parseInt(e.target.value)})}
              >
                <option value="">Select Project Manager</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                ))}
              </select>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.customer || ''}
                onChange={(e) => setFormData({...formData, customer: parseInt(e.target.value)})}
              >
                <option value="">Select Customer (Optional)</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Start Date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="End Date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Budget"
                value={formData.budget || ''}
                onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
              />
            </>
          );
        case 'task':
          return (
            <>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.project || ''}
                onChange={(e) => setFormData({...formData, project: parseInt(e.target.value)})}
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Task Title"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.priority || ''}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="">Select Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.assigned_to || ''}
                onChange={(e) => setFormData({...formData, assigned_to: parseInt(e.target.value)})}
              >
                <option value="">Select Assignee</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                ))}
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Start Date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Due Date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                step="0.5"
                placeholder="Estimated Hours"
                value={formData.estimated_hours || ''}
                onChange={(e) => setFormData({...formData, estimated_hours: parseFloat(e.target.value)})}
              />
            </>
          );
        case 'expense':
          return (
            <>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.project || ''}
                onChange={(e) => setFormData({...formData, project: parseInt(e.target.value)})}
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                step="0.01"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Category"
                value={formData.category || ''}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Expense Date"
                value={formData.expense_date || ''}
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
              />
            </>
          );
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h4 className="text-lg font-bold mb-4">{getModalTitle()}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            {getModalFields()}
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="px-4 py-2 rounded bg-gray-200" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-blue-600 text-white"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Project Management</h2>
      
      <div className="mb-6 flex gap-4 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'expenses' && renderExpenses()}
          {activeTab === 'dashboard' && renderDashboard()}
        </>
      )}

      {renderModal()}
    </div>
  );
};

export default ProjectManagement; 