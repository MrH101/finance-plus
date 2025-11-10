// src/components/Modules/IncomeStatement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useError } from '../../contexts/ErrorContext';
import { TrendingUp } from 'lucide-react';
import LoadingSpinner from '../Shared/LoadingSpinner';
import ErrorAlert from '../Shared/ErrorAlert';

const IncomeStatement = () => {
  const { handleError } = useError();
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncomeStatement = async () => {
      try {
        const response = await axios.get('/api/financial-reports/income-statement/');
        setIncomeStatement(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncomeStatement();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        <TrendingUp className="inline-block mr-2" />
        Income Statement
      </h2>
      {incomeStatement ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold">Revenue:</span>
              <span>${incomeStatement.revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Expenses:</span>
              <span>${incomeStatement.expenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-4">
              <span className="font-semibold">Net Income:</span>
              <span>${incomeStatement.netIncome.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <ErrorAlert message="Failed to load income statement data" />
      )}
    </div>
  );
};

export default IncomeStatement;