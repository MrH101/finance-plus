import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import ProjectService, { Timesheet, TimesheetFormData, Project, ProjectTask } from '../services/projectService';
import { FiPlus, FiSearch, FiFilter, FiEdit3, FiTrash2, FiClock, FiUser, FiCalendar, FiCheckCircle, FiXCircle, FiDollarSign, FiBarChart2 } from 'react-icons/fi';

const TimesheetManagement: React.FC = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTimesheet, setEditTimesheet] = useState<Timesheet | null>(null);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterApproved, setFilterApproved] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const response = await ProjectService.getTimesheets({
        search,
        project: filterProject !== 'all' ? parseInt(filterProject) : undefined,
        employee: filterEmployee !== 'all' ? parseInt(filterEmployee) : undefined,
        is_approved: filterApproved !== 'all' ? filterApproved === 'approved' : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setTimesheets(response.results);
    } catch (err) {
      toast.error('Failed to load timesheets');
      console.error('Error fetching timesheets:', err);
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

  const fetchTasks = async (projectId?: number) => {
    try {
      const response = await ProjectService.getTasks({
        project: projectId,
      });
      setTasks(response.results);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    fetchProjects();
  }, [search, filterProject, filterEmployee, filterApproved, dateFrom, dateTo]);

  useEffect(() => {
    if (formik.values.project) {
      fetchTasks(formik.values.project);
    }
  }, [formik.values.project]);

  const formik = useFormik<TimesheetFormData>({
    initialValues: {
      project: 0,
      task: undefined,
      date: new Date().toISOString().split('T')[0],
      hours_worked: 0,
      start_time: '',
      end_time: '',
      description: '',
      activity_type: '',
    },
    validationSchema: Yup.object({
      project: Yup.number().required('Project is required').min(1, 'Please select a project'),
      date: Yup.date().required('Date is required'),
      hours_worked: Yup.number().required('Hours worked is required').min(0.1, 'Hours must be greater than 0'),
      description: Yup.string().required('Description is required'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        if (editTimesheet) {
          await ProjectService.updateTimesheet(editTimesheet.id, values);
          toast.success('Timesheet updated successfully!');
        } else {
          await ProjectService.createTimesheet(values);
          toast.success('Timesheet created successfully!');
        }
        resetForm();
        setShowModal(false);
        setEditTimesheet(null);
        await fetchTimesheets();
      } catch (err: any) {
        console.error('Error saving timesheet:', err);
        toast.error(err.response?.data?.message || 'Failed to save timesheet');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleEdit = (timesheet: Timesheet) => {
    setEditTimesheet(timesheet);
    formik.setValues({
      project: timesheet.project,
      task: timesheet.task,
      date: timesheet.date,
      hours_worked: timesheet.hours_worked,
      start_time: timesheet.start_time || '',
      end_time: timesheet.end_time || '',
      description: timesheet.description,
      activity_type: timesheet.activity_type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this timesheet? This action cannot be undone.')) {
      try {
        await ProjectService.deleteTimesheet(id);
        toast.success('Timesheet deleted successfully!');
        fetchTimesheets();
      } catch (err) {
        toast.error('Failed to delete timesheet');
        console.error('Error deleting timesheet:', err);
      }
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await ProjectService.approveTimesheet(id);
      toast.success('Timesheet approved successfully!');
      fetchTimesheets();
    } catch (err) {
      toast.error('Failed to approve timesheet');
      console.error('Error approving timesheet:', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await ProjectService.rejectTimesheet(id);
      toast.success('Timesheet rejected successfully!');
      fetchTimesheets();
    } catch (err) {
      toast.error('Failed to reject timesheet');
      console.error('Error rejecting timesheet:', err);
    }
  };

  const filteredTimesheets = timesheets.filter((timesheet) => {
    const matchesSearch = timesheet.description.toLowerCase().includes(search.toLowerCase()) ||
                         timesheet.employee_name.toLowerCase().includes(search.toLowerCase()) ||
                         timesheet.project_name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const sortedTimesheets = [...filteredTimesheets].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'employee':
        return a.employee_name.localeCompare(b.employee_name);
      case 'project':
        return a.project_name.localeCompare(b.project_name);
      case 'hours':
        return b.hours_worked - a.hours_worked;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalHours = timesheets.reduce((sum, t) => sum + t.hours_worked, 0);
  const totalAmount = timesheets.reduce((sum, t) => sum + t.total_amount, 0);
  const approvedTimesheets = timesheets.filter(t => t.is_approved).length;
  const pendingTimesheets = timesheets.filter(t => !t.is_approved).length;

  const calculateHoursFromTime = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    formik.setFieldValue(field, value);
    
    if (field === 'start_time' && formik.values.end_time) {
      const hours = calculateHoursFromTime(value, formik.values.end_time);
      formik.setFieldValue('hours_worked', hours);
    } else if (field === 'end_time' && formik.values.start_time) {
      const hours = calculateHoursFromTime(formik.values.start_time, value);
      formik.setFieldValue('hours_worked', hours);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheet Management</h1>
          <p className="text-gray-600">Track and manage employee time spent on projects and tasks.</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search timesheets..."
            className="flex-1 md:flex-none md:w-80 border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={() => {
              setEditTimesheet(null);
              formik.resetForm();
              formik.setFieldValue('date', new Date().toISOString().split('T')[0]);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FiPlus /> New Timesheet
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Hours</div>
              <div className="text-2xl font-semibold">{totalHours.toFixed(1)}</div>
            </div>
            <FiClock className="text-blue-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-semibold">${totalAmount.toFixed(2)}</div>
            </div>
            <FiDollarSign className="text-green-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Approved</div>
              <div className="text-2xl font-semibold">{approvedTimesheets}</div>
            </div>
            <FiCheckCircle className="text-green-500 text-xl" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-semibold">{pendingTimesheets}</div>
            </div>
            <FiBarChart2 className="text-yellow-500 text-xl" />
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
          value={filterApproved}
          onChange={(e) => setFilterApproved(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From Date"
          className="border border-gray-300 rounded-md px-3 py-2"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To Date"
          className="border border-gray-300 rounded-md px-3 py-2"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="date">Sort by Date</option>
          <option value="employee">Sort by Employee</option>
          <option value="project">Sort by Project</option>
          <option value="hours">Sort by Hours</option>
        </select>
      </div>

      {/* Timesheet Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {sortedTimesheets.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No timesheets found. Try adjusting your search or create a new timesheet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTimesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <FiUser className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{timesheet.employee_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {timesheet.project_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {timesheet.task_title || 'No specific task'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(timesheet.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {timesheet.hours_worked}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${timesheet.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          timesheet.is_approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {timesheet.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(timesheet)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          {!timesheet.is_approved && (
                            <>
                              <button
                                onClick={() => handleApprove(timesheet.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(timesheet.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(timesheet.id)}
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

      {/* Timesheet Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editTimesheet ? 'Edit Timesheet' : 'Create New Timesheet'}
            </h2>
            <form onSubmit={formik.handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    name="project"
                    value={formik.values.project}
                    onChange={(e) => {
                      formik.handleChange(e);
                      formik.setFieldValue('task', undefined);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value={0}>Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {formik.touched.project && formik.errors.project && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.project}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task
                  </label>
                  <select
                    name="task"
                    value={formik.values.task || ''}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={!formik.values.project}
                  >
                    <option value="">No specific task</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formik.values.date}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {formik.touched.date && formik.errors.date && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.date}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours Worked *
                  </label>
                  <input
                    type="number"
                    name="hours_worked"
                    value={formik.values.hours_worked}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                    min="0"
                    step="0.25"
                  />
                  {formik.touched.hours_worked && formik.errors.hours_worked && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.hours_worked}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={formik.values.start_time}
                    onChange={(e) => handleTimeChange('start_time', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={formik.values.end_time}
                    onChange={(e) => handleTimeChange('end_time', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Type
                  </label>
                  <input
                    type="text"
                    name="activity_type"
                    value={formik.values.activity_type}
                    onChange={formik.handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., Development, Testing, Meeting"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Describe what you worked on..."
                  />
                  {formik.touched.description && formik.errors.description && (
                    <div className="text-red-500 text-sm mt-1">{formik.errors.description}</div>
                  )}
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
                  {formik.isSubmitting ? 'Saving...' : (editTimesheet ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetManagement;

