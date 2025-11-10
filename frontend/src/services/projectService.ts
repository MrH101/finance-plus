import api from './api';

export interface Project {
  id: number;
  name: string;
  description: string;
  project_code: string;
  business: number;
  business_name: string;
  project_manager: number;
  project_manager_name: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  start_date: string;
  end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  budget: number;
  actual_cost: number;
  currency: string;
  progress_percentage: number;
  estimated_hours: number;
  actual_hours: number;
  client_name: string;
  client_contact: string;
  notes: string;
  created_at: string;
  updated_at: string;
  team_members: ProjectMember[];
  tasks: ProjectTask[];
  timesheets: Timesheet[];
  expenses: ProjectExpense[];
}

export interface ProjectMember {
  id: number;
  project: number;
  user: number;
  user_name: string;
  role: string;
  role_display: string;
  hourly_rate: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProjectTask {
  id: number;
  project: number;
  title: string;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_by?: number;
  created_by_name?: string;
  estimated_hours: number;
  actual_hours: number;
  due_date?: string;
  start_date?: string;
  completed_date?: string;
  parent_task?: number;
  tags: string[];
  attachments: string[];
  created_at: string;
  updated_at: string;
  subtasks: ProjectTask[];
}

export interface Timesheet {
  id: number;
  project: number;
  project_name: string;
  task?: number;
  task_title?: string;
  employee: number;
  employee_name: string;
  date: string;
  hours_worked: number;
  start_time?: string;
  end_time?: string;
  description: string;
  activity_type: string;
  is_approved: boolean;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  hourly_rate: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectExpense {
  id: number;
  project: number;
  expense_type: string;
  expense_type_display: string;
  description: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  expense_date: string;
  receipt_date?: string;
  is_approved: boolean;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  vendor: string;
  receipt_number: string;
  notes: string;
  created_at: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  project_code: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  priority: string;
  client_name?: string;
  client_contact?: string;
  notes?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  estimated_hours: number;
  due_date?: string;
  assigned_to?: number;
  parent_task?: number;
  tags?: string[];
}

export interface TimesheetFormData {
  project: number;
  task?: number;
  date: string;
  hours_worked: number;
  start_time?: string;
  end_time?: string;
  description: string;
  activity_type: string;
}

export interface ExpenseFormData {
  project: number;
  expense_type: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  vendor?: string;
  receipt_number?: string;
  notes?: string;
}

export class ProjectService {
  // Project Management
  static async getProjects(params?: {
    page?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<{ results: Project[]; count: number }> {
    const response = await api.get('/projects/', { params });
    return response.data;
  }

  static async getProject(id: number): Promise<Project> {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  }

  static async createProject(data: ProjectFormData): Promise<Project> {
    const response = await api.post('/projects/', data);
    return response.data;
  }

  static async updateProject(id: number, data: Partial<ProjectFormData>): Promise<Project> {
    const response = await api.patch(`/projects/${id}/`, data);
    return response.data;
  }

  static async deleteProject(id: number): Promise<void> {
    await api.delete(`/projects/${id}/`);
  }

  static async updateProjectStatus(id: number, status: string): Promise<any> {
    const response = await api.post(`/projects/${id}/update_status/`, { status });
    return response.data;
  }

  static async getProjectSummary(id: number): Promise<any> {
    const response = await api.get(`/projects/${id}/project_summary/`);
    return response.data;
  }

  static async getKanbanBoard(id: number): Promise<any> {
    const response = await api.get(`/projects/${id}/kanban_board/`);
    return response.data;
  }

  // Team Management
  static async addTeamMember(projectId: number, data: {
    user_id: number;
    role: string;
    hourly_rate: number;
    start_date: string;
  }): Promise<any> {
    const response = await api.post(`/projects/${projectId}/add_member/`, data);
    return response.data;
  }

  static async removeTeamMember(projectId: number, userId: number): Promise<any> {
    const response = await api.post(`/projects/${projectId}/remove_member/`, { user_id: userId });
    return response.data;
  }

  // Task Management
  static async getTasks(params?: {
    page?: number;
    project?: number;
    status?: string;
    priority?: string;
    assigned_to?: number;
  }): Promise<{ results: ProjectTask[]; count: number }> {
    const response = await api.get('/project-tasks/', { params });
    return response.data;
  }

  static async getTask(id: number): Promise<ProjectTask> {
    const response = await api.get(`/project-tasks/${id}/`);
    return response.data;
  }

  static async createTask(data: TaskFormData): Promise<ProjectTask> {
    const response = await api.post('/project-tasks/', data);
    return response.data;
  }

  static async updateTask(id: number, data: Partial<TaskFormData>): Promise<ProjectTask> {
    const response = await api.patch(`/project-tasks/${id}/`, data);
    return response.data;
  }

  static async deleteTask(id: number): Promise<void> {
    await api.delete(`/project-tasks/${id}/`);
  }

  static async updateTaskStatus(id: number, status: string): Promise<any> {
    const response = await api.post(`/project-tasks/${id}/update_status/`, { status });
    return response.data;
  }

  static async assignTask(id: number, userId: number): Promise<any> {
    const response = await api.post(`/project-tasks/${id}/assign_task/`, { user_id: userId });
    return response.data;
  }

  // Timesheet Management
  static async getTimesheets(params?: {
    page?: number;
    project?: number;
    employee?: number;
    date_from?: string;
    date_to?: string;
    is_approved?: boolean;
  }): Promise<{ results: Timesheet[]; count: number }> {
    const response = await api.get('/timesheets/', { params });
    return response.data;
  }

  static async getTimesheet(id: number): Promise<Timesheet> {
    const response = await api.get(`/timesheets/${id}/`);
    return response.data;
  }

  static async createTimesheet(data: TimesheetFormData): Promise<Timesheet> {
    const response = await api.post('/timesheets/', data);
    return response.data;
  }

  static async updateTimesheet(id: number, data: Partial<TimesheetFormData>): Promise<Timesheet> {
    const response = await api.patch(`/timesheets/${id}/`, data);
    return response.data;
  }

  static async deleteTimesheet(id: number): Promise<void> {
    await api.delete(`/timesheets/${id}/`);
  }

  static async approveTimesheet(id: number): Promise<any> {
    const response = await api.post(`/timesheets/${id}/approve_timesheet/`);
    return response.data;
  }

  static async rejectTimesheet(id: number): Promise<any> {
    const response = await api.post(`/timesheets/${id}/reject_timesheet/`);
    return response.data;
  }

  static async getMyTimesheets(): Promise<Timesheet[]> {
    const response = await api.get('/timesheets/my_timesheets/');
    return response.data;
  }

  // Expense Management
  static async getExpenses(params?: {
    page?: number;
    project?: number;
    expense_type?: string;
    is_approved?: boolean;
    date_from?: string;
    date_to?: string;
  }): Promise<{ results: ProjectExpense[]; count: number }> {
    const response = await api.get('/project-expenses/', { params });
    return response.data;
  }

  static async getExpense(id: number): Promise<ProjectExpense> {
    const response = await api.get(`/project-expenses/${id}/`);
    return response.data;
  }

  static async createExpense(data: ExpenseFormData): Promise<ProjectExpense> {
    const response = await api.post('/project-expenses/', data);
    return response.data;
  }

  static async updateExpense(id: number, data: Partial<ExpenseFormData>): Promise<ProjectExpense> {
    const response = await api.patch(`/project-expenses/${id}/`, data);
    return response.data;
  }

  static async deleteExpense(id: number): Promise<void> {
    await api.delete(`/project-expenses/${id}/`);
  }

  static async approveExpense(id: number): Promise<any> {
    const response = await api.post(`/project-expenses/${id}/approve_expense/`);
    return response.data;
  }

  static async rejectExpense(id: number): Promise<any> {
    const response = await api.post(`/project-expenses/${id}/reject_expense/`);
    return response.data;
  }

  // Utility Methods
  static getProjectStatuses(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'PLANNING', label: 'Planning', color: 'bg-blue-100 text-blue-800' },
      { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'ON_HOLD', label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
      { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
      { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    ];
  }

  static getTaskStatuses(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'TODO', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
      { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      { value: 'REVIEW', label: 'In Review', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'TESTING', label: 'Testing', color: 'bg-purple-100 text-purple-800' },
      { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
      { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    ];
  }

  static getPriorities(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
      { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
      { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
      { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
    ];
  }

  static getTeamRoles(): Array<{ value: string; label: string }> {
    return [
      { value: 'MANAGER', label: 'Project Manager' },
      { value: 'DEVELOPER', label: 'Developer' },
      { value: 'DESIGNER', label: 'Designer' },
      { value: 'ANALYST', label: 'Business Analyst' },
      { value: 'TESTER', label: 'Tester' },
      { value: 'SUPPORT', label: 'Support' },
      { value: 'OTHER', label: 'Other' },
    ];
  }

  static getExpenseTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'MATERIALS', label: 'Materials' },
      { value: 'EQUIPMENT', label: 'Equipment' },
      { value: 'SERVICES', label: 'Services' },
      { value: 'TRAVEL', label: 'Travel' },
      { value: 'SUBCONTRACTOR', label: 'Subcontractor' },
      { value: 'OTHER', label: 'Other' },
    ];
  }

  static formatProject(project: Project): {
    title: string;
    subtitle: string;
    status: string;
    priority: string;
    progress: number;
    budgetUtilization: number;
  } {
    const status = this.getProjectStatuses().find(s => s.value === project.status);
    const priority = this.getPriorities().find(p => p.value === project.priority);
    
    const budgetUtilization = project.budget > 0 ? (project.actual_cost / project.budget) * 100 : 0;
    
    return {
      title: `${project.project_code} - ${project.name}`,
      subtitle: `${project.client_name || 'Internal Project'} | ${project.project_manager_name}`,
      status: status?.label || project.status,
      priority: priority?.label || project.priority,
      progress: project.progress_percentage,
      budgetUtilization,
    };
  }

  static formatTask(task: ProjectTask): {
    title: string;
    subtitle: string;
    status: string;
    priority: string;
    isOverdue: boolean;
  } {
    const status = this.getTaskStatuses().find(s => s.value === task.status);
    const priority = this.getPriorities().find(p => p.value === task.priority);
    
    const isOverdue = task.due_date ? new Date(task.due_date) < new Date() && !['COMPLETED', 'CANCELLED'].includes(task.status) : false;
    
    return {
      title: task.title,
      subtitle: task.assigned_to_name || 'Unassigned',
      status: status?.label || task.status,
      priority: priority?.label || task.priority,
      isOverdue,
    };
  }

  static generateProjectCode(): string {
    const prefix = 'PRJ';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

export default ProjectService; 