import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department: string;
  position: string;
  basic_salary: number;
  allowances: number;
  is_active: boolean;
  hire_date: string;
}

interface PayrollRecord {
  id: number;
  employee_name: string;
  employee_number: string;
  period: string;
  basic_salary: number;
  allowances: number;
  overtime_pay: number;
  bonuses: number;
  deductions: number;
  tax_amount: number;
  nhima_amount: number;
  aids_levy_amount: number;
  gross_pay: number;
  net_pay: number;
  status: string;
  status_display: string;
  processed_date: string;
}

interface Payslip {
  id: number;
  employee_name: string;
  employee_number: string;
  period: string;
  basic_salary: number;
  allowances: number;
  overtime_pay: number;
  bonuses: number;
  deductions: number;
  tax_amount: number;
  nhima_amount: number;
  aids_levy_amount: number;
  gross_pay: number;
  net_pay: number;
  generated_date: string;
  status: string;
  status_display: string;
}

const Payroll: React.FC = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [payrollEndpoint, setPayrollEndpoint] = useState<'/payrolls/' | '/payroll/'>('/payrolls/');
  const [payslipEndpoint, setPayslipEndpoint] = useState<'/payslips/' | '/payslip/'>('/payslips/');

  const tabs = [
    { key: 'employees', label: 'Employees' },
    { key: 'payroll', label: 'Payroll Records' },
    { key: 'payslips', label: 'Payslips' },
    { key: 'processing', label: 'Process Payroll' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'employees':
          const employeesResponse = await api.get('/employees/');
          {
            const data = employeesResponse.data?.results ?? employeesResponse.data ?? [];
            setEmployees(Array.isArray(data) ? data : []);
          }
          break;
        case 'payroll':
          try {
            const payrollResponse = await api.get('/payrolls/');
            setPayrollEndpoint('/payrolls/');
            const data = payrollResponse.data?.results ?? payrollResponse.data ?? [];
            setPayrollRecords(Array.isArray(data) ? data : []);
          } catch (err: any) {
            if (err?.response?.status === 404) {
              const pr = await api.get('/payroll/');
              setPayrollEndpoint('/payroll/');
              const data = pr.data?.results ?? pr.data ?? [];
              setPayrollRecords(Array.isArray(data) ? data : []);
            } else {
              throw err;
            }
          }
          break;
        case 'payslips':
          try {
            const payslipsResponse = await api.get('/payslips/');
            setPayslipEndpoint('/payslips/');
            const data = payslipsResponse.data?.results ?? payslipsResponse.data ?? [];
            setPayslips(Array.isArray(data) ? data : []);
          } catch (err: any) {
            if (err?.response?.status === 404) {
              try {
                const pr = await api.get('/payslip/');
                setPayslipEndpoint('/payslip/');
                const data = pr.data?.results ?? pr.data ?? [];
                setPayslips(Array.isArray(data) ? data : []);
              } catch (err2: any) {
                if (err2?.response?.status === 404) {
                  // Neither endpoint exists; treat as no payslips available
                  setPayslips([]);
                } else {
                  throw err2;
                }
              }
            } else {
              throw err;
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayroll = async (data: any) => {
    setProcessing(true);
    try {
      try {
        await api.post('/payrolls/process/', data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          await api.post('/payroll/process/', data);
        } else {
          throw err;
        }
      }
      fetchData();
    } catch (error) {
      console.error('Error processing payroll:', error);
    } finally {
      setProcessing(false);
    }
  };

  const generatePayslip = async (employeeId: number, period: string) => {
    try {
      try {
        await api.post('/payslips/generate/', {
          employee_id: employeeId,
          period: period
        });
      } catch (err: any) {
        if (err?.response?.status === 404) {
          await api.post('/payslip/generate/', {
            employee_id: employeeId,
            period: period
          });
        } else {
          throw err;
        }
      }
      fetchData();
    } catch (error) {
      console.error('Error generating payslip:', error);
    }
  };

  const downloadPayslip = async (payslipId: number) => {
    try {
      let response;
      try {
        response = await api.get(`/payslips/${payslipId}/download/`, { responseType: 'blob' });
      } catch (err: any) {
        if (err?.response?.status === 404) {
          response = await api.get(`/payslip/${payslipId}/download/`, { responseType: 'blob' });
        } else {
          throw err;
        }
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading payslip:', error);
    }
  };

  // Employee update/delete
  const handleEmployeeEdit = (emp: Employee) => {
    setModalType('employee');
    setFormData(emp);
    setShowModal(true);
  };
  const handleEmployeeDelete = async (id: number) => {
    if (window.confirm('Delete this employee?')) {
      try {
        await api.delete(`/employees/${id}/`);
        toast.success('Employee deleted!');
        fetchData();
      } catch {
        toast.error('Failed to delete employee');
      }
    }
  };
  // Payroll record update/delete
  const handlePayrollEdit = (record: PayrollRecord) => {
    setModalType('payroll');
    setFormData(record);
    setShowModal(true);
  };
  const handlePayrollDelete = async (id: number) => {
    if (window.confirm('Delete this payroll record?')) {
      try {
        if (payrollEndpoint === '/payrolls/') {
          await api.delete(`/payrolls/${id}/`);
        } else {
          await api.delete(`/payroll/${id}/`);
        }
        toast.success('Payroll record deleted!');
        fetchData();
      } catch {
        toast.error('Failed to delete payroll record');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      switch (modalType) {
        case 'employee':
          if (formData.id) {
            await api.put(`/employees/${formData.id}/`, formData);
            toast.success('Employee updated!');
          } else {
            await api.post('/employees/', formData);
            toast.success('Employee added!');
          }
          break;
        case 'payroll':
          if (formData.id) {
            if (payrollEndpoint === '/payrolls/') {
              await api.put(`/payrolls/${formData.id}/`, formData);
            } else {
              await api.put(`/payroll/${formData.id}/`, formData);
            }
            toast.success('Payroll record updated!');
          }
          break;
        case 'payroll-processing':
          await processPayroll(formData);
          break;
      }
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (error) {
      toast.error('Failed to save record');
      console.error('Error creating record:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: string) => {
    setModalType(type);
    setShowModal(true);
    setFormData({});
  };

  const renderEmployees = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Employees</h3>
        <button
          onClick={() => openModal('employee')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Add Employee
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Employee #</th>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Department</th>
              <th className="py-2 px-4 text-left">Position</th>
              <th className="py-2 px-4 text-left">Basic Salary</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-medium">{employee.employee_number}</td>
                <td className="py-2 px-4">{`${employee.first_name} ${employee.last_name}`}</td>
                <td className="py-2 px-4">{employee.department}</td>
                <td className="py-2 px-4">{employee.position}</td>
                <td className="py-2 px-4">${employee.basic_salary.toLocaleString()}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 px-4">
                  <button 
                    onClick={() => generatePayslip(employee.id, new Date().toISOString().slice(0, 7))}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2"
                  >
                    Generate Payslip
                  </button>
                  <button onClick={() => handleEmployeeEdit(employee)} className="text-blue-600 hover:underline mr-2">Edit</button>
                  <button onClick={() => handleEmployeeDelete(employee.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayrollRecords = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Payroll Records</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 text-left">Employee</th>
              <th className="py-2 px-4 text-left">Period</th>
              <th className="py-2 px-4 text-left">Basic Salary</th>
              <th className="py-2 px-4 text-left">Allowances</th>
              <th className="py-2 px-4 text-left">Gross Pay</th>
              <th className="py-2 px-4 text-left">Net Pay</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Processed Date</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrollRecords.map(record => (
              <tr key={record.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{record.employee_name}</td>
                <td className="py-2 px-4">{record.period}</td>
                <td className="py-2 px-4">${record.basic_salary.toLocaleString()}</td>
                <td className="py-2 px-4">${record.allowances.toLocaleString()}</td>
                <td className="py-2 px-4 font-semibold">${record.gross_pay.toLocaleString()}</td>
                <td className="py-2 px-4 font-semibold text-green-600">${record.net_pay.toLocaleString()}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    record.status === 'PROCESSED' ? 'bg-green-100 text-green-800' :
                    record.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.status_display}
                  </span>
                </td>
                <td className="py-2 px-4">{new Date(record.processed_date).toLocaleDateString()}</td>
                <td className="py-2 px-4">
                  <button onClick={() => handlePayrollEdit(record)} className="text-blue-600 hover:underline mr-2">Edit</button>
                  <button onClick={() => handlePayrollDelete(record.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayslips = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Payslips</h3>
                  </div>
      {payslips.length === 0 ? (
        <div className="text-sm text-gray-600 bg-gray-50 border rounded p-4">
          No payslips available yet. Once payroll is processed and payslips are generated, they will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map(payslip => (
            <div key={payslip.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{payslip.employee_name}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                payslip.status === 'GENERATED' ? 'bg-green-100 text-green-800' :
                payslip.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {payslip.status_display}
              </span>
              </div>
            <p className="text-sm text-gray-600 mb-2">Employee #: {payslip.employee_number}</p>
            <p className="text-sm text-gray-600 mb-3">Period: {payslip.period}</p>
            <div className="space-y-1 mb-3">
              <p className="text-sm">Basic: <span className="font-semibold">${payslip.basic_salary.toLocaleString()}</span></p>
              <p className="text-sm">Allowances: <span className="font-semibold">${payslip.allowances.toLocaleString()}</span></p>
              <p className="text-sm">Gross: <span className="font-semibold text-blue-600">${payslip.gross_pay.toLocaleString()}</span></p>
              <p className="text-sm">Net: <span className="font-semibold text-green-600">${payslip.net_pay.toLocaleString()}</span></p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{new Date(payslip.generated_date).toLocaleDateString()}</span>
              {payslip.status === 'GENERATED' && (
                <button 
                  onClick={() => downloadPayslip(payslip.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Download
                </button>
          )}
        </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPayrollProcessing = () => (
        <div>
          <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Process Payroll</h3>
        <button 
          onClick={() => openModal('payroll-processing')}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition"
        >
          Process Payroll
        </button>
      </div>
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold mb-4">Payroll Processing</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h5 className="font-semibold mb-2">Active Employees</h5>
            <p className="text-2xl font-bold text-blue-600">{employees.filter(e => e.is_active).length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h5 className="font-semibold mb-2">Total Basic Salary</h5>
            <p className="text-2xl font-bold text-green-600">
              ${employees.filter(e => e.is_active).reduce((sum, e) => sum + e.basic_salary, 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <h5 className="font-semibold mb-2">Processing Instructions</h5>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Select the payroll period you want to process</li>
            <li>Review employee data and make any necessary adjustments</li>
            <li>Calculate taxes, NHIMA, and other deductions</li>
            <li>Generate payslips for all employees</li>
            <li>Download or email payslips to employees</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    const getModalTitle = () => {
      switch (modalType) {
        case 'employee': return 'Add Employee';
        case 'payroll-processing': return 'Process Payroll';
        default: return 'Add Record';
      }
    };

    const getModalFields = () => {
      switch (modalType) {
        case 'employee':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Employee Number"
                value={formData.employee_number || ''}
                onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="First Name"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Last Name"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Phone Number"
                value={formData.phone_number || ''}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Department"
                value={formData.department || ''}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                placeholder="Position"
                value={formData.position || ''}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Basic Salary"
                value={formData.basic_salary || ''}
                onChange={(e) => setFormData({...formData, basic_salary: parseFloat(e.target.value)})}
              />
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="number"
                placeholder="Allowances"
                value={formData.allowances || ''}
                onChange={(e) => setFormData({...formData, allowances: parseFloat(e.target.value)})}
              />
            </>
          );
        case 'payroll-processing':
          return (
            <>
              <input 
                className="w-full border rounded px-3 py-2 mb-3" 
                type="month"
                placeholder="Payroll Period"
                value={formData.period || ''}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
              />
              <div className="bg-yellow-50 p-3 rounded mb-3">
                <p className="text-sm text-yellow-800">
                  This will process payroll for all active employees for the selected period. 
                  Make sure all employee data is up to date before processing.
                </p>
              </div>
            </>
          );
        default:
          return null;
      }
    };

    return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h4 className="text-lg font-bold mb-4">{getModalTitle()}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            {getModalFields()}
                  <div className="flex justify-end gap-2">
              <button 
                type="button" 
                className="px-4 py-2 rounded bg-gray-200" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-blue-600 text-white"
                disabled={loading || processing}
              >
                {loading || processing ? 'Processing...' : 'Save'}
              </button>
                  </div>
                </form>
              </div>
            </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-4 text-green-700">Payroll Management</h2>
      
      <div className="mb-6 flex gap-4 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors duration-150 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'border-green-600 text-green-700' 
                : 'border-transparent text-gray-500 hover:text-green-600'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'employees' && renderEmployees()}
          {activeTab === 'payroll' && renderPayrollRecords()}
          {activeTab === 'payslips' && renderPayslips()}
          {activeTab === 'processing' && renderPayrollProcessing()}
        </>
      )}

      {renderModal()}
    </div>
  );
};

export default Payroll; 