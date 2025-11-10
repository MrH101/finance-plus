// src/components/Modules/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useError } from '../../contexts/ErrorContext';
import { useReactTable } from '@tanstack/react-table';
import { Package, Plus, Download } from 'lucide-react';

const ProductManagement = () => {
  const { handleError } = useError();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    name: Yup.string().required('Product name is required'),
    price: Yup.number().min(0.01).required('Price is required'),
    reorder_quantity: Yup.number().min(1).required('Reorder quantity is required'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      price: '',
      description: '',
      reorder_quantity: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await axios.post('/api/products/', values);
        setProducts([...products, response.data]);
        formik.resetForm();
      } catch (error) {
        handleError(error);
      }
    },
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/products/');
        setProducts(response.data);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Table configuration
  const table = useReactTable({
    data: products,
    columns: [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Price', accessorKey: 'price' },
      { header: 'Stock', accessorKey: 'quantity' },
      { header: 'Reorder Level', accessorKey: 'reorder_quantity' },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        <Package className="inline-block mr-2" />
        Product Management
      </h2>
      {/* Form and table implementation */}
    </div>
  );
};
export default ProductManagement;