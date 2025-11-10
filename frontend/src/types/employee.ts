// Employee and HR-related TypeScript interfaces

export interface Employee {
  id: number;
  user: User;
  user_id?: number;
  department: Department;
  department_id?: number;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'CONTINGENT' | 'GLOBAL' | 'CONCURRENT';
  salary: number;
  employment_date: string;
  termination_date?: string;
  bank_name: string;
  bank_account: string;
  tax_number: string;
  nssa_number: string;
  nhima_number?: string;
  
  // Org chart fields
  manager?: Employee;
  manager_id?: number;
  position: string;
  
  // Profile photo
  profile_photo?: string;
  
  // Emergency contacts (JSON)
  emergency_contacts: EmergencyContact[];
  
  // Workflow/status fields
  status: 'ACTIVE' | 'ON_LEAVE' | 'PROMOTED' | 'TRANSFERRED' | 'TERMINATED';
  last_promotion_date?: string;
  last_transfer_date?: string;
  termination_reason?: string;
  
  // Leave tracking
  annual_leave_balance: number;
  sick_leave_balance: number;
  maternity_leave_balance: number;
  
  // Computed fields
  full_name: string;
  leave_balances: LeaveBalances;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'superadmin' | 'employer' | 'employee';
  phone: string;
  is_verified: boolean;
  business?: Business;
  modules: Module[];
}

export interface Department {
  id: number;
  name: string;
  cost_center: string;
  modules: Module[];
}

export interface Module {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface Business {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}

export interface LeaveBalances {
  annual_leave: number;
  sick_leave: number;
  maternity_leave: number;
  total_entitlement: number;
}

export interface LeaveRequest {
  id: number;
  employee: number;
  employee_name: string;
  leave_type: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'UNPAID';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: number;
  approver_name?: string;
  approved_at?: string;
  created_at: string;
  duration: number;
}

export interface Payroll {
  id: number;
  employee: number;
  employee_name: string;
  department_name: string;
  period_start: string;
  period_end: string;
  pay_period: 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';
  
  // Earnings
  basic_salary: number;
  overtime_amount: number;
  allowances: Record<string, number>;
  gross_salary: number;
  
  // Deductions
  paye: number;
  nssa: number;
  nhima: number;
  other_deductions: Record<string, number>;
  total_deductions: number;
  
  // Net salary
  net_salary: number;
  
  // Status and payment
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  payment_date?: string;
  payment_reference?: string;
  
  created_at: string;
  updated_at: string;
  
  // Computed fields
  earnings_breakdown: EarningsBreakdown;
  deductions_breakdown: DeductionsBreakdown;
}

export interface EarningsBreakdown {
  basic_salary: number;
  overtime: number;
  allowances: Record<string, number>;
  total: number;
}

export interface DeductionsBreakdown {
  paye: number;
  nssa: number;
  nhima: number;
  other_deductions: Record<string, number>;
  total: number;
}

export interface Overtime {
  id: number;
  employee: number;
  employee_name: string;
  date: string;
  hours: number;
  rate_multiplier: number;
  reason: string;
  approved_by?: number;
  approver_name?: string;
  approved_at?: string;
  created_at: string;
  amount: number;
}

// Form interfaces for creating/updating employees
export interface EmployeeFormData {
  user_id: number;
  department_id: number;
  manager_id?: number;
  position: string;
  employment_type: Employee['employment_type'];
  salary: number;
  employment_date: string;
  termination_date?: string;
  bank_name: string;
  bank_account: string;
  tax_number: string;
  nssa_number: string;
  nhima_number?: string;
  profile_photo?: File;
  emergency_contacts: EmergencyContact[];
  status: Employee['status'];
  last_promotion_date?: string;
  last_transfer_date?: string;
  termination_reason?: string;
}

export interface LeaveRequestFormData {
  employee: number;
  leave_type: LeaveRequest['leave_type'];
  start_date: string;
  end_date: string;
  reason: string;
}

// API Response interfaces
export interface EmployeeListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Employee[];
}

export interface LeaveBalanceResponse {
  employee_id: number;
  employee_name: string;
  department: string;
  annual_leave: number;
  sick_leave: number;
  maternity_leave: number;
  total_entitlement: number;
}

// Org Chart interfaces
export interface OrgChartNode {
  id: number;
  name: string;
  position: string;
  department: string;
  children: OrgChartNode[];
  employee: Employee;
}

// HR Dashboard interfaces
export interface HRDashboardStats {
  total_employees: number;
  active_employees: number;
  employees_on_leave: number;
  pending_leave_requests: number;
  pending_payroll_approvals: number;
  department_distribution: DepartmentStats[];
}

export interface DepartmentStats {
  department_name: string;
  employee_count: number;
  percentage: number;
} 