import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface GeneralLedger {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  account_type_display: string;
  balance: number;
  debit_balance: number;
  credit_balance: number;
  is_active: boolean;
}

interface JournalEntry {
  id: number;
  entry_number: string;
  entry_date: string;
  reference: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  status_display: string;
  created_date: string;
}

interface JournalEntryLine {
  id: number;
  account_name: string;
  account_code: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

interface AccountPayable {
  id: number;
  vendor_name: string;
  vendor_code: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  status_display: string;
  description: string;
}

interface AccountReceivable {
  id: number;
  customer_name: string;
  customer_code: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  status_display: string;
  description: string;
}

const Accounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general-ledger');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [generalLedger, setGeneralLedger] = useState<GeneralLedger[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalEntryLines, setJournalEntryLines] = useState<JournalEntryLine[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const tabs = [
    { key: 'general-ledger', label: 'General Ledger' },
    { key: 'journal-entries', label: 'Journal Entries' },
    { key: 'accounts-payable', label: 'Accounts Payable' },
    { key: 'accounts-receivable', label: 'Accounts Receivable' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'general-ledger':
          try {
            const ledgerResponse = await api.get('/general-ledger/');
            const ledgerData = ledgerResponse.data?.results || ledgerResponse.data || [];
            setGeneralLedger(Array.isArray(ledgerData) ? ledgerData : []);
          } catch (error: any) {
            console.error('Error fetching general ledger:', error);
            setGeneralLedger([]);
          }
          break;
        case 'journal-entries':
          try {
            const entriesResponse = await api.get('/journal-entries/');
            const entriesData = entriesResponse.data?.results || entriesResponse.data || [];
            setJournalEntries(Array.isArray(entriesData) ? entriesData : []);
          } catch (error: any) {
            console.error('Error fetching journal entries:', error);
            setJournalEntries([]);
          }
          break;
        case 'accounts-payable':
          try {
            const payableResponse = await api.get('/accounts-payable/');
            const payableData = payableResponse.data?.results || payableResponse.data || [];
            setAccountsPayable(Array.isArray(payableData) ? payableData : []);
          } catch (error: any) {
            console.error('Error fetching accounts payable:', error);
            setAccountsPayable([]);
            // Don't show error to user if endpoint doesn't exist yet
            if (error?.response?.status !== 404) {
              console.error('Accounts payable error:', error);
            }
          }
          break;
        case 'accounts-receivable':
          try {
            const receivableResponse = await api.get('/accounts-receivable/');
            const receivableData = receivableResponse.data?.results || receivableResponse.data || [];
            setAccountsReceivable(Array.isArray(receivableData) ? receivableData : []);
          } catch (error: any) {
            console.error('Error fetching accounts receivable:', error);
            setAccountsReceivable([]);
            // Don't show error to user if endpoint doesn't exist yet
            if (error?.response?.status !== 404) {
              console.error('Accounts receivable error:', error);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJournalEntryLines = async (entryId: number) => {
    try {
      const response = await api.get(`/journal-entries/${entryId}/lines/`);
      const linesData = response.data?.results || response.data || [];
      setJournalEntryLines(Array.isArray(linesData) ? linesData : []);
    } catch (error) {
      console.error('Error fetching journal entry lines:', error);
      setJournalEntryLines([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      switch (modalType) {
        case 'journal-entry':
          await api.post('/journal-entries/', formData);
          break;
        case 'account-payable':
          // Note: Accounts payable creation is handled through purchase orders
          // This is a read-only view aggregating from existing data
          console.warn('Accounts payable creation should be done through purchase orders');
          break;
        case 'account-receivable':
          // Note: Accounts receivable creation is handled through POS sales
          // This is a read-only view aggregating from existing data
          console.warn('Accounts receivable creation should be done through POS sales');
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

  const renderGeneralLedger = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">General Ledger</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Account Code</th>
              <th className="py-2 px-4 text-left">Account Name</th>
              <th className="py-2 px-4 text-left">Type</th>
              <th className="py-2 px-4 text-left">Debit Balance</th>
              <th className="py-2 px-4 text-left">Credit Balance</th>
              <th className="py-2 px-4 text-left">Net Balance</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {generalLedger.map(account => (
              <tr key={account.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-medium">{account.account_code}</td>
                <td className="py-2 px-4">{account.account_name}</td>
                <td className="py-2 px-4">{account.account_type_display}</td>
                <td className="py-2 px-4">${account.debit_balance.toLocaleString()}</td>
                <td className="py-2 px-4">${account.credit_balance.toLocaleString()}</td>
                <td className="py-2 px-4 font-semibold">
                  <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${Math.abs(account.balance).toLocaleString()}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderJournalEntries = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Journal Entries</h3>
        <button 
          onClick={() => openModal('journal-entry')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Add Entry
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Entry #</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Reference</th>
              <th className="py-2 px-4 text-left">Description</th>
              <th className="py-2 px-4 text-left">Total Debit</th>
              <th className="py-2 px-4 text-left">Total Credit</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {journalEntries.map(entry => (
              <tr key={entry.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-medium">{entry.entry_number}</td>
                <td className="py-2 px-4">{new Date(entry.entry_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{entry.reference}</td>
                <td className="py-2 px-4">{entry.description}</td>
                <td className="py-2 px-4">${entry.total_debit.toLocaleString()}</td>
                <td className="py-2 px-4">${entry.total_credit.toLocaleString()}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    entry.status === 'POSTED' ? 'bg-green-100 text-green-800' :
                    entry.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {entry.status_display}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <button 
                    onClick={() => {
                      setSelectedEntry(entry);
                      fetchJournalEntryLines(entry.id);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Lines
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Journal Entry Lines Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold">Journal Entry Lines - {selectedEntry.entry_number}</h4>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 text-left">Account</th>
                    <th className="py-2 px-4 text-left">Account Code</th>
                    <th className="py-2 px-4 text-left">Debit</th>
                    <th className="py-2 px-4 text-left">Credit</th>
                    <th className="py-2 px-4 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntryLines.map(line => (
                    <tr key={line.id} className="border-b">
                      <td className="py-2 px-4">{line.account_name}</td>
                      <td className="py-2 px-4">{line.account_code}</td>
                      <td className="py-2 px-4">${line.debit_amount.toLocaleString()}</td>
                      <td className="py-2 px-4">${line.credit_amount.toLocaleString()}</td>
                      <td className="py-2 px-4">{line.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccountsPayable = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Accounts Payable</h3>
        <button 
          onClick={() => openModal('account-payable')}
          className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition"
        >
          + Add Payable
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Vendor</th>
              <th className="py-2 px-4 text-left">Invoice #</th>
              <th className="py-2 px-4 text-left">Invoice Date</th>
              <th className="py-2 px-4 text-left">Due Date</th>
              <th className="py-2 px-4 text-left">Amount</th>
              <th className="py-2 px-4 text-left">Paid</th>
              <th className="py-2 px-4 text-left">Balance</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {accountsPayable.map(payable => (
              <tr key={payable.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{payable.vendor_name}</td>
                <td className="py-2 px-4 font-medium">{payable.invoice_number}</td>
                <td className="py-2 px-4">{new Date(payable.invoice_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{new Date(payable.due_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">${payable.amount.toLocaleString()}</td>
                <td className="py-2 px-4">${payable.paid_amount.toLocaleString()}</td>
                <td className="py-2 px-4 font-semibold text-red-600">${payable.balance.toLocaleString()}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    payable.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    payable.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payable.status_display}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAccountsReceivable = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Accounts Receivable</h3>
        <button 
          onClick={() => openModal('account-receivable')}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          + Add Receivable
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Customer</th>
              <th className="py-2 px-4 text-left">Invoice #</th>
              <th className="py-2 px-4 text-left">Invoice Date</th>
              <th className="py-2 px-4 text-left">Due Date</th>
              <th className="py-2 px-4 text-left">Amount</th>
              <th className="py-2 px-4 text-left">Paid</th>
              <th className="py-2 px-4 text-left">Balance</th>
              <th className="py-2 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {accountsReceivable.map(receivable => (
              <tr key={receivable.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{receivable.customer_name}</td>
                <td className="py-2 px-4 font-medium">{receivable.invoice_number}</td>
                <td className="py-2 px-4">{new Date(receivable.invoice_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">{new Date(receivable.due_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">${receivable.amount.toLocaleString()}</td>
                <td className="py-2 px-4">${receivable.paid_amount.toLocaleString()}</td>
                <td className="py-2 px-4 font-semibold text-green-600">${receivable.balance.toLocaleString()}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    receivable.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    receivable.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {receivable.status_display}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const getModalTitle = () => {
      switch (modalType) {
        case 'journal-entry': return 'Add Journal Entry';
        case 'account-payable': return 'Add Account Payable';
        case 'account-receivable': return 'Add Account Receivable';
        default: return 'Add Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'journal-entry':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Reference"
                value={formData.reference || ''}
                onChange={(e) => setFormData({...formData, reference: e.target.value})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Entry Date"
                value={formData.entry_date || ''}
                onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
              />
            </>
          );
        case 'account-payable':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Vendor Name"
                value={formData.vendor_name || ''}
                onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Invoice Number"
                value={formData.invoice_number || ''}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Invoice Date"
                value={formData.invoice_date || ''}
                onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Due Date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </>
          );
        case 'account-receivable':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Customer Name"
                value={formData.customer_name || ''}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Invoice Number"
                value={formData.invoice_number || ''}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Invoice Date"
                value={formData.invoice_date || ''}
                onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="date"
                placeholder="Due Date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
              />
              <textarea 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
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
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Accounting</h2>
      
      <div className="mb-6 flex gap-4 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 whitespace-nowrap ${
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

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'general-ledger' && renderGeneralLedger()}
          {activeTab === 'journal-entries' && renderJournalEntries()}
          {activeTab === 'accounts-payable' && renderAccountsPayable()}
          {activeTab === 'accounts-receivable' && renderAccountsReceivable()}
        </>
      )}

      {renderModal()}
    </div>
  );
};

export default Accounting; 