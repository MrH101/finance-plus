import api from './api';

export interface StatutoryReport {
  id: number;
  report_type: string;
  report_type_display: string;
  period_start: string;
  period_end: string;
  business: number;
  business_name: string;
  created_by?: number;
  created_by_name?: string;
  status: string;
  status_display: string;
  submission_date?: string;
  approval_date?: string;
  rejection_reason: string;
  total_amount: number;
  currency: string;
  exchange_rate: number;
  notes: string;
  created_at: string;
  updated_at: string;
  vat7_details?: VAT7Report;
  paye_details?: PAYEReport;
  nssa_details?: NSSAReport;
}

export interface VAT7Report {
  id: number;
  statutory_report: number;
  total_sales_excluding_vat: number;
  vat_on_sales: number;
  total_sales_including_vat: number;
  total_purchases_excluding_vat: number;
  vat_on_purchases: number;
  total_purchases_including_vat: number;
  vat_adjustments: number;
  vat_refunds: number;
  net_vat_payable: number;
  vat_refund_claimed: number;
  zero_rated_sales: number;
  exempt_sales: number;
  imports_excluding_vat: number;
  vat_on_imports: number;
}

export interface PAYEReport {
  id: number;
  statutory_report: number;
  total_employees: number;
  employees_paid: number;
  total_gross_pay: number;
  total_taxable_pay: number;
  total_paye_deductions: number;
  total_aids_levy: number;
  total_nssa_employee: number;
  total_nssa_employer: number;
  total_net_pay: number;
  total_remitted: number;
  total_bonuses: number;
  total_allowances: number;
  total_benefits: number;
}

export interface NSSAReport {
  id: number;
  statutory_report: number;
  total_employees: number;
  employees_contributed: number;
  total_employee_contributions: number;
  total_employer_contributions: number;
  total_contributions: number;
  employee_rate: number;
  employer_rate: number;
  total_pensionable_earnings: number;
  arrears_employee: number;
  arrears_employer: number;
  penalties: number;
}

export interface StatutoryReportFormData {
  report_type: string;
  period_start: string;
  period_end: string;
  notes?: string;
}

export class StatutoryService {
  // Get all statutory reports
  static async getReports(params?: {
    page?: number;
    report_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ results: StatutoryReport[]; count: number }> {
    const response = await api.get('/statutory-reports/', { params });
    return response.data;
  }

  // Get single report
  static async getReport(id: number): Promise<StatutoryReport> {
    const response = await api.get(`/statutory-reports/${id}/`);
    return response.data;
  }

  // Create report
  static async createReport(data: StatutoryReportFormData): Promise<StatutoryReport> {
    const response = await api.post('/statutory-reports/', data);
    return response.data;
  }

  // Update report
  static async updateReport(id: number, data: Partial<StatutoryReportFormData>): Promise<StatutoryReport> {
    const response = await api.patch(`/statutory-reports/${id}/`, data);
    return response.data;
  }

  // Delete report
  static async deleteReport(id: number): Promise<void> {
    await api.delete(`/statutory-reports/${id}/`);
  }

  // Generate VAT 7 report
  static async generateVAT7(id: number): Promise<any> {
    const response = await api.post(`/statutory-reports/${id}/generate_vat7/`);
    return response.data;
  }

  // Generate PAYE report
  static async generatePAYE(id: number): Promise<any> {
    const response = await api.post(`/statutory-reports/${id}/generate_paye/`);
    return response.data;
  }

  // Generate NSSA report
  static async generateNSSA(id: number): Promise<any> {
    const response = await api.post(`/statutory-reports/${id}/generate_nssa/`);
    return response.data;
  }

  // Submit report
  static async submitReport(id: number): Promise<any> {
    const response = await api.post(`/statutory-reports/${id}/submit_report/`);
    return response.data;
  }

  // Approve report
  static async approveReport(id: number): Promise<any> {
    const response = await api.post(`/statutory-reports/${id}/approve_report/`);
    return response.data;
  }

  // Reject report
  static async rejectReport(id: number, reason: string): Promise<any> {
    const response = await api.post(`/statutory-reports/${id}/reject_report/`, { reason });
    return response.data;
  }

  // Export PDF
  static async exportPDF(id: number): Promise<Blob> {
    const response = await api.get(`/statutory-reports/${id}/export_pdf/`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get report summary
  static async getReportSummary(): Promise<{
    total_reports: number;
    draft_reports: number;
    submitted_reports: number;
    approved_reports: number;
    rejected_reports: number;
    total_vat_payable: number;
    total_paye_remitted: number;
    total_nssa_contributions: number;
  }> {
    const reports = await this.getReports({ page_size: 1000 });
    
    const summary = {
      total_reports: reports.count,
      draft_reports: 0,
      submitted_reports: 0,
      approved_reports: 0,
      rejected_reports: 0,
      total_vat_payable: 0,
      total_paye_remitted: 0,
      total_nssa_contributions: 0,
    };

    reports.results.forEach(report => {
      switch (report.status) {
        case 'DRAFT':
          summary.draft_reports++;
          break;
        case 'SUBMITTED':
          summary.submitted_reports++;
          break;
        case 'APPROVED':
          summary.approved_reports++;
          break;
        case 'REJECTED':
          summary.rejected_reports++;
          break;
      }

      // Calculate totals by report type
      if (report.report_type === 'VAT7' && report.vat7_details) {
        summary.total_vat_payable += report.vat7_details.net_vat_payable;
      } else if (report.report_type === 'PAYE' && report.paye_details) {
        summary.total_paye_remitted += report.paye_details.total_remitted;
      } else if (report.report_type === 'NSSA' && report.nssa_details) {
        summary.total_nssa_contributions += report.nssa_details.total_contributions;
      }
    });

    return summary;
  }

  // Get upcoming deadlines
  static async getUpcomingDeadlines(): Promise<StatutoryReport[]> {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const reports = await this.getReports({ 
      page_size: 1000,
      start_date: today.toISOString().split('T')[0],
      end_date: nextMonth.toISOString().split('T')[0]
    });
    
    return reports.results.filter(report => report.status === 'DRAFT');
  }

  // Format report for display
  static formatReport(report: StatutoryReport): {
    title: string;
    subtitle: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    icon: string;
    color: string;
  } {
    const statusMap = {
      'DRAFT': { status: 'draft' as const, color: 'bg-gray-100 text-gray-800', icon: '📝' },
      'SUBMITTED': { status: 'submitted' as const, color: 'bg-blue-100 text-blue-800', icon: '📤' },
      'APPROVED': { status: 'approved' as const, color: 'bg-green-100 text-green-800', icon: '✅' },
      'REJECTED': { status: 'rejected' as const, color: 'bg-red-100 text-red-800', icon: '❌' },
    };

    const status = statusMap[report.status as keyof typeof statusMap] || statusMap.DRAFT;
    
    const title = `${report.report_type_display} - ${report.period_start} to ${report.period_end}`;
    const subtitle = `${report.business_name} | ${report.status_display}`;

    return {
      title,
      subtitle,
      status: status.status,
      icon: status.icon,
      color: status.color,
    };
  }

  // Get report type options
  static getReportTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'VAT7',
        label: 'VAT 7 Return',
        description: 'Value Added Tax return for sales and purchases'
      },
      {
        value: 'PAYE',
        label: 'PAYE Return',
        description: 'Pay As You Earn tax return for employees'
      },
      {
        value: 'NSSA',
        label: 'NSSA Return',
        description: 'National Social Security Authority contributions'
      },
      {
        value: 'AIDS_LEVY',
        label: 'AIDS Levy Return',
        description: 'AIDS Levy deductions from payroll'
      },
      {
        value: 'WITHHOLDING_TAX',
        label: 'Withholding Tax Return',
        description: 'Withholding tax on payments to suppliers'
      },
      {
        value: 'CORPORATE_TAX',
        label: 'Corporate Tax Return',
        description: 'Corporate income tax return'
      },
    ];
  }

  // Get default period dates
  static getDefaultPeriod(reportType: string): { start: string; end: string } {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Default to current month
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }
}

export default StatutoryService; 