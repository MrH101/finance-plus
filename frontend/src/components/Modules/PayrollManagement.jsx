// src/components/Modules/PayrollManagement.jsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useError } from '../../contexts/ErrorContext';
import { DollarSign, Calculator } from 'lucide-react';

const PayrollManagement = () => {
  const { handleError } = useError();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);

  const validationSchema = Yup.object({
    employeeId: Yup.string().required('Required'),
    period: Yup.string().required('Required'),
    grossSalary: Yup.number().min(0.01).required('Required'),
  });

  const formik = useFormik({
    initialValues: {
      employeeId: '',
      period: 'monthly',
      grossSalary: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await axios.post('/api/payroll/', values);
        setPayrolls([...payrolls, response.data]);
      } catch (error) {
        handleError(error);
      }
    },
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('/api/employees/');
        setEmployees(response.data);
      } catch (error) {
        handleError(error);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        <Calculator className="inline-block mr-2" />
        Payroll Management
      </h2>
      {/* Form and table implementation */}
    </div>
  );
};
export default PayrollManagement;