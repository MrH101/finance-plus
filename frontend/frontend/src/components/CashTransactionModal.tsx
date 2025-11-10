import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, DollarSign, Calendar, Tag, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import Modal from './Modal';
import Input from './common/Input';
import Button from './common/Button';
import { useError } from '../context/ErrorContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface CashTransaction {
  id?: number;
  flow_type: 'INFLOW' | 'OUTFLOW';
  amount: number;
  source: string;
  description: string;
  flow_date: string;
}

interface CashTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashTransaction?: CashTransaction | null;
  onSuccess?: () => void;
}

const CashTransactionModal = ({ isOpen, onClose, cashTransaction, onSuccess }: CashTransactionModalProps) => {
  const { handleError } = useError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourceOptions = [
    { value: 'SALES', label: 'Sales' },
    { value: 'PURCHASES', label: 'Purchases' },
    { value: 'PAYROLL', label: 'Payroll' },
    { value: 'RENT', label: 'Rent' },
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'TAXES', label: 'Taxes' },
    { value: 'OTHER', label: 'Other' },
  ];

  const formik = useFormik({
    initialValues: {
      flow_type: cashTransaction?.flow_type || 'INFLOW',
      amount: cashTransaction?.amount || '',
      source: cashTransaction?.source || '',
      description: cashTransaction?.description || '',
      flow_date: cashTransaction?.flow_date || new Date().toISOString().split('T')[0],
    },
    validationSchema: Yup.object({
      flow_type: Yup.string().oneOf(['INFLOW', 'OUTFLOW']).required('Flow type is required'),
      amount: Yup.number()
        .positive('Amount must be positive')
        .required('Amount is required')
        .min(0.01, 'Amount must be at least 0.01'),
      source: Yup.string().required('Source is required'),
      description: Yup.string()
        .required('Description is required')
        .min(5, 'Description must be at least 5 characters'),
      flow_date: Yup.date().required('Date is required').max(new Date(), 'Date cannot be in the future'),
    }),
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        
        const accessToken = localStorage.getItem('access');
        if (!accessToken) {
          throw new Error('No authentication token found. Please log in again.');
        }

        const cashTransactionData = {
          flow_type: values.flow_type,
          amount: parseFloat(values.amount as any),
          source: values.source,
          description: values.description,
          flow_date: values.flow_date,
        };

        console.log('Sending cash transaction data:', cashTransactionData);

        if (cashTransaction?.id) {
          await api.put(`/cash-flows/${cashTransaction.id}/`, cashTransactionData);
          toast.success('Cash transaction updated successfully!');
        } else {
          await api.post('/cash-flows/', cashTransactionData);
          toast.success('Cash transaction added successfully!');
        }

        onSuccess?.();
        onClose();
        formik.resetForm();
      } catch (error: any) {
        console.error('Cash transaction error details:', error.response?.data);
        handleError(error);
        toast.error(`Failed to save cash transaction: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      formik.resetForm();
    }
  };

  // Reset form when cashTransaction prop changes
  useEffect(() => {
    if (cashTransaction) {
      formik.setValues({
        flow_type: cashTransaction.flow_type || 'INFLOW',
        amount: cashTransaction.amount || '',
        source: cashTransaction.source || '',
        description: cashTransaction.description || '',
        flow_date: cashTransaction.flow_date || new Date().toISOString().split('T')[0],
      });
    } else {
      formik.resetForm();
    }
  }, [cashTransaction]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={cashTransaction ? 'Edit Cash Transaction' : 'Add New Cash Transaction'}
      size="lg"
      showCloseButton={true}
    >
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Flow Type */}
        <div>
          <label className="label">Transaction Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => formik.setFieldValue('flow_type', 'INFLOW')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                formik.values.flow_type === 'INFLOW'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Cash Inflow
            </button>
            <button
              type="button"
              onClick={() => formik.setFieldValue('flow_type', 'OUTFLOW')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                formik.values.flow_type === 'OUTFLOW'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              Cash Outflow
            </button>
          </div>
          {formik.touched.flow_type && formik.errors.flow_type && (
            <div className="form-error">{formik.errors.flow_type}</div>
          )}
        </div>

        {/* Amount */}
        <Input
          label="Amount"
          type="number"
          name="amount"
          placeholder="0.00"
          step="0.01"
          min="0"
          leftIcon={<DollarSign className="h-4 w-4" />}
          value={formik.values.amount}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.amount && formik.errors.amount ? formik.errors.amount : undefined}
          required
        />

        {/* Source */}
        <div>
          <label className="label">Source</label>
          <select
            name="source"
            value={formik.values.source}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="input"
            required
          >
            <option value="">Select a source</option>
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formik.touched.source && formik.errors.source && (
            <div className="form-error">{formik.errors.source}</div>
          )}
        </div>

        {/* Description */}
        <Input
          label="Description"
          name="description"
          placeholder="Enter transaction description..."
          leftIcon={<FileText className="h-4 w-4" />}
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.description && formik.errors.description ? formik.errors.description : undefined}
          required
        />

        {/* Date */}
        <Input
          label="Date"
          type="date"
          name="flow_date"
          leftIcon={<Calendar className="h-4 w-4" />}
          value={formik.values.flow_date}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.flow_date && formik.errors.flow_date ? formik.errors.flow_date : undefined}
          required
        />

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {cashTransaction ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CashTransactionModal; 