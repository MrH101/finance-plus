import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, Building2, CreditCard, Hash, User, Calendar } from 'lucide-react';
import Modal from './Modal';
import Input from './common/Input';
import Button from './common/Button';
import { useError } from '../context/ErrorContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface BankAccount {
  id?: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  account_type: string;
  branch_code?: string;
  swift_code?: string;
  opening_balance: number;
  is_active: boolean;
}

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccount?: BankAccount | null;
  onSuccess?: () => void;
}

const BankAccountModal = ({ isOpen, onClose, bankAccount, onSuccess }: BankAccountModalProps) => {
  const { handleError } = useError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bankOptions = [
    { value: 'CBZ', label: 'CBZ Bank' },
    { value: 'STANBIC', label: 'Stanbic Bank' },
    { value: 'ECOBANK', label: 'Ecobank' },
    { value: 'FBC', label: 'FBC Bank' },
    { value: 'ZB', label: 'ZB Bank' },
    { value: 'NMB', label: 'NMB Bank' },
    { value: 'OTHER', label: 'Other Bank' },
  ];

  const accountTypeOptions = [
    { value: 'CURRENT', label: 'Current Account' },
    { value: 'SAVINGS', label: 'Savings Account' },
    { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
  ];

  const formik = useFormik({
    initialValues: {
      bank_name: bankAccount?.bank_name || '',
      account_number: bankAccount?.account_number || '',
      account_name: bankAccount?.account_name || '',
      account_type: bankAccount?.account_type || 'CURRENT',
      branch_code: bankAccount?.branch_code || '',
      swift_code: bankAccount?.swift_code || '',
      opening_balance: bankAccount?.opening_balance || 0,
      is_active: bankAccount?.is_active ?? true,
    },
    validationSchema: Yup.object({
      bank_name: Yup.string().required('Bank name is required'),
      account_number: Yup.string()
        .required('Account number is required')
        .min(5, 'Account number must be at least 5 characters'),
      account_name: Yup.string()
        .required('Account name is required')
        .min(2, 'Account name must be at least 2 characters'),
      account_type: Yup.string().required('Account type is required'),
      branch_code: Yup.string().optional(),
      swift_code: Yup.string().optional(),
      opening_balance: Yup.number()
        .min(0, 'Opening balance cannot be negative')
        .required('Opening balance is required'),
      is_active: Yup.boolean().required(),
    }),
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        
        const accessToken = localStorage.getItem('access');
        if (!accessToken) {
          throw new Error('No authentication token found. Please log in again.');
        }

        const bankAccountData = {
          bank_name: values.bank_name,
          account_number: values.account_number,
          account_name: values.account_name,
          account_type: values.account_type,
          branch_code: values.branch_code,
          swift_code: values.swift_code,
          opening_balance: parseFloat(values.opening_balance as any),
          is_active: values.is_active,
        };

        console.log('Sending bank account data:', bankAccountData);

        if (bankAccount?.id) {
          await api.put(`/bank-accounts/${bankAccount.id}/`, bankAccountData);
          toast.success('Bank account updated successfully!');
        } else {
          await api.post('/bank-accounts/', bankAccountData);
          toast.success('Bank account created successfully!');
        }

        onSuccess?.();
        onClose();
        formik.resetForm();
      } catch (error: any) {
        console.error('Bank account error details:', error.response?.data);
        handleError(error);
        toast.error(`Failed to save bank account: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
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

  // Reset form when bankAccount prop changes
  useEffect(() => {
    if (bankAccount) {
      formik.setValues({
        bank_name: bankAccount.bank_name || '',
        account_number: bankAccount.account_number || '',
        account_name: bankAccount.account_name || '',
        account_type: bankAccount.account_type || 'CURRENT',
        branch_code: bankAccount.branch_code || '',
        swift_code: bankAccount.swift_code || '',
        opening_balance: bankAccount.opening_balance || 0,
        is_active: bankAccount.is_active ?? true,
      });
    } else {
      formik.resetForm();
    }
  }, [bankAccount]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={bankAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
      size="lg"
      showCloseButton={true}
    >
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Bank Name */}
        <div>
          <label className="label">Bank</label>
          <select
            name="bank_name"
            value={formik.values.bank_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="input"
            required
          >
            <option value="">Select a bank</option>
            {bankOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formik.touched.bank_name && formik.errors.bank_name && (
            <div className="form-error">{formik.errors.bank_name}</div>
          )}
        </div>

        {/* Account Number and Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Account Number"
            type="text"
            name="account_number"
            placeholder="1234567890"
            leftIcon={<Hash className="h-4 w-4" />}
            value={formik.values.account_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.account_number && formik.errors.account_number ? formik.errors.account_number : undefined}
            required
          />

          <Input
            label="Account Name"
            type="text"
            name="account_name"
            placeholder="Main Business Account"
            leftIcon={<User className="h-4 w-4" />}
            value={formik.values.account_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.account_name && formik.errors.account_name ? formik.errors.account_name : undefined}
            required
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="label">Account Type</label>
          <select
            name="account_type"
            value={formik.values.account_type}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="input"
            required
          >
            {accountTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formik.touched.account_type && formik.errors.account_type && (
            <div className="form-error">{formik.errors.account_type}</div>
          )}
        </div>

        {/* Branch Code and Swift Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Branch Code"
            type="text"
            name="branch_code"
            placeholder="HRE001"
            leftIcon={<Building2 className="h-4 w-4" />}
            value={formik.values.branch_code}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.branch_code && formik.errors.branch_code ? formik.errors.branch_code : undefined}
          />

          <Input
            label="Swift Code"
            type="text"
            name="swift_code"
            placeholder="CBZAZWWH"
            leftIcon={<CreditCard className="h-4 w-4" />}
            value={formik.values.swift_code}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.swift_code && formik.errors.swift_code ? formik.errors.swift_code : undefined}
          />
        </div>

        {/* Opening Balance */}
        <Input
          label="Opening Balance"
          type="number"
          name="opening_balance"
          placeholder="0.00"
          step="0.01"
          min="0"
          leftIcon={<Calendar className="h-4 w-4" />}
          value={formik.values.opening_balance}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.opening_balance && formik.errors.opening_balance ? formik.errors.opening_balance : undefined}
          required
        />

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formik.values.is_active}
            onChange={formik.handleChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Account is active
          </label>
        </div>

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
            {bankAccount ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BankAccountModal; 