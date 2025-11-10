// src/components/PayrollCalculator.jsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DollarSign, Calculator, Download } from 'lucide-react';
import axios from 'axios';
import { useError } from '../contexts/ErrorContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PayrollPDF } from './PayrollPDF';

const PayrollCalculator = () => {
  const { handleError } = useError();
  const [calculation, setCalculation] = useState(null);
  const [employees, setEmployees] = useState([]);

  const formik = useFormik({
    initialValues: {
      employeeId: '',
      period: 'monthly',
      grossSalary: ''
    },
    validationSchema: Yup.object({
      employeeId: Yup.string().required('Required'),
      grossSalary: Yup.number().min(0.01).required('Required')
    }),
    onSubmit: async (values) => {
      try {
        const response = await axios.post('/api/payroll/calculate/', values);
        setCalculation(response.data);
      } catch (err) {
        handleError(err);
      }
    }
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('/api/employees/');
        setEmployees(response.data);
      } catch (err) {
        handleError(err);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Calculator className="mr-2" />
        Payroll Calculator
      </h2>

      <form onSubmit={formik.handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        {/* Form fields */}

        {calculation && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Tax Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Gross Salary:</span>
                <span>${calculation.gross_salary}</span>
              </div>
              <div className="flex justify-between">
                <span>NSSA Levy (9%):</span>
                <span>${calculation.nssa_levy}</span>
              </div>
              <div className="flex justify-between">
                <span>PAYE:</span>
                <span>${calculation.paye}</span>
              </div>
              <div className="flex justify-between">
                <span>AIDS Levy (3%):</span>
                <span>${calculation.aids_levy}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Net Salary:</span>
                <span>${calculation.net_salary}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <PDFDownloadLink
                document={<PayrollPDF data={calculation} />}
                fileName="payroll.pdf"
              >
                {({ loading }) => (
                  <button className="bg-red-600 text-white px-4 py-2 rounded flex items-center">
                    <Download className="mr-2" />
                    {loading ? 'Generating...' : 'Export PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};