import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiFileText, FiDownload,
  FiUpload, FiFolder, FiFile, FiSearch, FiTag
} from 'react-icons/fi';
import { documentService } from '../services/extendedApi';

interface Document {
  id: number;
  document_number: string;
  title: string;
  document_type: string;
  category: string;
  file_url: string;
  file_size: number;
  version: string;
  status: string;
  uploaded_by_name: string;
  created_at: string;
  tags: string[];
}

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    document_type: 'CONTRACT',
    category: 'GENERAL',
    description: '',
    tags: '',
    version: '1.0',
  });

  const categories = [
    { value: 'GENERAL', label: 'General', icon: FiFile, color: 'blue' },
    { value: 'CONTRACT', label: 'Contract', icon: FiFileText, color: 'purple' },
    { value: 'INVOICE', label: 'Invoice', icon: FiFileText, color: 'green' },
    { value: 'PROPOSAL', label: 'Proposal', icon: FiFileText, color: 'indigo' },
    { value: 'REPORT', label: 'Report', icon: FiFileText, color: 'orange' },
    { value: 'POLICY', label: 'Policy', icon: FiFile, color: 'red' },
    { value: 'PROCEDURE', label: 'Procedure', icon: FiFile, color: 'yellow' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentService.getAll();
      setDocuments(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', selectedFile);
    Object.entries(formData).forEach(([key, value]) => {
      uploadData.append(key, value);
    });

    try {
      await documentService.create(uploadData);
      toast.success('Document uploaded successfully');
      setShowModal(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload document');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentService.delete(id);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = (document: Document) => {
    window.open(document.file_url, '_blank');
    toast.success('Downloading document...');
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFormData({
      title: '',
      document_type: 'CONTRACT',
      category: 'GENERAL',
      description: '',
      tags: '',
      version: '1.0',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'gray';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = filterCategory === 'ALL' || doc.category === filterCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.document_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: documents.length,
    totalSize: documents.reduce((sum, d) => sum + d.file_size, 0),
    byCategory: categories.reduce((acc, cat) => {
      acc[cat.value] = documents.filter(d => d.category === cat.value).length;
      return acc;
    }, {} as any),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Management</h1>
        <p className="text-gray-600">Organize and manage your business documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Documents</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFileText className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Size</p>
              <p className="text-2xl font-bold mt-2">{formatFileSize(stats.totalSize)}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFolder className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Contracts</p>
              <p className="text-3xl font-bold mt-2">{stats.byCategory.CONTRACT || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFileText className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Reports</p>
              <p className="text-3xl font-bold mt-2">{stats.byCategory.REPORT || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFileText className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ALL
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiPlus className="h-5 w-5" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => {
          const categoryColor = getCategoryColor(doc.category);
          return (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-${categoryColor}-100 rounded-lg`}>
                  <FiFileText className={`h-6 w-6 text-${categoryColor}-600`} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiDownload className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                {doc.title}
              </h3>
              <p className="text-xs text-gray-500 mb-3">{doc.document_number}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{doc.document_type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Category:</span>
                  <span className={`px-2 py-1 bg-${categoryColor}-100 text-${categoryColor}-800 rounded text-xs font-medium`}>
                    {doc.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{formatFileSize(doc.file_size)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">{doc.version}</span>
                </div>
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {doc.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                        <FiTag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Uploaded by {doc.uploaded_by_name}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(doc.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents found</p>
          <p className="text-gray-400 mb-4">Upload your first document</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-5 w-5" />
            Upload Document
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FiUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {selectedFile ? formatFileSize(selectedFile.size) : 'PDF, DOC, DOCX, XLS, XLSX up to 10MB'}
                  </p>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type *
                  </label>
                  <select
                    required
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CONTRACT">Contract</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="PURCHASE_ORDER">Purchase Order</option>
                    <option value="QUOTATION">Quotation</option>
                    <option value="REPORT">Report</option>
                    <option value="POLICY">Policy</option>
                    <option value="MEMO">Memo</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., urgent, legal, confidential"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;

