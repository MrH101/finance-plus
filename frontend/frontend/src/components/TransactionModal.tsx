import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { Transaction } from '../services/transactionService';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

const TransactionModal = ({ transaction, onClose, onSubmit }: TransactionModalProps) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [mobileAccounts, setMobileAccounts] = useState<any[]>([]);
  const [accountType, setAccountType] = useState<'bank' | 'mobile'>(
    transaction?.account_type === 'mobile' ? 'mobile' : 'bank'
  );
  const isEditing = !!transaction;

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const [bankRes, mobileRes] = await Promise.all([
          api.get('/bank-accounts/').catch(() => ({ data: { results: [], data: [] } })),
          api.get('/mobile-money-accounts/').catch(() => ({ data: { results: [], data: [] } })),
        ]);
        
        const bankList = bankRes.data?.results || bankRes.data || [];
        const mobileList = mobileRes.data?.results || mobileRes.data || [];
        setAccounts(Array.isArray(bankList) ? bankList : []);
        setMobileAccounts(Array.isArray(mobileList) ? mobileList : []);
      } catch {
        setAccounts([]);
        setMobileAccounts([]);
      }
    };
    loadAccounts();
  }, []);

  // Extract actual ID and account info from transaction if editing
  useEffect(() => {
    if (transaction) {
      const [type] = transaction.id.split('_');
      if (type === 'mobile') {
        setAccountType('mobile');
      } else {
        setAccountType('bank');
      }
    }
  }, [transaction]);

  const formik = useFormik({
    initialValues: {
      account_id: transaction?.account_id?.toString() || '',
      transaction_type: transaction?.transaction_type || (transaction?.type === 'income' ? 'RECEIPT' : 'PAYMENT'),
      type: transaction?.type || 'expense',
      amount: transaction?.amount || 0,
      category: transaction?.category || '',
      description: transaction?.description || '',
      date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
      value_date: transaction?.value_date ? transaction.value_date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: transaction?.status?.toUpperCase() || 'PENDING',
      reference: transaction?.reference || '',
      account_type: accountType,
    },
    validationSchema: Yup.object({
      account_id: Yup.number().required('Account is required'),
      transaction_type: Yup.string().oneOf(['DEPOSIT','WITHDRAWAL','TRANSFER','PAYMENT','RECEIPT']).required('Transaction type is required'),
      amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
      description: Yup.string().required('Description is required'),
      date: Yup.date().required('Date is required'),
      value_date: Yup.date().required('Value date is required'),
    }),
    enableReinitialize: true,
    onSubmit: (values) => {
      const payload: any = {
        transaction_type: values.transaction_type,
        amount: Number(values.amount),
        reference: values.reference || values.category || '',
        description: values.description,
        transaction_date: values.date,
        value_date: values.value_date,
        status: values.status,
      };

      if (accountType === 'bank') {
        payload.bank_account = Number(values.account_id);
      } else {
        payload.mobile_account = Number(values.account_id);
      }

      // Include account_type for creation
      if (!isEditing) {
        payload.account_type = accountType;
      }

      onSubmit(payload);
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {transaction ? 'Edit Transaction' : 'Add Transaction'}
        </h2>

        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => {
                    setAccountType(e.target.value as 'bank' | 'mobile');
                    formik.setFieldValue('account_id', '');
                    formik.setFieldValue('account_type', e.target.value);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="bank">Bank Account</option>
                  <option value="mobile">Mobile Money Account</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {accountType === 'bank' ? 'Bank Account' : 'Mobile Money Account'}
              </label>
              <select
                name="account_id"
                value={formik.values.account_id}
                onChange={formik.handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={isEditing}
              >
                <option value="">Select account</option>
                {accountType === 'bank' ? (
                  accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name || a.bank_name} • {a.account_number}
                    </option>
                  ))
                ) : (
                  mobileAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} • {a.phone_number} ({a.provider})
                    </option>
                  ))
                )}
              </select>
              {formik.touched.account_id && (formik.errors as any).account_id && (
                <div className="text-red-500 text-sm mt-1">{(formik.errors as any).account_id}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
              <select
                name="transaction_type"
                value={formik.values.transaction_type}
                onChange={formik.handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="PAYMENT">Payment</option>
                <option value="RECEIPT">Receipt</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
              <input type="number" id="amount" name="amount" onChange={formik.handleChange} value={formik.values.amount as any} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="description" name="description" onChange={formik.handleChange} value={formik.values.description} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" name="date" onChange={formik.handleChange} value={formik.values.date} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Value Date</label>
                <input type="date" name="value_date" onChange={formik.handleChange} value={formik.values.value_date} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reference (optional)</label>
              <input type="text" name="reference" onChange={formik.handleChange} value={formik.values.reference} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isEditing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal; 