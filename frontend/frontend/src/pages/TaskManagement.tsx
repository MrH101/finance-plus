import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import ProjectService, { ProjectTask, TaskFormData, Project } from '../services/projectService';
import { FiPlus, FiSearch, FiFilter, FiEye, FiEdit3, FiTrash2, FiUser, FiClock, FiCalendar, FiTarget, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<ProjectTask | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await ProjectService.getTasks({
        search,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        project: filterProject !== 'all' ? parseInt(filterProject) : undefined,
      });
      setTasks(response.results);
    } catch (err) {
      toast.error('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await ProjectService.getProjects();
      setProjects(response.results);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [search, filterStatus, filterPriority, filterProject]);

  const formik = useFormik<TaskFormData>({
    initialValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      estimated_hours: 0,
      due_date: '',
      assigned_to: undefined,
      parent_task: undefined,
      tags: [],
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Task title is required'),
      description: Yup.string().required('Description is required'),
      estimated_hours: Yup.number().min(0, 'Hours must be positive'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        if (editTask) {
          await ProjectService.updateTask(editTask.id, values);
          toast.success('Task updated successfully!');
        } else {
          await ProjectService.createTask(values);
          toast.success('Task created successfully!');
        }
        resetForm();
        setShowModal(false);
        setEditTask(null);
        await fetchTasks();
      } catch (err: any) {
        console.error('Error saving task:', err);
        toast.error(err.response?.data?.message || 'Failed to save task');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (task: ProjectTask) => {
    setEditTask(task);
    formik.setValues({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      due_date: task.due_date || '',
      assigned_to: task.assigned_to,
      parent_task: task.parent_task,
      tags: task.tags,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        await ProjectService.deleteTask(id);
        toast.success('Task deleted successfully!');
        fetchTasks();
      } catch (err) {
        toast.error('Failed to delete task');
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await ProjectService.updateTaskStatus(id, status);
      toast.success('Task status updated successfully!');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update task status');
      console.error('Error updating status:', err);
    }
  };

  const handleAssignTask = async (id: number, userId: number) => {
    try {
      await ProjectService.assignTask(id, userId);
      toast.success('Task assigned successfully!');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to assign task');
      console.error('Error assigning task:', err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
                         task.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesProject = filterProject === 'all' || task.project === parseInt(filterProject);
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'due_date':
        return new Date(a.due_date || '').getTime() - new Date(b.due_date || '').getTime();
      case 'priority':
        const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    const statusConfig = ProjectService.getTaskStatuses().find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = ProjectService.getPriorities().find(p => p.value === priority);
    return priorityConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(filterStatus);
  };

  const getKanbanColumns = () => {
    const columns = ProjectService.getTaskStatuses();
    return columns.map(column => ({
      ...column,
      tasks: sortedTasks.filter(task => task.status === column.value)
    }));
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').count;
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date)).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Manage project tasks with Kanban boards and detailed tracking.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 md:flex-none md:w-80 border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            {viewMode === 'list' ? 'Kanban View' : 'List View'}
          </button>
          <button
            onClick={() => {
              setEditTask(null);
              formik.resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FiPlus /> New Task
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Tasks</div>
              <div className="text-2xl font-semibold">{totalTasks}</div>
            </div>
            <FiTarget className="text-blue-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-semibold">{completedTasks}</div>
            </div>
            <FiCheckCircle className="text-green-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">In Progress</div>
              <div className="text-2xl font-semibold">{inProgressTasks}</div>
            </div>
            <FiClock className="text-yellow-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Overdue</div>
              <div className="text-2xl font-semibold">{overdueTasks}</div>
            </div>
            <FiAlertCircle className="text-red-500 text-xl" />
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Statuses</option>
          {ProjectService.getTaskStatuses().map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Priorities</option>
          {ProjectService.getPriorities().map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="created_at">Sort by Date Created</option>
          <option value="title">Sort by Title</option>
          <option value="due_date">Sort by Due Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Task Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {getKanbanColumns().map((column) => (
            <div key={column.value} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.label}</h3>
                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                  {column.tasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Edit"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority_display}
                      </span>
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${
                          isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          <FiCalendar />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {task.assigned_to_name && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <FiUser />
                        {task.assigned_to_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {sortedTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No tasks found. Try adjusting your search or create a new task.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">{task.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {projects.find(p => p.id === task.project)?.name || 'Unknown Project'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.assigned_to_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.due_date ? (
                          <span className={isOverdue(task.due_date) ? 'text-red-600' : ''}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        ) : (
                          'No due date'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(task)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <form onSubmit={formik.handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter task title"
                  />
                  {formik.touched.title && formik.errors.title && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.title}</div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter task description"
                  />
                  {formik.touched.description && formik.errors.description && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.description}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formik.values.priority}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {ProjectService.getPriorities().map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    name="estimated_hours"
                    value={formik.values.estimated_hours}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                  {formik.touched.estimated_hours && formik.errors.estimated_hours && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.estimated_hours}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formik.values.due_date}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <select
                    name="assigned_to"
                    value={formik.values.assigned_to || ''}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Unassigned</option>
                    {/* Add user options here */}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
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
                  {formik.isSubmitting ? 'Saving...' : (editTask ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;

