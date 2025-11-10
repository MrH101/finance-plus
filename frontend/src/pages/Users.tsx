import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { DataTable } from '../components/DataTable';
import { UserModal } from '../components/UserModal';
import { toast } from 'react-hot-toast';
import { userService, User } from '../services/userService';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof User },
    { header: 'Email', accessor: 'email' as keyof User },
    { header: 'Role', accessor: 'role' as keyof User },
    {
      header: 'Status',
      accessor: 'status' as keyof User,
      render: (value: string) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    { header: 'Created', accessor: 'created_at' as keyof User },
    {
      header: 'Actions',
      accessor: 'id' as keyof User,
      render: (value: string, row: User) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="text-blue-600 hover:text-blue-900"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-red-600 hover:text-red-900"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalSuccess = () => {
    // Refresh the users list after successful operation
    fetchUsers();
    handleModalClose();
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            pageSize={10}
            onRowClick={handleEdit}
          />
        )}

        <UserModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          user={selectedUser}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
};

export default Users; 