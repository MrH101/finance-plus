import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setTransactions } from '../store/slices/transactionSlice';
import { formatCurrency, formatDate } from '../utils/formatters';
import TransactionModal from '../components/TransactionModal';
import TransactionDetailModal from '../components/TransactionDetailModal';
import { transactionService, Transaction } from '../services/transactionService';
import { toast } from 'react-hot-toast';

const Transactions = () => {
  const dispatch = useDispatch();
  const { transactions, loading } = useSelector((state: RootState) => (state as any).transaction || { transactions: [], loading: false });
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [accountFilter, setAccountFilter] = useState<'all' | 'bank' | 'mobile' | 'cash' | 'pos' | 'purchase'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const res = await transactionService.getTransactions({
          type: filter,
          account_type: accountFilter,
        });
        const list = Array.isArray(res) ? res : [];
        dispatch(setTransactions(list as unknown as Transaction[]));
        setFilteredTransactions(list);
      } catch (error: any) {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transactions');
        setFilteredTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [dispatch, filter, accountFilter]);

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!window.confirm(`Are you sure you want to delete this transaction?\n\n${transaction.description}\nAmount: ${formatCurrency(transaction.amount)}`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await transactionService.deleteTransaction(transaction.id, transaction.account_type);
      toast.success('Transaction deleted successfully');
      // Refresh transactions
      const res = await transactionService.getTransactions({
        type: filter,
        account_type: accountFilter,
      });
      const list = Array.isArray(res) ? res : [];
      dispatch(setTransactions(list as unknown as Transaction[]));
      setFilteredTransactions(list);
      if (selectedTransaction?.id === transaction.id) {
        setShowDetailModal(false);
        setSelectedTransaction(null);
      }
    } catch (error: any) {
      console.error('Failed to delete transaction:', error);
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || 'Failed to delete transaction';
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(false);
    setShowModal(true);
  };

  const refreshTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await transactionService.getTransactions({
        type: filter,
        account_type: accountFilter,
      });
      const list = Array.isArray(res) ? res : [];
      dispatch(setTransactions(list as unknown as Transaction[]));
      setFilteredTransactions(list);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <div className="flex space-x-4">
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value as 'all' | 'bank' | 'mobile' | 'cash' | 'pos' | 'purchase')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              <option value="bank">Bank</option>
              <option value="mobile">Mobile Money</option>
              <option value="pos">POS Sales</option>
              <option value="purchase">Purchases</option>
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'income' | 'expense')}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Transaction
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No transactions found</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction: Transaction) => {
                  const getAccountTypeBadge = (type?: string) => {
                    const badges: { [key: string]: { label: string; color: string } } = {
                      bank: { label: 'Bank', color: 'bg-blue-100 text-blue-800' },
                      mobile: { label: 'Mobile', color: 'bg-purple-100 text-purple-800' },
                      pos: { label: 'POS', color: 'bg-green-100 text-green-800' },
                      purchase: { label: 'Purchase', color: 'bg-orange-100 text-orange-800' },
                      cash: { label: 'Cash', color: 'bg-yellow-100 text-yellow-800' },
                    };
                    return badges[type || ''] || { label: type || 'Other', color: 'bg-gray-100 text-gray-800' };
                  };
                  const badge = getAccountTypeBadge(transaction.account_type);
                  
                  return (
                    <li key={transaction.id}>
                      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div
                              className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                transaction.type === 'income'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {transaction.type === 'income' ? (
                                <svg
                                  className="h-6 w-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="h-6 w-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 12H4"
                                  />
                                </svg>
                              )}
                            </div>
                            <div 
                              className="ml-4 flex-1 cursor-pointer"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowDetailModal(true);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                  {transaction.description}
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                <span>{transaction.category}</span>
                                {transaction.account_name && (
                                  <span>• {transaction.account_name}</span>
                                )}
                                {transaction.reference && (
                                  <span>• Ref: {transaction.reference}</span>
                                )}
                                {transaction.payment_method && (
                                  <span>• {transaction.payment_method}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0 text-right">
                            <div
                              className={`text-sm font-medium ${
                                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </div>
                            <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                            {transaction.status && (
                              <div className="text-xs text-gray-400 mt-1 capitalize">{transaction.status.toLowerCase()}</div>
                            )}
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTransaction(transaction);
                                  setShowDetailModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                                title="View Details"
                              >
                                View
                              </button>
                              {(transaction.account_type === 'bank' || transaction.account_type === 'mobile') && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTransaction(transaction);
                                      setShowModal(true);
                                    }}
                                    className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded hover:bg-green-50"
                                    title="Edit"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTransaction(transaction);
                                    }}
                                    disabled={isDeleting}
                                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                                    title="Delete"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {showModal && (
          <TransactionModal
            transaction={selectedTransaction}
            onClose={() => {
              setShowModal(false);
              setSelectedTransaction(null);
            }}
            onSubmit={async (values) => {
              try {
                if (selectedTransaction) {
                  // Update existing transaction
                  const accountType = selectedTransaction.account_type || 'bank';
                  await transactionService.updateTransaction(selectedTransaction.id, values, accountType);
                  toast.success('Transaction updated successfully');
                } else {
                  // Create new transaction
                  const accountType = (values.account_type || 'bank') as 'bank' | 'mobile';
                  await transactionService.createTransaction(values, accountType);
                  toast.success('Transaction created successfully');
                }
                await refreshTransactions();
                setShowModal(false);
                setSelectedTransaction(null);
              } catch (err: any) {
                console.error('Failed to save transaction:', err);
                const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to save transaction';
                toast.error(errorMsg);
              }
            }}
          />
        )}

        {showDetailModal && selectedTransaction && (
          <TransactionDetailModal
            transaction={selectedTransaction}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedTransaction(null);
            }}
            onEdit={() => handleEditTransaction(selectedTransaction)}
            onDelete={() => handleDeleteTransaction(selectedTransaction)}
            canEdit={selectedTransaction.account_type === 'bank' || selectedTransaction.account_type === 'mobile'}
            canDelete={selectedTransaction.account_type === 'bank' || selectedTransaction.account_type === 'mobile'}
          />
        )}
      </div>
    </div>
  );
};

export default Transactions; 