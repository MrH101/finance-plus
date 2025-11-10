import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiDownload, FiSearch, FiFilter, FiFileText, FiEye } from 'react-icons/fi';
import { advancedDocumentService } from '../services/advancedService';
import toast from 'react-hot-toast';

const DocumentTemplates: React.FC = () => {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ 
    name: '', 
    document_type: '', 
    content: '',
    is_active: true,
    description: ''
  });
  const [editId, setEditId] = useState<number|null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await advancedDocumentService.getDocumentTemplates();
      const data = response?.data?.results ?? response?.data ?? [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await advancedDocumentService.updateDocumentTemplate(editId, form);
        toast.success('Template updated successfully');
      } else {
        await advancedDocumentService.createDocumentTemplate(form);
        toast.success('Template created successfully');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ name: '', document_type: '', content: '', is_active: true, description: '' });
      loadTemplates();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await advancedDocumentService.deleteDocumentTemplate(id);
        toast.success('Template deleted successfully');
        loadTemplates();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const filteredTemplates = () => {
    const list = Array.isArray(templates) ? templates : [];
    return list.filter((template: any) => 
      template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.document_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getTemplateTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'invoice': 'bg-blue-100 text-blue-800',
      'receipt': 'bg-green-100 text-green-800',
      'letter': 'bg-purple-100 text-purple-800',
      'contract': 'bg-orange-100 text-orange-800',
      'report': 'bg-gray-100 text-gray-800',
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">Document Templates</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <FiFilter />
            Filter
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <FiPlus />
            New Template
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>All Types</option>
              <option>Invoice</option>
              <option>Receipt</option>
              <option>Letter</option>
              <option>Contract</option>
              <option>Report</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <input
              type="date"
              placeholder="Created Date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600">Total Templates</p>
              <p className="text-2xl font-bold text-indigo-700">{templates.length}</p>
            </div>
            <FiFileText className="text-indigo-600 text-2xl" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Active</p>
              <p className="text-2xl font-bold text-green-700">
                {templates.filter((t: any) => t.is_active).length}
              </p>
            </div>
            <FiFileText className="text-green-600 text-2xl" />
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Inactive</p>
              <p className="text-2xl font-bold text-red-700">
                {templates.filter((t: any) => !t.is_active).length}
              </p>
            </div>
            <FiFileText className="text-red-600 text-2xl" />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Types</p>
              <p className="text-2xl font-bold text-purple-700">
                {new Set(templates.map((t: any) => t.document_type)).size}
              </p>
            </div>
            <FiFileText className="text-purple-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates().map((template: any) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTemplateTypeColor(template.document_type)}`}>
                      {template.document_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditId(template.id); setForm(template); setShowModal(true); }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <FiEdit size={16} />
                  </button>
                  <button 
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                    title="Preview"
                  >
                    <FiEye size={16} />
                  </button>
                  <button 
                    className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition"
                    title="Download"
                  >
                    <FiDownload size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates().length === 0 && !loading && (
        <div className="text-center py-12">
          <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new template.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                New Template
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold mb-4">{editId ? 'Edit' : 'Create'} Document Template</h4>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Template Name" 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  required
                />
                <select 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  value={form.document_type}
                  onChange={e => setForm({ ...form, document_type: e.target.value })}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="letter">Letter</option>
                  <option value="contract">Contract</option>
                  <option value="report">Report</option>
                </select>
              </div>
              
              <textarea 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500" 
                placeholder="Description" 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                rows={2}
              />
              
              <textarea 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500" 
                placeholder="Template Content (HTML/Markdown)" 
                value={form.content} 
                onChange={e => setForm({ ...form, content: e.target.value })} 
                rows={8}
                required
              />
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active Template
                </label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition" 
                  onClick={() => { 
                    setShowModal(false); 
                    setEditId(null); 
                    setForm({ name: '', document_type: '', content: '', is_active: true, description: '' }); 
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  {editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTemplates; 