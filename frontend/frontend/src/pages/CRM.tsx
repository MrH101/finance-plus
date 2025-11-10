import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  source_display: string;
  status: string;
  status_display: string;
  estimated_value: number;
  description: string;
  assigned_to_name: string;
  created_at: string;
  updated_at: string;
}

interface Opportunity {
  id: number;
  lead_name: string;
  title: string;
  stage: string;
  stage_display: string;
  expected_revenue: number;
  probability: number;
  expected_close_date: string;
  description: string;
  assigned_to_name: string;
  created_at: string;
  updated_at: string;
}

interface Contact {
  id: number;
  customer_name: string;
  supplier_name: string;
  contact_type: string;
  contact_type_display: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  is_primary: boolean;
  created_at: string;
}

const CRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState('leads');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const tabs = [
    { key: 'leads', label: 'Leads' },
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'contacts', label: 'Contacts' },
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
        case 'leads':
          const leadsResponse = await axios.get('/api/leads/', { headers });
          {
            const data = leadsResponse.data?.results ?? leadsResponse.data ?? [];
            setLeads(Array.isArray(data) ? data : []);
          }
          break;
        case 'opportunities':
          const opportunitiesResponse = await axios.get('/api/opportunities/', { headers });
          {
            const data = opportunitiesResponse.data?.results ?? opportunitiesResponse.data ?? [];
            setOpportunities(Array.isArray(data) ? data : []);
          }
          break;
        case 'contacts':
          const contactsResponse = await axios.get('/api/contacts/', { headers });
          {
            const data = contactsResponse.data?.results ?? contactsResponse.data ?? [];
            setContacts(Array.isArray(data) ? data : []);
          }
          break;
      }
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
        case 'lead':
          await axios.post('/api/leads/', formData, { headers });
          break;
        case 'opportunity':
          await axios.post('/api/opportunities/', formData, { headers });
          break;
        case 'contact':
          await axios.post('/api/contacts/', formData, { headers });
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

  const renderLeads = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Leads</h3>
          <button
          onClick={() => openModal('lead')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
          >
          + Add Lead
          </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leads.map(lead => (
          <div key={lead.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{lead.name}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                lead.status === 'WON' ? 'bg-green-100 text-green-800' :
                lead.status === 'LOST' ? 'bg-red-100 text-red-800' :
                lead.status === 'NEGOTIATION' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {lead.status_display}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Company: {lead.company}</p>
            <p className="text-sm text-gray-600 mb-1">Email: {lead.email}</p>
            <p className="text-sm text-gray-600 mb-2">Phone: {lead.phone}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Source: <span className="font-semibold">{lead.source_display}</span></p>
              <p className="text-sm">Assigned to: <span className="font-semibold">{lead.assigned_to_name || 'Unassigned'}</span></p>
              {lead.estimated_value && (
                <p className="text-sm">Value: <span className="font-semibold text-green-600">${lead.estimated_value.toLocaleString()}</span></p>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Created: {new Date(lead.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOpportunities = () => (
        <div>
          <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Opportunities</h3>
        <button 
          onClick={() => openModal('opportunity')}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + Add Opportunity
        </button>
          </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map(opportunity => (
          <div key={opportunity.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{opportunity.title}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                opportunity.stage === 'CLOSED_WON' ? 'bg-green-100 text-green-800' :
                opportunity.stage === 'CLOSED_LOST' ? 'bg-red-100 text-red-800' :
                opportunity.stage === 'NEGOTIATION' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {opportunity.stage_display}
              </span>
          </div>
            <p className="text-sm text-gray-600 mb-1">Lead: {opportunity.lead_name}</p>
            <p className="text-sm text-gray-600 mb-2">Expected Close: {new Date(opportunity.expected_close_date).toLocaleDateString()}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Revenue: <span className="font-semibold text-green-600">${opportunity.expected_revenue.toLocaleString()}</span></p>
              <p className="text-sm">Probability: <span className="font-semibold">{opportunity.probability}%</span></p>
              <p className="text-sm">Assigned to: <span className="font-semibold">{opportunity.assigned_to_name || 'Unassigned'}</span></p>
                  </div>
            <div className="text-xs text-gray-500">
              Created: {new Date(opportunity.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
        </div>
  );

  const renderContacts = () => (
        <div>
          <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Contacts</h3>
        <button 
          onClick={() => openModal('contact')}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          + Add Contact
        </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
            <tr className="bg-gray-50">
                  <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Type</th>
                  <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Phone</th>
              <th className="py-2 px-4 text-left">Position</th>
              <th className="py-2 px-4 text-left">Primary</th>
              <th className="py-2 px-4 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
            {contacts.map(contact => (
              <tr key={contact.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{`${contact.first_name} ${contact.last_name}`}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    contact.contact_type === 'CUSTOMER' ? 'bg-green-100 text-green-800' :
                    contact.contact_type === 'SUPPLIER' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contact.contact_type_display}
                  </span>
                </td>
                <td className="py-2 px-4">{contact.email}</td>
                <td className="py-2 px-4">{contact.phone}</td>
                <td className="py-2 px-4">{contact.position}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${contact.is_primary ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {contact.is_primary ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-2 px-4">{new Date(contact.created_at).toLocaleDateString()}</td>
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
        <h3 className="text-lg font-bold">CRM Dashboard</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Leads</h5>
          <p className="text-2xl font-bold text-blue-600">{leads.length}</p>
                  </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Active Opportunities</h5>
          <p className="text-2xl font-bold text-green-600">
            {opportunities.filter(o => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST').length}
          </p>
              </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Total Contacts</h5>
          <p className="text-2xl font-bold text-purple-600">{contacts.length}</p>
            </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-2">Pipeline Value</h5>
          <p className="text-2xl font-bold text-orange-600">
            ${opportunities.reduce((sum, o) => sum + o.expected_revenue, 0).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h5 className="font-semibold mb-4">Lead Status Distribution</h5>
          <div className="space-y-2">
            {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map(status => {
              const count = leads.filter(l => l.status === status).length;
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
          <h5 className="font-semibold mb-4">Opportunity Stages</h5>
          <div className="space-y-2">
            {['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'].map(stage => {
              const count = opportunities.filter(o => o.stage === stage).length;
              return (
                <div key={stage} className="flex justify-between items-center">
                  <span className="text-sm">{stage}</span>
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
        case 'lead': return 'Add Lead';
        case 'opportunity': return 'Add Opportunity';
        case 'contact': return 'Add Contact';
        default: return 'Add Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'lead':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Company"
                value={formData.company || ''}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.source || ''}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
              >
                <option value="">Select Source</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="EMAIL">Email Campaign</option>
                <option value="PHONE">Phone Call</option>
                <option value="OTHER">Other</option>
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Estimated Value"
                value={formData.estimated_value || ''}
                onChange={(e) => setFormData({...formData, estimated_value: parseFloat(e.target.value)})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </>
          );
        case 'opportunity':
          return (
            <>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.lead || ''}
                onChange={(e) => setFormData({...formData, lead: parseInt(e.target.value)})}
              >
                <option value="">Select Lead</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name} - {lead.company}</option>
                ))}
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Title"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.stage || ''}
                onChange={(e) => setFormData({...formData, stage: e.target.value})}
              >
                <option value="">Select Stage</option>
                <option value="PROSPECTING">Prospecting</option>
                <option value="QUALIFICATION">Qualification</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CLOSED_WON">Closed Won</option>
                <option value="CLOSED_LOST">Closed Lost</option>
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Expected Revenue"
                value={formData.expected_revenue || ''}
                onChange={(e) => setFormData({...formData, expected_revenue: parseFloat(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Probability (%)"
                value={formData.probability || ''}
                onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Expected Close Date"
                value={formData.expected_close_date || ''}
                onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </>
          );
        case 'contact':
          return (
            <>
              <select 
                className="w-full border rounded px-3 py-2 mb-3"
                value={formData.contact_type || ''}
                onChange={(e) => setFormData({...formData, contact_type: e.target.value})}
              >
                <option value="">Select Contact Type</option>
                <option value="CUSTOMER">Customer</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="PARTNER">Partner</option>
                <option value="PROSPECT">Prospect</option>
              </select>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="First Name"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Last Name"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Position"
                value={formData.position || ''}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              />
              <div className="flex items-center mb-3">
                <input 
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary || false}
                  onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_primary">Primary Contact</label>
          </div>
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
      <h2 className="text-2xl font-bold mb-4 text-orange-700">CRM (Customer Relationship Management)</h2>
      
      <div className="mb-6 flex gap-4 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'border-orange-600 text-orange-700' 
                : 'border-transparent text-gray-500 hover:text-orange-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'leads' && renderLeads()}
          {activeTab === 'opportunities' && renderOpportunities()}
          {activeTab === 'contacts' && renderContacts()}
          {activeTab === 'dashboard' && renderDashboard()}
        </>
      )}

      {renderModal()}
    </div>
  );
};

export default CRM; 