import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiMail, FiDownload, FiEye, FiUser, FiCalendar } from 'react-icons/fi';
import { advancedDocumentService } from '../services/advancedService';
import toast from 'react-hot-toast';

const Letters: React.FC = () => {
  const [letters, setLetters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ 
    title: '', 
    recipient: '', 
    content: '',
    letter_type: '',
    status: 'draft'
  });
  const [editId, setEditId] = useState<number|null>(null);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    setLoading(true);
    try {
      const response = await advancedDocumentService.getLetters();
      setLetters(response.data);
    } catch (error) {
      toast.error('Failed to load letters');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await advancedDocumentService.updateLetter(editId, form);
        toast.success('Letter updated successfully');
      } else {
        await advancedDocumentService.createLetter(form);
        toast.success('Letter created successfully');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ title: '', recipient: '', content: '', letter_type: '', status: 'draft' });
      loadLetters();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this letter?')) {
      try {
        await advancedDocumentService.deleteLetter(id);
        toast.success('Letter deleted successfully');
        loadLetters();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const filteredLetters = () => {
    return letters.filter((letter: any) => 
      letter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.letter_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getLetterTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'formal': 'bg-blue-100 text-blue-800',
      'informal': 'bg-green-100 text-green-800',
      'business': 'bg-purple-100 text-purple-800',
      'personal': 'bg-orange-100 text-orange-800',
      'official': 'bg-red-100 text-red-800',
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-green-100 text-green-800',
      'delivered': 'bg-blue-100 text-blue-800',
      'read': 'bg-purple-100 text-purple-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-pink-700">Letter Management</h2>
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
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
          >
            <FiPlus />
            New Letter
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search letters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
              <option>All Types</option>
              <option>Formal</option>
              <option>Informal</option>
              <option>Business</option>
              <option>Personal</option>
              <option>Official</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
              <option>All Status</option>
              <option>Draft</option>
              <option>Sent</option>
              <option>Delivered</option>
              <option>Read</option>
            </select>
            <input
              type="date"
              placeholder="Generated Date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-pink-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-600">Total Letters</p>
              <p className="text-2xl font-bold text-pink-700">{letters.length}</p>
            </div>
            <FiMail className="text-pink-600 text-2xl" />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Sent</p>
              <p className="text-2xl font-bold text-green-700">
                {letters.filter((l: any) => l.status === 'sent').length}
              </p>
            </div>
            <FiMail className="text-green-600 text-2xl" />
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Delivered</p>
              <p className="text-2xl font-bold text-blue-700">
                {letters.filter((l: any) => l.status === 'delivered').length}
              </p>
            </div>
            <FiMail className="text-blue-600 text-2xl" />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Read</p>
              <p className="text-2xl font-bold text-purple-700">
                {letters.filter((l: any) => l.status === 'read').length}
              </p>
            </div>
            <FiMail className="text-purple-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Letters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLetters().map((letter: any) => (
          <div key={letter.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{letter.title}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-gray-400" />
                      <span>{letter.recipient}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-gray-400" />
                      <span>{new Date(letter.generated_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLetterTypeColor(letter.letter_type)}`}>
                      {letter.letter_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status)}`}>
                      {letter.status}
                    </span>
                  </div>
                  {letter.content && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {letter.content.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  ID: #{letter.id}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditId(letter.id); setForm(letter); setShowModal(true); }}
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
                    onClick={() => handleDelete(letter.id)}
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
      {filteredLetters().length === 0 && !loading && (
        <div className="text-center py-12">
          <FiMail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No letters found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new letter.'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                New Letter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-bold mb-4">{editId ? 'Edit' : 'Create'} Letter</h4>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-pink-500" 
                  placeholder="Letter Title" 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  required
                />
                <select 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-pink-500"
                  value={form.letter_type}
                  onChange={e => setForm({ ...form, letter_type: e.target.value })}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="formal">Formal</option>
                  <option value="informal">Informal</option>
                  <option value="business">Business</option>
                  <option value="personal">Personal</option>
                  <option value="official">Official</option>
                </select>
              </div>
              
              <input 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-pink-500" 
                placeholder="Recipient" 
                value={form.recipient} 
                onChange={e => setForm({ ...form, recipient: e.target.value })} 
                required
              />
              
              <textarea 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-pink-500" 
                placeholder="Letter Content" 
                value={form.content} 
                onChange={e => setForm({ ...form, content: e.target.value })} 
                rows={8}
                required
              />
              
              <select 
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-pink-500"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
              </select>
              
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition" 
                  onClick={() => { 
                    setShowModal(false); 
                    setEditId(null); 
                    setForm({ title: '', recipient: '', content: '', letter_type: '', status: 'draft' }); 
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700 transition"
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

export default Letters; 