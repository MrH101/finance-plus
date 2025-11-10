import React, { useState, useEffect } from 'react';

interface MaintenanceSchedule {
  id: number;
  asset_name: string;
  maintenance_type: string;
  maintenance_type_display: string;
  frequency: string;
  frequency_display: string;
  last_maintenance: string;
  next_maintenance: string;
  is_active: boolean;
  description: string;
  created_at: string;
}

interface MaintenanceRequest {
  id: number;
  asset_name: string;
  title: string;
  description: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  requested_by_name: string;
  assigned_to_name: string;
  requested_date: string;
  completed_date: string;
  estimated_cost: number;
  actual_cost: number;
  created_at: string;
}

interface AssetMaintenance {
  id: number;
  asset_name: string;
  maintenance_type: string;
  maintenance_type_display: string;
  description: string;
  scheduled_date: string;
  completed_date: string;
  cost: number;
  performed_by_name: string;
  status: string;
  status_display: string;
  notes: string;
  created_at: string;
}

const MaintenanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedules');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [assetMaintenance, setAssetMaintenance] = useState<AssetMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { key: 'schedules', label: 'Maintenance Schedules' },
    { key: 'requests', label: 'Maintenance Requests' },
    { key: 'maintenance', label: 'Asset Maintenance' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, requestsRes, maintenanceRes] = await Promise.all([
        fetch('/api/maintenance-schedules/'),
        fetch('/api/maintenance-requests/'),
        fetch('/api/asset-maintenance/')
      ]);

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setMaintenanceSchedules(schedulesData);
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setMaintenanceRequests(requestsData);
      }

      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json();
        setAssetMaintenance(maintenanceData);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      const endpoint = modalType === 'schedule' ? '/api/maintenance-schedules/' :
                      modalType === 'request' ? '/api/maintenance-requests/' :
                      '/api/asset-maintenance/';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating maintenance record:', error);
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
  };

  const renderSchedules = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Maintenance Schedules</h3>
        <button 
          onClick={() => openModal('schedule')} 
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
        >
          + New Schedule
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-indigo-50">
              <th className="py-2 px-4 text-left">Asset</th>
              <th className="py-2 px-4 text-left">Maintenance Type</th>
              <th className="py-2 px-4 text-left">Frequency</th>
              <th className="py-2 px-4 text-left">Last Maintenance</th>
              <th className="py-2 px-4 text-left">Next Maintenance</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceSchedules.map(schedule => (
              <tr key={schedule.id} className="border-b hover:bg-indigo-50">
                <td className="py-2 px-4">{schedule.asset_name}</td>
                <td className="py-2 px-4">{schedule.maintenance_type_display}</td>
                <td className="py-2 px-4">{schedule.frequency_display}</td>
                <td className="py-2 px-4">
                  {schedule.last_maintenance ? new Date(schedule.last_maintenance).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-2 px-4">{new Date(schedule.next_maintenance).toLocaleDateString()}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {schedule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Maintenance Requests</h3>
        <button 
          onClick={() => openModal('request')} 
          className="bg-orange-600 text-white px-4 py-2 rounded shadow hover:bg-orange-700 transition"
        >
          + New Request
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-orange-50">
              <th className="py-2 px-4 text-left">Asset</th>
              <th className="py-2 px-4 text-left">Title</th>
              <th className="py-2 px-4 text-left">Priority</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Requested By</th>
              <th className="py-2 px-4 text-left">Assigned To</th>
              <th className="py-2 px-4 text-left">Requested Date</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRequests.map(request => (
              <tr key={request.id} className="border-b hover:bg-orange-50">
                <td className="py-2 px-4">{request.asset_name}</td>
                <td className="py-2 px-4">{request.title}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    request.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    request.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {request.priority_display}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status_display}
                  </span>
                </td>
                <td className="py-2 px-4">{request.requested_by_name}</td>
                <td className="py-2 px-4">{request.assigned_to_name || 'Unassigned'}</td>
                <td className="py-2 px-4">{new Date(request.requested_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMaintenance = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Asset Maintenance Records</h3>
        <button 
          onClick={() => openModal('maintenance')} 
          className="bg-teal-600 text-white px-4 py-2 rounded shadow hover:bg-teal-700 transition"
        >
          + New Maintenance
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-teal-50">
              <th className="py-2 px-4 text-left">Asset</th>
              <th className="py-2 px-4 text-left">Maintenance Type</th>
              <th className="py-2 px-4 text-left">Scheduled Date</th>
              <th className="py-2 px-4 text-left">Completed Date</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Cost</th>
              <th className="py-2 px-4 text-left">Performed By</th>
            </tr>
          </thead>
          <tbody>
            {assetMaintenance.map(maintenance => (
              <tr key={maintenance.id} className="border-b hover:bg-teal-50">
                <td className="py-2 px-4">{maintenance.asset_name}</td>
                <td className="py-2 px-4">{maintenance.maintenance_type_display}</td>
                <td className="py-2 px-4">{new Date(maintenance.scheduled_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">
                  {maintenance.completed_date ? new Date(maintenance.completed_date).toLocaleDateString() : 'Pending'}
                </td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    maintenance.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    maintenance.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {maintenance.status_display}
                  </span>
                </td>
                <td className="py-2 px-4">${maintenance.cost || 0}</td>
                <td className="py-2 px-4">{maintenance.performed_by_name || 'Not assigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const totalSchedules = maintenanceSchedules.length;
    const activeSchedules = maintenanceSchedules.filter(s => s.is_active).length;
    const overdueSchedules = maintenanceSchedules.filter(s => 
      s.is_active && new Date(s.next_maintenance) < new Date()
    ).length;

    const totalRequests = maintenanceRequests.length;
    const openRequests = maintenanceRequests.filter(r => r.status === 'OPEN').length;
    const inProgressRequests = maintenanceRequests.filter(r => r.status === 'IN_PROGRESS').length;
    const completedRequests = maintenanceRequests.filter(r => r.status === 'COMPLETED').length;

    const totalMaintenance = assetMaintenance.length;
    const completedMaintenance = assetMaintenance.filter(m => m.status === 'COMPLETED').length;
    const pendingMaintenance = assetMaintenance.filter(m => m.status === 'SCHEDULED').length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Schedules</h3>
            <p className="text-3xl font-bold text-indigo-600">{totalSchedules}</p>
            <p className="text-sm text-gray-500">{activeSchedules} active</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Open Requests</h3>
            <p className="text-3xl font-bold text-orange-600">{openRequests}</p>
            <p className="text-sm text-gray-500">of {totalRequests} total</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Completed Maintenance</h3>
            <p className="text-3xl font-bold text-teal-600">{completedMaintenance}</p>
            <p className="text-sm text-gray-500">of {totalMaintenance} total</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Overdue Schedules</h3>
            <p className="text-3xl font-bold text-red-600">{overdueSchedules}</p>
            <p className="text-sm text-gray-500">requires attention</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Request Status Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Open:</span>
                <span className="font-semibold text-orange-600">{openRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>In Progress:</span>
                <span className="font-semibold text-blue-600">{inProgressRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-semibold text-green-600">{completedRequests}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Maintenance Requests</h3>
            <div className="space-y-2">
              {maintenanceRequests.slice(0, 5).map(request => (
                <div key={request.id} className="flex justify-between items-center">
                  <span className="text-sm">{request.title}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    request.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status_display}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const getModalTitle = () => {
      switch (modalType) {
        case 'schedule': return 'New Maintenance Schedule';
        case 'request': return 'New Maintenance Request';
        case 'maintenance': return 'New Asset Maintenance';
        default: return 'New Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'schedule':
          return (
            <>
              <input name="asset" className="w-full border rounded px-3 py-2" placeholder="Asset ID" required />
              <input name="maintenance_type" className="w-full border rounded px-3 py-2" placeholder="Maintenance Type" required />
              <select name="frequency" className="w-full border rounded px-3 py-2" required>
                <option value="">Select Frequency</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              <input name="next_maintenance" type="date" className="w-full border rounded px-3 py-2" required />
              <textarea name="description" className="w-full border rounded px-3 py-2" placeholder="Description" rows={3} />
              <label className="flex items-center">
                <input name="is_active" type="checkbox" className="mr-2" defaultChecked />
                Active Schedule
              </label>
            </>
          );
        case 'request':
          return (
            <>
              <input name="asset" className="w-full border rounded px-3 py-2" placeholder="Asset ID" required />
              <input name="title" className="w-full border rounded px-3 py-2" placeholder="Request Title" required />
              <textarea name="description" className="w-full border rounded px-3 py-2" placeholder="Description" rows={3} required />
              <select name="priority" className="w-full border rounded px-3 py-2" required>
                <option value="">Select Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <input name="estimated_cost" type="number" step="0.01" className="w-full border rounded px-3 py-2" placeholder="Estimated Cost" />
            </>
          );
        case 'maintenance':
          return (
            <>
              <input name="asset" className="w-full border rounded px-3 py-2" placeholder="Asset ID" required />
              <input name="maintenance_type" className="w-full border rounded px-3 py-2" placeholder="Maintenance Type" required />
              <textarea name="description" className="w-full border rounded px-3 py-2" placeholder="Description" rows={3} required />
              <input name="scheduled_date" type="date" className="w-full border rounded px-3 py-2" required />
              <input name="cost" type="number" step="0.01" className="w-full border rounded px-3 py-2" placeholder="Cost" />
              <textarea name="notes" className="w-full border rounded px-3 py-2" placeholder="Notes" rows={3} />
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
                className="px-4 py-2 rounded bg-indigo-600 text-white"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-lg">Loading Maintenance Management...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Maintenance Management</h2>
      <div className="mb-6 flex gap-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 ${
              activeTab === tab.key 
                ? 'border-indigo-600 text-indigo-700' 
                : 'border-transparent text-gray-500 hover:text-indigo-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'schedules' && renderSchedules()}
      {activeTab === 'requests' && renderRequests()}
      {activeTab === 'maintenance' && renderMaintenance()}
      {activeTab === 'dashboard' && renderDashboard()}

      {renderModal()}
    </div>
  );
};

export default MaintenanceManagement; 