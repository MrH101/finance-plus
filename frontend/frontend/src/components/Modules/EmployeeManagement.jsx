// src/components/Modules/EmployeeManagement.jsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useError } from '../../contexts/ErrorContext';
import { Users, Plus, Download } from 'lucide-react';

const EmployeeManagement = () => {
  const { handleError } = useError();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    role: Yup.string().required('Required'),
    salary: Yup.number().min(0).required('Required'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      role: 'EMPLOYEE',
      salary: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await axios.post('/api/employees/', values);
        setEmployees([...employees, response.data]);
        formik.resetForm();
      } catch (error) {
        handleError(error);
      }
    },
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/employees/');
        setEmployees(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        <Users className="inline-block mr-2" />
        Employee Management
      </h2>
      {/* Form and table implementation */}
    </div>
  );
};
export default EmployeeManagement;