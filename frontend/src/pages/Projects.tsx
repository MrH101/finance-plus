import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface Project {
  id: number;
  name: string;
  manager: string;
  deadline: string;
  completed?: string;
}
interface Task {
  id: number;
  task: string;
  assignee: string;
  status: string;
}

const tabs = [
  { key: 'active', label: 'Active Projects' },
  { key: 'completed', label: 'Completed Projects' },
  { key: 'tasks', label: 'Tasks' },
];

const Projects: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [projRes, compRes, taskRes] = await Promise.all([
        api.get('/projects/?status=active'),
        api.get('/projects/?status=completed'),
        api.get('/project-tasks/'),
      ]);
      const projData = projRes.data?.results ?? projRes.data ?? [];
      const compData = compRes.data?.results ?? compRes.data ?? [];
      const taskData = taskRes.data?.results ?? taskRes.data ?? [];
      setProjects(Array.isArray(projData) ? projData : []);
      setCompletedProjects(Array.isArray(compData) ? compData : []);
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, []);

  // Project CRUD
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/projects/${editItem.id}/`, form);
        toast.success('Project updated!');
      } else {
        await api.post('/projects/', form);
        toast.success('Project added!');
      }
      setShowModal(false);
      setEditItem(null);
      setForm({});
      fetchAll();
    } catch {
      toast.error('Failed to save project');
    }
  };
  const handleProjectEdit = (proj: Project) => {
    setEditItem(proj);
    setForm({ name: proj.name, manager: proj.manager, deadline: proj.deadline });
    setModalType('project');
    setShowModal(true);
  };
  const handleProjectDelete = async (id: number) => {
    if (window.confirm('Delete this project?')) {
      try {
        await api.delete(`/projects/${id}/`);
        toast.success('Project deleted!');
        fetchAll();
      } catch {
        toast.error('Failed to delete project');
      }
    }
  };

  // Task CRUD
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/project-tasks/${editItem.id}/`, form);
        toast.success('Task updated!');
      } else {
        await api.post('/project-tasks/', form);
        toast.success('Task added!');
      }
      setShowModal(false);
      setEditItem(null);
      setForm({});
      fetchAll();
    } catch {
      toast.error('Failed to save task');
    }
  };
  const handleTaskEdit = (task: Task) => {
    setEditItem(task);
    setForm({ task: task.task, assignee: task.assignee, status: task.status });
    setModalType('task');
    setShowModal(true);
  };
  const handleTaskDelete = async (id: number) => {
    if (window.confirm('Delete this task?')) {
      try {
        await api.delete(`/project-tasks/${id}/`);
        toast.success('Task deleted!');
        fetchAll();
      } catch {
        toast.error('Failed to delete task');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-teal-700">Projects</h2>
      <div className="mb-6 flex gap-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 ${activeTab === tab.key ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-teal-600'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Active Projects Tab */}
      {activeTab === 'active' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Active Projects</h3>
            <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded shadow hover:bg-teal-700 transition">+ Add Project</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-teal-50">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Manager</th>
                  <th className="py-2 px-4 text-left">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(proj => (
                  <tr key={proj.id} className="border-b hover:bg-teal-50">
                    <td className="py-2 px-4">{proj.name}</td>
                    <td className="py-2 px-4">{proj.manager}</td>
                    <td className="py-2 px-4">{proj.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Add Project Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h4 className="text-lg font-bold mb-4">Add Project</h4>
                <form className="space-y-4">
                  <input className="w-full border rounded px-3 py-2" placeholder="Name" />
                  <input className="w-full border rounded px-3 py-2" placeholder="Manager" />
                  <input className="w-full border rounded px-3 py-2" placeholder="Deadline" />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded bg-teal-600 text-white">Add</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Completed Projects Tab */}
      {activeTab === 'completed' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Completed Projects</h3>
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">+ Add Completed</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Manager</th>
                  <th className="py-2 px-4 text-left">Completed</th>
                </tr>
              </thead>
              <tbody>
                {completedProjects.map(proj => (
                  <tr key={proj.id} className="border-b hover:bg-gray-100">
                    <td className="py-2 px-4">{proj.name}</td>
                    <td className="py-2 px-4">{proj.manager}</td>
                    <td className="py-2 px-4">{proj.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Add Completed Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h4 className="text-lg font-bold mb-4">Add Completed Project</h4>
                <form className="space-y-4">
                  <input className="w-full border rounded px-3 py-2" placeholder="Name" />
                  <input className="w-full border rounded px-3 py-2" placeholder="Manager" />
                  <input className="w-full border rounded px-3 py-2" placeholder="Completed" />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">Add</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Tasks</h3>
            <button onClick={() => setShowModal(true)} className="bg-yellow-600 text-white px-4 py-2 rounded shadow hover:bg-yellow-700 transition">+ Add Task</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-yellow-50">
                  <th className="py-2 px-4 text-left">Task</th>
                  <th className="py-2 px-4 text-left">Assignee</th>
                  <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b hover:bg-yellow-50">
                    <td className="py-2 px-4">{task.task}</td>
                    <td className="py-2 px-4">{task.assignee}</td>
                    <td className="py-2 px-4">{task.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Add Task Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h4 className="text-lg font-bold mb-4">Add Task</h4>
                <form className="space-y-4">
                  <input className="w-full border rounded px-3 py-2" placeholder="Task" />
                  <input className="w-full border rounded px-3 py-2" placeholder="Assignee" />
                  <input className="w-full border rounded px-3 py-2" placeholder="Status" />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded bg-yellow-600 text-white">Add</button>
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

export default Projects; 