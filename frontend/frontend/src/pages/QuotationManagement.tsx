import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiFileText, FiSend,
  FiDollarSign, FiCalendar, FiCheckCircle, FiClock, FiDownload
} from 'react-icons/fi';
import { quotationService, quotationActionService } from '../services/extendedApi';

interface Quotation {
  id: number;
  quotation_number: string;
  customer_name: string;
  quotation_date: string;
  valid_until: string;
  total_amount: string;
  status: string;
  sales_person_name?: string;
  reference_number?: string;
}

const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({
    customer: '',
    quotation_date: '',
    valid_until: '',
    reference_number: '',
    payment_terms: 'Net 30',
    delivery_terms: 'FOB',
    notes: '',
    terms_and_conditions: '',
  });

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await quotationService.getAll();
      setQuotations(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuotation) {
        await quotationService.update(editingQuotation.id, formData);
        toast.success('Quotation updated successfully');
      } else {
        await quotationService.create(formData);
        toast.success('Quotation created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchQuotations();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save quotation');
    }
  };

  const handleSend = async (id: number) => {
    if (!window.confirm('Send this quotation to the customer?')) return;
    
    try {
      await quotationActionService.send(id);
      toast.success('Quotation sent successfully!');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to send quotation');
    }
  };

  const handleConvert = async (id: number) => {
    if (!window.confirm('Convert this quotation to a sales order?')) return;
    
    try {
      await quotationActionService.convert(id);
      toast.success('Quotation converted to sales order!');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to convert quotation');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    
    try {
      await quotationService.delete(id);
      toast.success('Quotation deleted successfully');
      fetchQuotations();
    } catch (error) {
      toast.error('Failed to delete quotation');
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await quotationActionService.downloadPDF(id);
      // Handle PDF download
      toast.success('Downloading quotation...');
    } catch (error) {
      toast.error('Failed to download quotation');
    }
  };

  const resetForm = () => {
    setEditingQuotation(null);
    setFormData({
      customer: '',
      quotation_date: '',
      valid_until: '',
      reference_number: '',
      payment_terms: 'Net 30',
      delivery_terms: 'FOB',
      notes: '',
      terms_and_conditions: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
      CONVERTED: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <FiCheckCircle className="h-4 w-4" />;
      case 'SENT':
        return <FiSend className="h-4 w-4" />;
      case 'EXPIRED':
        return <FiClock className="h-4 w-4" />;
      default:
        return <FiFileText className="h-4 w-4" />;
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const filteredQuotations = quotations.filter(quot =>
    filterStatus === 'ALL' || quot.status === filterStatus
  );

  const stats = {
    total: quotations.length,
    draft: quotations.filter(q => q.status === 'DRAFT').length,
    sent: quotations.filter(q => q.status === 'SENT').length,
    accepted: quotations.filter(q => q.status === 'ACCEPTED').length,
    totalValue: quotations.reduce((sum, q) => sum + parseFloat(q.total_amount || '0'), 0),
    acceptanceRate: quotations.length > 0 
      ? (quotations.filter(q => q.status === 'ACCEPTED').length / quotations.length) * 100 
      : 0,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotation Management</h1>
        <p className="text-gray-600">Create and manage customer quotations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiFileText className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm">Draft</p>
              <p className="text-3xl font-bold mt-2">{stats.draft}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiEdit2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Sent</p>
              <p className="text-3xl font-bold mt-2">{stats.sent}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiSend className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Accepted</p>
              <p className="text-3xl font-bold mt-2">{stats.accepted}</p>
              <p className="text-green-100 text-xs mt-1">{stats.acceptanceRate.toFixed(1)}% rate</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiCheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Value</p>
              <p className="text-2xl font-bold mt-2">${stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FiDollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FiPlus className="h-5 w-5" />
            Create Quotation
          </button>
        </div>
      </div>

      {/* Quotations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotations.map((quotation) => {
          const expired = isExpired(quotation.valid_until);
          return (
            <div key={quotation.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {quotation.quotation_number}
                  </h3>
                  <p className="text-sm text-gray-500">{quotation.customer_name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(quotation.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <FiDownload className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuotation(quotation);
                      setShowModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(quotation.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${parseFloat(quotation.total_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiCalendar className="h-4 w-4 text-gray-400" />
                  <span>Date: {new Date(quotation.quotation_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiClock className="h-4 w-4 text-gray-400" />
                  <span className={expired ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    Valid until: {new Date(quotation.valid_until).toLocaleDateString()}
                  </span>
                </div>
                {quotation.reference_number && (
                  <div className="text-xs text-gray-500">
                    Ref: {quotation.reference_number}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(quotation.status)}`}>
                  {getStatusIcon(quotation.status)}
                  {quotation.status}
                </span>
                {quotation.sales_person_name && (
                  <span className="text-xs text-gray-500">{quotation.sales_person_name}</span>
                )}
              </div>

              {quotation.status === 'DRAFT' && (
                <button
                  onClick={() => handleSend(quotation.id)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FiSend className="h-4 w-4" />
                  Send to Customer
                </button>
              )}

              {quotation.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleConvert(quotation.id)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FiCheckCircle className="h-4 w-4" />
                  Convert to Sales Order
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredQuotations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No quotations found</p>
          <p className="text-gray-400 mb-4">Create your first quotation</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="h-5 w-5" />
            Create Quotation
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingQuotation ? 'Edit Quotation' : 'Create Quotation'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quotation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.quotation_date}
                    onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Terms
                  </label>
                  <input
                    type="text"
                    value={formData.delivery_terms}
                    onChange={(e) => setFormData({ ...formData, delivery_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms and Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
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
                  {editingQuotation ? 'Update Quotation' : 'Create Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagement;

