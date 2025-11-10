import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, Smartphone, User, Calendar, Phone } from 'lucide-react';
import Modal from './Modal';
import Input from './common/Input';
import Button from './common/Button';
import { useError } from '../context/ErrorContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface MobileMoneyAccount {
  id?: number;
  provider: string;
  phone_number: string;
  account_name: string;
  opening_balance: number;
  is_active: boolean;
}

interface MobileMoneyAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  mobileAccount?: MobileMoneyAccount | null;
  onSuccess?: () => void;
}

const MobileMoneyAccountModal = ({ isOpen, onClose, mobileAccount, onSuccess }: MobileMoneyAccountModalProps) => {
  const { handleError } = useError();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const providerOptions = [
    { value: 'ECOCASH', label: 'EcoCash' },
    { value: 'ONEMONEY', label: 'OneMoney' },
    { value: 'INNOV8', label: 'InnBucks' },
    { value: 'TELECASH', label: 'TeleCash' },
  ];

  const formik = useFormik({
    initialValues: {
      provider: mobileAccount?.provider || '',
      phone_number: mobileAccount?.phone_number || '',
      account_name: mobileAccount?.account_name || '',
      opening_balance: mobileAccount?.opening_balance || 0,
      is_active: mobileAccount?.is_active ?? true,
    },
    validationSchema: Yup.object({
      provider: Yup.string().required('Provider is required'),
      phone_number: Yup.string()
        .required('Phone number is required')
        .matches(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number'),
      account_name: Yup.string()
        .required('Account name is required')
        .min(2, 'Account name must be at least 2 characters'),
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

        const mobileAccountData = {
          provider: values.provider,
          phone_number: values.phone_number,
          account_name: values.account_name,
          opening_balance: parseFloat(values.opening_balance as any),
          is_active: values.is_active,
        };

        console.log('Sending mobile money account data:', mobileAccountData);

        if (mobileAccount?.id) {
          await api.put(`/mobile-money-accounts/${mobileAccount.id}/`, mobileAccountData);
          toast.success('Mobile money account updated successfully!');
        } else {
          await api.post('/mobile-money-accounts/', mobileAccountData);
          toast.success('Mobile money account created successfully!');
        }

        onSuccess?.();
        onClose();
        formik.resetForm();
      } catch (error: any) {
        console.error('Mobile money account error details:', error.response?.data);
        handleError(error);
        toast.error(`Failed to save mobile money account: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
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

  // Reset form when mobileAccount prop changes
  useEffect(() => {
    if (mobileAccount) {
      formik.setValues({
        provider: mobileAccount.provider || '',
        phone_number: mobileAccount.phone_number || '',
        account_name: mobileAccount.account_name || '',
        opening_balance: mobileAccount.opening_balance || 0,
        is_active: mobileAccount.is_active ?? true,
      });
    } else {
      formik.resetForm();
    }
  }, [mobileAccount]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mobileAccount ? 'Edit Mobile Money Account' : 'Add New Mobile Money Account'}
      size="lg"
      showCloseButton={true}
    >
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Provider */}
        <div>
          <label className="label">Provider</label>
          <select
            name="provider"
            value={formik.values.provider}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="input"
            required
          >
            <option value="">Select a provider</option>
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formik.touched.provider && formik.errors.provider && (
            <div className="form-error">{formik.errors.provider}</div>
          )}
        </div>

        {/* Phone Number and Account Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            name="phone_number"
            placeholder="+263771234567"
            leftIcon={<Phone className="h-4 w-4" />}
            value={formik.values.phone_number}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phone_number && formik.errors.phone_number ? formik.errors.phone_number : undefined}
            required
          />

          <Input
            label="Account Name"
            type="text"
            name="account_name"
            placeholder="Business Mobile Money"
            leftIcon={<User className="h-4 w-4" />}
            value={formik.values.account_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.account_name && formik.errors.account_name ? formik.errors.account_name : undefined}
            required
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
            {mobileAccount ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MobileMoneyAccountModal; 