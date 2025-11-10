// src/components/Modules/StoreManagement.jsx
import React, { useState, useEffect } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import axios from 'axios'
import { useError } from '../../contexts/ErrorContext'
import { Building, Plus, Download } from 'lucide-react'
import { useReactTable } from '@tanstack/react-table'

const StoreManagement = () => {
  const { handleError } = useError()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(false)

  const validationSchema = Yup.object({
    name: Yup.string().required('Required'),
    address: Yup.string().required('Required'),
    vat_number: Yup.string().required('Required')
  })

  const formik = useFormik({
    initialValues: {
      name: '',
      address: '',
      vat_number: '',
      contact_number: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await axios.post('/api/stores/', values)
        setStores([...stores, response.data])
        formik.resetForm()
      } catch (error) {
        handleError(error)
      }
    }
  })

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/stores/')
        setStores(response.data)
      } catch (error) {
        handleError(error)
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  // Table configuration
  const table = useReactTable({
    data: stores,
    columns: [
      { header: 'Name', accessorKey: 'name' },
      { header: 'VAT Number', accessorKey: 'vat_number' },
      { header: 'Address', accessorKey: 'address' },
      { header: 'Contact', accessorKey: 'contact_number' }
    ],
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">
        <Building className="inline-block mr-2" />
        Store Management
      </h2>
      
      {/* Form and table implementation */}
    </div>
  )
}

export default StoreManagement