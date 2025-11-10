import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import Modal from './Modal';
import { useApi } from '../hooks/useApi';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

const userSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  role: Yup.string().required('Role is required'),
  status: Yup.string().oneOf(['active', 'inactive']).required('Status is required'),
});

export function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const { post, put } = useApi<User>();

  const initialValues: Omit<User, 'id'> = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    status: user?.status || 'active',
  };

  const handleSubmit = async (values: Omit<User, 'id'>) => {
    try {
      if (user) {
        await put(`/users/${user.id}`, values, {
          successMessage: 'User updated successfully',
          errorMessage: 'Failed to update user',
        });
      } else {
        await post('/users', values, {
          successMessage: 'User created successfully',
          errorMessage: 'Failed to create user',
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      // Error is handled by useApi hook
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit User' : 'Add User'}
      size="md"
    >
      <Formik
        initialValues={initialValues}
        validationSchema={userSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Field
                type="text"
                name="name"
                id="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && touched.name && (
                <div className="mt-1 text-sm text-red-600">{errors.name}</div>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Field
                type="email"
                name="email"
                id="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.email && touched.email && (
                <div className="mt-1 text-sm text-red-600">{errors.email}</div>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <Field
                as="select"
                name="role"
                id="role"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="manager">Manager</option>
              </Field>
              {errors.role && touched.role && (
                <div className="mt-1 text-sm text-red-600">{errors.role}</div>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <Field
                as="select"
                name="status"
                id="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Field>
              {errors.status && touched.status && (
                <div className="mt-1 text-sm text-red-600">{errors.status}</div>
              )}
            </div>

            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : user ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
} 