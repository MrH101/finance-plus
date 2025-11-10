// src/components/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Package, Plus, Download, Trash2, Edit } from 'lucide-react';
import axios from 'axios';
import { useError } from '../contexts/ErrorContext';
import { useReactTable } from '@tanstack/react-table';

const productSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  price: Yup.number().min(0.01).required('Required'),
  reorder_quantity: Yup.number().min(1).required('Required')
});

const ProductManagement = () => {
  const { handleError } = useError();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      price: '',
      reorder_quantity: '',
      description: ''
    },
    validationSchema: productSchema,
    onSubmit: async (values) => {
      try {
        const response = await axios.post('/api/products/', {
          ...values,
          price: parseFloat(values.price)
        });
        setProducts([...products, response.data]);
        formik.resetForm();
      } catch (err) {
        handleError(err);
      }
    }
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/products/');
        setProducts(response.data);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const columns = React.useMemo(() => [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Price', accessorKey: 'price' },
    { header: 'Stock', accessorKey: 'quantity' },
    { header: 'Reorder Level', accessorKey: 'reorder_quantity' }
  ], []);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel:getCoreRowModel(),
  });

  const exportCSV = () => {
    const csvContent = [
      ['Name', 'Price', 'Stock', 'Reorder Level'],
      ...products.map(p => [p.name, p.price, p.quantity, p.reorder_quantity])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Package className="mr-2" />
        Product Management
      </h2>

      <form onSubmit={formik.handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              name="name"
              placeholder="Product Name"
              className={`w-full p-2 border rounded ${formik.errors.name ? 'border-red-500' : ''}`}
              {...formik.getFieldProps('name')}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="text-red-500 text-sm">{formik.errors.name}</div>
            )}
          </div>
          
          <div>
            <input
              name="price"
              type="number"
              placeholder="Price"
              className={`w-full p-2 border rounded ${formik.errors.price ? 'border-red-500' : ''}`}
              {...formik.getFieldProps('price')}
            />
            {formik.touched.price && formik.errors.price && (
              <div className="text-red-500 text-sm">{formik.errors.price}</div>
            )}
          </div>

          {/* Add other form fields similarly */}
        </div>

        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          disabled={loading}
        >
          {loading ? 'Saving...' : (
            <>
              <Plus className="mr-2" />
              Add Product
            </>
          )}
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="text-left p-4">
                    {header.column.columnDef.header}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-4">
                    {cell.getValue()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 flex justify-between items-center">
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
          >
            <Download className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};