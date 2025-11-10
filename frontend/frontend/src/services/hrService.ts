import api from './api';
import { 
  Employee, 
  EmployeeFormData, 
  LeaveRequest, 
  LeaveRequestFormData, 
  Payroll, 
  Overtime,
  EmployeeListResponse,
  LeaveBalanceResponse,
  HRDashboardStats,
  OrgChartNode
} from '../types/employee';

export class HRService {
  // Employee Management
  static async getEmployees(params?: {
    page?: number;
    search?: string;
    department?: number;
    status?: string;
    employment_type?: string;
  }): Promise<EmployeeListResponse> {
    const response = await api.get('/employees/', { params });
    return response.data;
  }

  static async getEmployee(id: number): Promise<Employee> {
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  }

  static async createEmployee(data: EmployeeFormData): Promise<Employee> {
    console.log('HRService createEmployee called with:', data);
    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'profile_photo' && value instanceof File) {
        formData.append(key, value);
      } else if (key === 'emergency_contacts') {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Log FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(`FormData ${key}:`, value);
    }

    try {
      console.log('Making API call to /employees/');
      const response = await api.post('/employees/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Employee created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Employee creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }

  static async updateEmployee(id: number, data: Partial<EmployeeFormData>): Promise<Employee> {
    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'profile_photo' && value instanceof File) {
        formData.append(key, value);
      } else if (key === 'emergency_contacts') {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await api.patch(`/employees/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  static async deleteEmployee(id: number): Promise<void> {
    await api.delete(`/employees/${id}/`);
  }

  // Get available users for employee creation
  static async getAvailableUsers(): Promise<any[]> {
    try {
      console.log('Fetching available users...');
      const response = await api.get('/users/available_for_employee/');
      console.log('Available users:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching available users:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // Get potential managers
  static async getPotentialManagers(): Promise<any[]> {
    const response = await api.get('/employees/potential_managers/');
    return response.data;
  }

  // Get modules
  static async getModules(): Promise<any[]> {
    const response = await api.get('/modules/');
    return response.data;
  }

  // Department Management
  static async createDepartment(data: any): Promise<any> {
    const response = await api.post('/departments/', data);
    return response.data;
  }

  static async updateDepartment(id: number, data: any): Promise<any> {
    const response = await api.patch(`/departments/${id}/`, data);
    return response.data;
  }

  static async deleteDepartment(id: number): Promise<void> {
    await api.delete(`/departments/${id}/`);
  }

  static async assignDepartmentManager(departmentId: number, employeeId: number): Promise<any> {
    const response = await api.post(`/departments/${departmentId}/assign_manager/`, {
      employee_id: employeeId
    });
    return response.data;
  }

  // Employee Self-Service
  static async getMyProfile(): Promise<any> {
    try {
      const response = await api.get('/employee-self-service/my_profile/');
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  static async getMyLeaveRequests(): Promise<any[]> {
    try {
      const response = await api.get('/employee-self-service/my_leave_requests/');
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return [];
      }
      throw err;
    }
  }

  static async requestLeave(data: any): Promise<any> {
    const response = await api.post('/employee-self-service/request_leave/', data);
    return response.data;
  }

  static async requestDepartmentChange(data: any): Promise<any> {
    const response = await api.post('/employee-self-service/request_department_change/', data);
    return response.data;
  }

  // Attendance Management
  static async getAttendance(params?: { employee?: number; date?: string; start_date?: string; end_date?: string; }): Promise<any[]> {
    const response = await api.get('/attendance/', { params });
    return response.data.results || response.data;
  }

  static async createAttendance(data: any): Promise<any> {
    const response = await api.post('/attendance/', data);
    return response.data;
  }

  static async updateAttendance(id: number, data: any): Promise<any> {
    const response = await api.patch(`/attendance/${id}/`, data);
    return response.data;
  }

  static async getTodayAttendanceForEmployee(employeeId: number, dateISO?: string): Promise<any | undefined> {
    const today = (dateISO || new Date().toISOString().slice(0, 10));
    const response = await api.get('/attendance/', { params: { employee: employeeId, date: today } });
    const list = response.data.results || response.data || [];
    return list[0];
  }

  // User Management
  static async getUsers(): Promise<any[]> {
    const response = await api.get('/users/');
    return response.data.results || response.data;
  }

  static async createUser(data: any): Promise<any> {
    const response = await api.post('/users/', data);
    return response.data;
  }

  static async updateUserPassword(userId: number, password: string): Promise<any> {
    const response = await api.patch(`/users/${userId}/`, { password });
    return response.data;
  }

  static async updateUserStatus(userId: number, isActive: boolean): Promise<any> {
    const response = await api.patch(`/users/${userId}/`, { is_active: isActive });
    return response.data;
  }

  // Leave Management
  static async getLeaveRequests(params?: {
    employee?: number;
    status?: string;
    leave_type?: string;
  }): Promise<LeaveRequest[]> {
    const response = await api.get('/leave-requests/', { params });
    return response.data;
  }

  static async createLeaveRequest(data: LeaveRequestFormData): Promise<LeaveRequest> {
    const response = await api.post('/leave-requests/', data);
    return response.data;
  }

  static async updateLeaveRequest(id: number, data: Partial<LeaveRequestFormData>): Promise<LeaveRequest> {
    const response = await api.patch(`/leave-requests/${id}/`, data);
    return response.data;
  }

  static async approveLeaveRequest(id: number): Promise<LeaveRequest> {
    const response = await api.post(`/leave-requests/${id}/approve/`);
    return response.data;
  }

  static async rejectLeaveRequest(id: number, reason?: string): Promise<LeaveRequest> {
    const response = await api.post(`/leave-requests/${id}/reject/`, { reason });
    return response.data;
  }

  // Payroll Management
  static async getPayrolls(params?: {
    employee?: number;
    status?: string;
    period_start?: string;
    period_end?: string;
  }): Promise<Payroll[]> {
    const response = await api.get('/payrolls/', { params });
    return response.data;
  }

  static async getPayroll(id: number): Promise<Payroll> {
    const response = await api.get(`/payrolls/${id}/`);
    return response.data;
  }

  static async createPayroll(data: Partial<Payroll>): Promise<Payroll> {
    const response = await api.post('/payrolls/', data);
    return response.data;
  }

  static async updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll> {
    const response = await api.patch(`/payrolls/${id}/`, data);
    return response.data;
  }

  static async approvePayroll(id: number): Promise<Payroll> {
    const response = await api.post(`/payrolls/${id}/approve/`);
    return response.data;
  }

  static async markPayrollAsPaid(id: number, paymentReference: string): Promise<Payroll> {
    const response = await api.post(`/payrolls/${id}/mark_as_paid/`, {
      payment_reference: paymentReference
    });
    return response.data;
  }

  static async downloadPayslip(id: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const response = await api.get(`/payrolls/${id}/download_payslip/`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  // Overtime Management
  static async getOvertimeRecords(params?: {
    employee?: number;
    date?: string;
    approved?: boolean;
  }): Promise<Overtime[]> {
    const response = await api.get('/overtime/', { params });
    return response.data;
  }

  static async createOvertime(data: Partial<Overtime>): Promise<Overtime> {
    const response = await api.post('/overtime/', data);
    return response.data;
  }

  static async approveOvertime(id: number): Promise<Overtime> {
    const response = await api.post(`/overtime/${id}/approve/`);
    return response.data;
  }

  // Leave Balance Management
  static async getLeaveBalances(): Promise<LeaveBalanceResponse[]> {
    const response = await api.get('/employees/leave_balance/');
    return response.data;
  }

  static async updateLeaveBalances(employeeId: number): Promise<void> {
    await api.post(`/employees/${employeeId}/update_leave_balances/`);
  }

  // Department Management
  static async getDepartments(): Promise<any[]> {
    const response = await api.get('/departments/');
    return response.data.results || response.data;
  }

  // Org Chart
  static async getOrgChart(): Promise<OrgChartNode[]> {
    const response = await api.get('/employees/');
    const employees = response.data;
    
    // Build org chart structure
    const employeeMap = new Map<number, OrgChartNode>();
    const rootNodes: OrgChartNode[] = [];

    // Create nodes for all employees
    employees.forEach((emp: Employee) => {
      employeeMap.set(emp.id, {
        id: emp.id,
        name: emp.full_name,
        position: emp.position,
        department: emp.department.name,
        children: [],
        employee: emp
      });
    });

    // Build parent-child relationships
    employees.forEach((emp: Employee) => {
      const node = employeeMap.get(emp.id);
      if (emp.manager_id && employeeMap.has(emp.manager_id)) {
        const parentNode = employeeMap.get(emp.manager_id);
        if (parentNode) {
          parentNode.children.push(node!);
        }
      } else {
        rootNodes.push(node!);
      }
    });

    return rootNodes;
  }

  // HR Dashboard Stats
  static async getDashboardStats(): Promise<HRDashboardStats> {
    const [employeesRes, leaveRequestsRes, payrollsRes] = await Promise.all([
      api.get('/employees/'),
      api.get('/leave-requests/', { params: { status: 'PENDING' } }),
      api.get('/payrolls/', { params: { status: 'DRAFT' } })
    ]);

    const employees = employeesRes.data;
    const pendingLeaveRequests = leaveRequestsRes.data;
    const pendingPayrolls = payrollsRes.data;

    // Calculate department distribution
    const deptMap = new Map<string, number>();
    employees.forEach((emp: Employee) => {
      const deptName = emp.department.name;
      deptMap.set(deptName, (deptMap.get(deptName) || 0) + 1);
    });

    const departmentDistribution = Array.from(deptMap.entries()).map(([name, count]) => ({
      department_name: name,
      employee_count: count,
      percentage: (count / employees.length) * 100
    }));

    return {
      total_employees: employees.length,
      active_employees: employees.filter((emp: Employee) => emp.status === 'ACTIVE').length,
      employees_on_leave: employees.filter((emp: Employee) => emp.status === 'ON_LEAVE').length,
      pending_leave_requests: pendingLeaveRequests.length,
      pending_payroll_approvals: pendingPayrolls.length,
              department_distribution: departmentDistribution
    };
  }

  // Employee Self-Service
  static async getEmployeeSelfService(): Promise<{
    modules: any[];
    payrolls: Payroll[];
    leave_requests: LeaveRequest[];
    bonuses: any[];
  }> {
    const response = await api.get('/employee-self-service/');
    return response.data;
  }

  // File Upload Helper
  static async uploadProfilePhoto(employeeId: number, file: File): Promise<{ profile_photo: string }> {
    const formData = new FormData();
    formData.append('profile_photo', file);
    
    const response = await api.patch(`/employees/${employeeId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export default HRService; 