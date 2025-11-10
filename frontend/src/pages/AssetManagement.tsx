import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Asset {
  id: number;
  name: string;
  asset_type: string;
  asset_type_display: string;
  serial_number: string;
  model: string;
  manufacturer: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  status: string;
  status_display: string;
  location: string;
  assigned_to_name: string;
  department: string;
  warranty_expiry: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

const AssetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('assets');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetMaintenance, setAssetMaintenance] = useState<AssetMaintenance[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const tabs = [
    { key: 'assets', label: 'Assets' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'schedules', label: 'Schedules' },
    { key: 'requests', label: 'Requests' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Token ${token}` };

      switch (activeTab) {
        case 'assets':
          const assetsResponse = await axios.get('/api/assets/', { headers });
          setAssets(assetsResponse.data);
          break;
        case 'maintenance':
          const maintenanceResponse = await axios.get('/api/asset-maintenance/', { headers });
          setAssetMaintenance(maintenanceResponse.data);
          break;
        case 'schedules':
          const schedulesResponse = await axios.get('/api/maintenance-schedules/', { headers });
          setMaintenanceSchedules(schedulesResponse.data);
          break;
        case 'requests':
          const requestsResponse = await axios.get('/api/maintenance-requests/', { headers });
          setMaintenanceRequests(requestsResponse.data);
          break;
      }

      // Fetch users for dropdowns
      const usersResponse = await axios.get('/api/users/', { headers });
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Token ${token}` };

      switch (modalType) {
        case 'asset':
          await axios.post('/api/assets/', formData, { headers });
          break;
        case 'maintenance':
          await axios.post('/api/asset-maintenance/', formData, { headers });
          break;
        case 'schedule':
          await axios.post('/api/maintenance-schedules/', formData, { headers });
          break;
        case 'request':
          await axios.post('/api/maintenance-requests/', formData, { headers });
          break;
      }

      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error creating record:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
    setFormData({});
  };

  const renderAssets = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Assets</h3>
        <button 
          onClick={() => openModal('asset')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Add Asset
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map(asset => (
          <div key={asset.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{asset.name}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                asset.status === 'OPERATIONAL' ? 'bg-green-100 text-green-800' :
                asset.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                asset.status === 'RETIRED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {asset.status_display}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Type: {asset.asset_type_display}</p>
            <p className="text-sm text-gray-600 mb-1">Serial: {asset.serial_number}</p>
            <p className="text-sm text-gray-600 mb-2">Model: {asset.model}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Location: <span className="font-semibold">{asset.location}</span></p>
              <p className="text-sm">Assigned to: <span className="font-semibold">{asset.assigned_to_name || 'Unassigned'}</span></p>
              <p className="text-sm">Department: <span className="font-semibold">{asset.department}</span></p>
              <p className="text-sm">Purchase Cost: <span className="font-semibold text-green-600">${asset.purchase_cost?.toLocaleString() || '0'}</span></p>
              <p className="text-sm">Current Value: <span className="font-semibold text-blue-600">${asset.current_value?.toLocaleString() || '0'}</span></p>
            </div>
            <div className="text-xs text-gray-500">
              Purchased: {new Date(asset.purchase_date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMaintenance = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Asset Maintenance</h3>
        <button 
          onClick={() => openModal('maintenance')}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + Add Maintenance
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assetMaintenance.map(maintenance => (
          <div key={maintenance.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{maintenance.asset_name}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                maintenance.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                maintenance.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                maintenance.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {maintenance.status_display}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Type: {maintenance.maintenance_type_display}</p>
            <p className="text-sm text-gray-600 mb-2">{maintenance.description}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Scheduled: <span className="font-semibold">{new Date(maintenance.scheduled_date).toLocaleDateString()}</span></p>
              {maintenance.completed_date && (
                <p className="text-sm">Completed: <span className="font-semibold">{new Date(maintenance.completed_date).toLocaleDateString()}</span></p>
              )}
              <p className="text-sm">Performed by: <span className="font-semibold">{maintenance.performed_by_name || 'Not assigned'}</span></p>
              {maintenance.cost && (
                <p className="text-sm">Cost: <span className="font-semibold text-red-600">${maintenance.cost.toLocaleString()}</span></p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Created: {new Date(maintenance.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSchedules = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Maintenance Schedules</h3>
        <button 
          onClick={() => openModal('schedule')}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          + Add Schedule
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {maintenanceSchedules.map(schedule => (
          <div key={schedule.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{schedule.asset_name}</h4>
              <span className={`px-2 py-1 rounded text-xs ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {schedule.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Type: {schedule.maintenance_type_display}</p>
            <p className="text-sm text-gray-600 mb-2">Frequency: {schedule.frequency_display}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Last: <span className="font-semibold">{new Date(schedule.last_maintenance).toLocaleDateString()}</span></p>
              <p className="text-sm">Next: <span className="font-semibold">{new Date(schedule.next_maintenance).toLocaleDateString()}</span></p>
            </div>
            <div className="text-xs text-gray-500">
              Created: {new Date(schedule.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
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
          + Add Request
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {maintenanceRequests.map(request => (
          <div key={request.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{request.title}</h4>
              <div className="flex flex-col gap-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  request.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.status_display}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  request.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                  request.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {request.priority_display}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Asset: {request.asset_name}</p>
            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Requested by: <span className="font-semibold">{request.requested_by_name}</span></p>
              <p className="text-sm">Assigned to: <span className="font-semibold">{request.assigned_to_name || 'Unassigned'}</span></p>
              <p className="text-sm">Requested: <span className="font-semibold">{new Date(request.requested_date).toLocaleDateString()}</span></p>
              {request.completed_date && (
                <p className="text-sm">Completed: <span className="font-semibold">{new Date(request.completed_date).toLocaleDateString()}</span></p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Created: {new Date(request.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Asset Dashboard</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Assets</h5>
          <p className="text-2xl font-bold text-blue-600">{assets.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Operational Assets</h5>
          <p className="text-2xl font-bold text-green-600">
            {assets.filter(a => a.status === 'OPERATIONAL').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Pending Requests</h5>
          <p className="text-2xl font-bold text-orange-600">
            {maintenanceRequests.filter(r => r.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Asset Value</h5>
          <p className="text-2xl font-bold text-purple-600">
            ${assets.reduce((sum, a) => sum + (a.current_value || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-4">Asset Status</h5>
          <div className="space-y-2">
            {['OPERATIONAL', 'MAINTENANCE', 'RETIRED', 'OUT_OF_SERVICE'].map(status => {
              const count = assets.filter(a => a.status === status).length;
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
          <h5 className="font-semibold mb-4">Request Status</h5>
          <div className="space-y-2">
            {['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'].map(status => {
              const count = maintenanceRequests.filter(r => r.status === status).length;
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
        case 'asset': return 'Add Asset';
        case 'maintenance': return 'Add Maintenance';
        case 'schedule': return 'Add Schedule';
        case 'request': return 'Add Request';
        default: return 'Add Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'asset':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Asset Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.asset_type || ''}
                onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
              >
                <option value="">Select Asset Type</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="BUILDING">Building</option>
                <option value="SOFTWARE">Software</option>
                <option value="FURNITURE">Furniture</option>
                <option value="OTHER">Other</option>
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Serial Number"
                value={formData.serial_number || ''}
                onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Model"
                value={formData.model || ''}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Manufacturer"
                value={formData.manufacturer || ''}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Purchase Date"
                value={formData.purchase_date || ''}
                onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                step="0.01"
                placeholder="Purchase Cost"
                value={formData.purchase_cost || ''}
                onChange={(e) => setFormData({...formData, purchase_cost: parseFloat(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                step="0.01"
                placeholder="Current Value"
                value={formData.current_value || ''}
                onChange={(e) => setFormData({...formData, current_value: parseFloat(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Location"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Department"
                value={formData.department || ''}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
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
            </>
          );
        case 'maintenance':
          return (
            <>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.asset || ''}
                onChange={(e) => setFormData({...formData, asset: parseInt(e.target.value)})}
              >
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.maintenance_type || ''}
                onChange={(e) => setFormData({...formData, maintenance_type: e.target.value})}
              >
                <option value="">Select Maintenance Type</option>
                <option value="PREVENTIVE">Preventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="INSPECTION">Inspection</option>
              </select>
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Scheduled Date"
                value={formData.scheduled_date || ''}
                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                step="0.01"
                placeholder="Cost"
                value={formData.cost || ''}
                onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value)})}
              />
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.performed_by || ''}
                onChange={(e) => setFormData({...formData, performed_by: parseInt(e.target.value)})}
              >
                <option value="">Select Performer</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
                ))}
              </select>
            </>
          );
        case 'schedule':
          return (
            <>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.asset || ''}
                onChange={(e) => setFormData({...formData, asset: parseInt(e.target.value)})}
              >
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.maintenance_type || ''}
                onChange={(e) => setFormData({...formData, maintenance_type: e.target.value})}
              >
                <option value="">Select Maintenance Type</option>
                <option value="PREVENTIVE">Preventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="INSPECTION">Inspection</option>
              </select>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.frequency || ''}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              >
                <option value="">Select Frequency</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Last Maintenance"
                value={formData.last_maintenance || ''}
                onChange={(e) => setFormData({...formData, last_maintenance: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Next Maintenance"
                value={formData.next_maintenance || ''}
                onChange={(e) => setFormData({...formData, next_maintenance: e.target.value})}
              />
            </>
          );
        case 'request':
          return (
            <>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.asset || ''}
                onChange={(e) => setFormData({...formData, asset: parseInt(e.target.value)})}
              >
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Request Title"
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
      <h2 className="text-2xl font-bold mb-4 text-teal-700">Asset Management</h2>
      
      <div className="mb-6 flex gap-4 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'border-teal-600 text-teal-700' 
                : 'border-transparent text-gray-500 hover:text-teal-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'assets' && renderAssets()}
          {activeTab === 'maintenance' && renderMaintenance()}
          {activeTab === 'schedules' && renderSchedules()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'dashboard' && renderDashboard()}
        </>
      )}

      {renderModal()}
    </div>
  );
};

export default AssetManagement; 