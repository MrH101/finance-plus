// src/components/Modules/BalanceSheet.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useError } from '../../contexts/ErrorContext';
import { Wallet } from 'lucide-react';
import LoadingSpinner from '../Shared/LoadingSpinner';
import ErrorAlert from '../Shared/ErrorAlert';

const BalanceSheet = () => {
  const { handleError } = useError();
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalanceSheet = async () => {
      try {
        const response = await axios.get('/api/financial-reports/balance-sheet/');
        setBalanceSheet(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBalanceSheet();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        <Wallet className="inline-block mr-2" />
        Balance Sheet
      </h2>
      {balanceSheet ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold">Assets:</span>
              <span>${balanceSheet.assets.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Liabilities:</span>
              <span>${balanceSheet.liabilities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-4">
              <span className="font-semibold">Equity:</span>
              <span>${balanceSheet.equity.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <ErrorAlert message="Failed to load balance sheet data" />
      )}
    </div>
  );
};

export default BalanceSheet;