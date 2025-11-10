// src/components/Modules/CashflowStatement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useError } from '../../contexts/ErrorContext';
import { Activity } from 'lucide-react';
import LoadingSpinner from '../Shared/LoadingSpinner';
import ErrorAlert from '../Shared/ErrorAlert';

const CashflowStatement = () => {
  const { handleError } = useError();
  const [cashflowStatement, setCashflowStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCashflowStatement = async () => {
      try {
        const response = await axios.get('/api/financial-reports/cashflow-statement/');
        setCashflowStatement(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCashflowStatement();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        <Activity className="inline-block mr-2" />
        Cash Flow Statement
      </h2>
      {cashflowStatement ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold">Operating Activities:</span>
              <span>${cashflowStatement.operatingActivities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Investing Activities:</span>
              <span>${cashflowStatement.investingActivities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Financing Activities:</span>
              <span>${cashflowStatement.financingActivities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-4">
              <span className="font-semibold">Net Cash Flow:</span>
              <span>${cashflowStatement.netCashFlow.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <ErrorAlert message="Failed to load cash flow statement data" />
      )}
    </div>
  );
};

export default CashflowStatement;