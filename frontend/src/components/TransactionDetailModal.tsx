import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Transaction } from '../services/transactionService';

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const getAccountTypeBadge = (type?: string) => {
    const badges: { [key: string]: { label: string; color: string } } = {
      bank: { label: 'Bank', color: 'bg-blue-100 text-blue-800' },
      mobile: { label: 'Mobile Money', color: 'bg-purple-100 text-purple-800' },
      pos: { label: 'POS Sale', color: 'bg-green-100 text-green-800' },
      purchase: { label: 'Purchase Payment', color: 'bg-orange-100 text-orange-800' },
      cash: { label: 'Cash', color: 'bg-yellow-100 text-yellow-800' },
    };
    return badges[type || ''] || { label: type || 'Other', color: 'bg-gray-100 text-gray-800' };
  };

  const badge = getAccountTypeBadge(transaction.account_type);
  const isReadOnly = transaction.account_type === 'pos' || transaction.account_type === 'purchase';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header with amount and type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                  transaction.type === 'income'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {transaction.type === 'income' ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                )}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {transaction.type === 'income' ? 'Income' : 'Expense'}
                </div>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
              <p className="text-sm text-gray-900">{transaction.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
              <p className="text-sm text-gray-900">{transaction.category}</p>
            </div>

            {transaction.account_name && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account</label>
                <p className="text-sm text-gray-900">{transaction.account_name}</p>
              </div>
            )}

            {transaction.reference && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Reference</label>
                <p className="text-sm text-gray-900 font-mono">{transaction.reference}</p>
              </div>
            )}

            {transaction.transaction_type && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Transaction Type</label>
                <p className="text-sm text-gray-900 capitalize">{transaction.transaction_type.toLowerCase().replace('_', ' ')}</p>
              </div>
            )}

            {transaction.payment_method && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Payment Method</label>
                <p className="text-sm text-gray-900 capitalize">{transaction.payment_method.toLowerCase().replace('_', ' ')}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
              <p className="text-sm text-gray-900">{formatDate(transaction.date)}</p>
            </div>

            {transaction.value_date && transaction.value_date !== transaction.date && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Value Date</label>
                <p className="text-sm text-gray-900">{formatDate(transaction.value_date)}</p>
              </div>
            )}

            {transaction.status && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  transaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  transaction.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {transaction.status}
                </span>
              </div>
            )}

            {transaction.created_at && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <p className="text-sm text-gray-900">{formatDate(transaction.created_at)}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isReadOnly && (canEdit || canDelete) && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Transaction
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Transaction
                </button>
              )}
            </div>
          )}

          {isReadOnly && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                This transaction is read-only. It was automatically created from a {transaction.account_type === 'pos' ? 'POS sale' : 'purchase order payment'}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;

