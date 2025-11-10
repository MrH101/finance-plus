from django.db.models import Sum, Count, Avg, F, Q
from django.db.models.functions import TruncMonth, TruncYear
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import *

class PayrollReport:
    @staticmethod
    def get_payroll_summary(start_date, end_date, department=None):
        """Generate payroll summary report"""
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        summary = query.aggregate(
            total_gross=Sum('gross_salary'),
            total_paye=Sum('paye'),
            total_nssa=Sum('nssa'),
            total_nhima=Sum('nhima'),
            total_net=Sum('net_salary'),
            employee_count=Count('employee', distinct=True)
        )
        
        return {
            'period': {'start': start_date, 'end': end_date},
            'department': department.name if department else 'All Departments',
            'summary': summary,
            'monthly_breakdown': PayrollReport.get_monthly_breakdown(start_date, end_date, department)
        }
    
    @staticmethod
    def get_monthly_breakdown(start_date, end_date, department=None):
        """Generate monthly payroll breakdown"""
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        return query.annotate(
            month=TruncMonth('period_start')
        ).values('month').annotate(
            gross_salary=Sum('gross_salary'),
            net_salary=Sum('net_salary'),
            employee_count=Count('employee', distinct=True)
        ).order_by('month')
    
    @staticmethod
    def get_department_breakdown(start_date, end_date):
        """Generate payroll breakdown by department"""
        return Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        ).values(
            'employee__department__name'
        ).annotate(
            total_gross=Sum('gross_salary'),
            total_net=Sum('net_salary'),
            employee_count=Count('employee', distinct=True),
            avg_salary=Avg('gross_salary')
        ).order_by('-total_gross')

class LeaveReport:
    @staticmethod
    def get_leave_summary(start_date, end_date, department=None):
        """Generate leave summary report"""
        query = LeaveRequest.objects.filter(
            start_date__gte=start_date,
            end_date__lte=end_date,
            status='APPROVED'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        summary = query.aggregate(
            total_annual=Sum('duration', filter=Q(leave_type='ANNUAL')),
            total_sick=Sum('duration', filter=Q(leave_type='SICK')),
            total_maternity=Sum('duration', filter=Q(leave_type='MATERNITY')),
            total_unpaid=Sum('duration', filter=Q(leave_type='UNPAID')),
            request_count=Count('id')
        )
        
        return {
            'period': {'start': start_date, 'end': end_date},
            'department': department.name if department else 'All Departments',
            'summary': summary,
            'monthly_breakdown': LeaveReport.get_monthly_breakdown(start_date, end_date, department)
        }
    
    @staticmethod
    def get_monthly_breakdown(start_date, end_date, department=None):
        """Generate monthly leave breakdown"""
        query = LeaveRequest.objects.filter(
            start_date__gte=start_date,
            end_date__lte=end_date,
            status='APPROVED'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        return query.annotate(
            month=TruncMonth('start_date')
        ).values('month').annotate(
            annual_days=Sum('duration', filter=Q(leave_type='ANNUAL')),
            sick_days=Sum('duration', filter=Q(leave_type='SICK')),
            maternity_days=Sum('duration', filter=Q(leave_type='MATERNITY')),
            unpaid_days=Sum('duration', filter=Q(leave_type='UNPAID'))
        ).order_by('month')

class OvertimeReport:
    @staticmethod
    def get_overtime_summary(start_date, end_date, department=None):
        """Generate overtime summary report"""
        query = Overtime.objects.filter(
            date__gte=start_date,
            date__lte=end_date,
            approved_at__isnull=False
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        summary = query.aggregate(
            total_hours=Sum('hours'),
            total_amount=Sum(F('hours') * F('rate_multiplier') * F('employee__salary') / 160),
            employee_count=Count('employee', distinct=True)
        )
        
        return {
            'period': {'start': start_date, 'end': end_date},
            'department': department.name if department else 'All Departments',
            'summary': summary,
            'monthly_breakdown': OvertimeReport.get_monthly_breakdown(start_date, end_date, department)
        }
    
    @staticmethod
    def get_monthly_breakdown(start_date, end_date, department=None):
        """Generate monthly overtime breakdown"""
        query = Overtime.objects.filter(
            date__gte=start_date,
            date__lte=end_date,
            approved_at__isnull=False
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        return query.annotate(
            month=TruncMonth('date')
        ).values('month').annotate(
            total_hours=Sum('hours'),
            total_amount=Sum(F('hours') * F('rate_multiplier') * F('employee__salary') / 160),
            employee_count=Count('employee', distinct=True)
        ).order_by('month')

class EmployeeReport:
    @staticmethod
    def get_employee_summary(department=None):
        """Generate employee summary report"""
        query = Employee.objects.all()
        
        if department:
            query = query.filter(department=department)
        
        summary = query.aggregate(
            total_employees=Count('id'),
            full_time=Count('id', filter=Q(employment_type='FULL_TIME')),
            part_time=Count('id', filter=Q(employment_type='PART_TIME')),
            contract=Count('id', filter=Q(employment_type='CONTRACT')),
            avg_salary=Avg('salary')
        )
        
        return {
            'department': department.name if department else 'All Departments',
            'summary': summary,
            'employment_type_breakdown': EmployeeReport.get_employment_type_breakdown(department),
            'salary_breakdown': EmployeeReport.get_salary_breakdown(department)
        }
    
    @staticmethod
    def get_employment_type_breakdown(department=None):
        """Generate employment type breakdown"""
        query = Employee.objects.all()
        
        if department:
            query = query.filter(department=department)
        
        return query.values('employment_type').annotate(
            count=Count('id'),
            avg_salary=Avg('salary')
        ).order_by('employment_type')
    
    @staticmethod
    def get_salary_breakdown(department=None):
        """Generate salary range breakdown"""
        query = Employee.objects.all()
        
        if department:
            query = query.filter(department=department)
        
        ranges = [
            (0, 50000),
            (50001, 100000),
            (100001, 200000),
            (200001, 500000),
            (500001, float('inf'))
        ]
        
        breakdown = []
        for min_salary, max_salary in ranges:
            count = query.filter(
                salary__gte=min_salary,
                salary__lt=max_salary if max_salary != float('inf') else None
            ).count()
            
            if count > 0:
                breakdown.append({
                    'range': f"{min_salary:,} - {max_salary if max_salary != float('inf') else '∞'}",
                    'count': count
                })
        
        return breakdown

class TaxReport:
    @staticmethod
    def get_tax_summary(start_date, end_date, department=None):
        """Generate tax summary report"""
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        summary = query.aggregate(
            total_paye=Sum('paye'),
            total_nssa=Sum('nssa'),
            total_nhima=Sum('nhima'),
            total_tax_liability=Sum('paye') + Sum('nssa') + Sum('nhima'),
            employee_count=Count('employee', distinct=True)
        )
        
        return {
            'period': {'start': start_date, 'end': end_date},
            'department': department.name if department else 'All Departments',
            'summary': summary,
            'monthly_breakdown': TaxReport.get_monthly_breakdown(start_date, end_date, department),
            'tax_bracket_analysis': TaxReport.get_tax_bracket_analysis(start_date, end_date, department)
        }
    
    @staticmethod
    def get_monthly_breakdown(start_date, end_date, department=None):
        """Generate monthly tax breakdown"""
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        return query.annotate(
            month=TruncMonth('period_start')
        ).values('month').annotate(
            paye=Sum('paye'),
            nssa=Sum('nssa'),
            nhima=Sum('nhima'),
            total=Sum('paye') + Sum('nssa') + Sum('nhima')
        ).order_by('month')
    
    @staticmethod
    def get_tax_bracket_analysis(start_date, end_date, department=None):
        """Analyze tax distribution across brackets"""
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        brackets = [
            (0, 300000, '20%'),
            (300001, 600000, '25%'),
            (600001, 1200000, '30%'),
            (1200001, float('inf'), '35%')
        ]
        
        analysis = []
        for min_annual, max_annual, rate in brackets:
            count = query.filter(
                gross_salary__gte=min_annual/12,
                gross_salary__lt=max_annual/12 if max_annual != float('inf') else None
            ).count()
            
            if count > 0:
                analysis.append({
                    'bracket': f"{min_annual:,} - {max_annual if max_annual != float('inf') else '∞'}",
                    'rate': rate,
                    'employee_count': count
                })
        
        return analysis

class AttendanceReport:
    @staticmethod
    def get_attendance_summary(start_date, end_date, department=None):
        """Generate attendance summary report"""
        query = LeaveRequest.objects.filter(
            start_date__gte=start_date,
            end_date__lte=end_date
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        summary = query.aggregate(
            total_days=Sum('duration'),
            approved_days=Sum('duration', filter=Q(status='APPROVED')),
            pending_days=Sum('duration', filter=Q(status='PENDING')),
            rejected_days=Sum('duration', filter=Q(status='REJECTED')),
            employee_count=Count('employee', distinct=True)
        )
        
        return {
            'period': {'start': start_date, 'end': end_date},
            'department': department.name if department else 'All Departments',
            'summary': summary,
            'monthly_breakdown': AttendanceReport.get_monthly_breakdown(start_date, end_date, department),
            'attendance_patterns': AttendanceReport.get_attendance_patterns(start_date, end_date, department)
        }
    
    @staticmethod
    def get_monthly_breakdown(start_date, end_date, department=None):
        """Generate monthly attendance breakdown"""
        query = LeaveRequest.objects.filter(
            start_date__gte=start_date,
            end_date__lte=end_date
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        return query.annotate(
            month=TruncMonth('start_date')
        ).values('month').annotate(
            total_days=Sum('duration'),
            approved_days=Sum('duration', filter=Q(status='APPROVED')),
            pending_days=Sum('duration', filter=Q(status='PENDING')),
            rejected_days=Sum('duration', filter=Q(status='REJECTED'))
        ).order_by('month')
    
    @staticmethod
    def get_attendance_patterns(start_date, end_date, department=None):
        """Analyze attendance patterns"""
        query = LeaveRequest.objects.filter(
            start_date__gte=start_date,
            end_date__lte=end_date,
            status='APPROVED'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        return query.values('leave_type').annotate(
            total_days=Sum('duration'),
            request_count=Count('id'),
            avg_duration=Avg('duration'),
            employee_count=Count('employee', distinct=True)
        ).order_by('-total_days')

class CostAnalysisReport:
    @staticmethod
    def get_cost_summary(start_date, end_date, department=None):
        """Generate cost analysis report"""
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        summary = query.aggregate(
            total_salary_cost=Sum('gross_salary'),
            total_benefits_cost=Sum('allowances'),
            total_overtime_cost=Sum('overtime_amount'),
            total_tax_cost=Sum('paye') + Sum('nssa') + Sum('nhima'),
            total_cost=Sum('gross_salary') + Sum('allowances') + Sum('overtime_amount'),
            employee_count=Count('employee', distinct=True)
        )
        
        return {
            'period': {'start': start_date, 'end': end_date},
            'department': department.name if department else 'All Departments',
            'summary': summary,
            'monthly_breakdown': CostAnalysisReport.get_monthly_breakdown(start_date, end_date, department),
            'cost_per_employee': CostAnalysisReport.get_cost_per_employee(start_date, end_date, department)
        }
    
    @staticmethod
    def get_monthly_breakdown(start_date, end_date, department=None):
        """Generate monthly cost breakdown"""
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        return query.annotate(
            month=TruncMonth('period_start')
        ).values('month').annotate(
            salary_cost=Sum('gross_salary'),
            benefits_cost=Sum('allowances'),
            overtime_cost=Sum('overtime_amount'),
            tax_cost=Sum('paye') + Sum('nssa') + Sum('nhima'),
            total_cost=Sum('gross_salary') + Sum('allowances') + Sum('overtime_amount')
        ).order_by('month')
    
    @staticmethod
    def get_cost_per_employee(start_date, end_date, department=None):
        """Analyze cost per employee"""
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if department:
            query = query.filter(employee__department=department)
        
        return query.values(
            'employee__user__first_name',
            'employee__user__last_name',
            'employee__department__name'
        ).annotate(
            salary_cost=Sum('gross_salary'),
            benefits_cost=Sum('allowances'),
            overtime_cost=Sum('overtime_amount'),
            tax_cost=Sum('paye') + Sum('nssa') + Sum('nhima'),
            total_cost=Sum('gross_salary') + Sum('allowances') + Sum('overtime_amount')
        ).order_by('-total_cost') 

class P14Report:
    """Generate P14 report for ZIMRA - Employee Tax Certificate"""
    
    @staticmethod
    def generate_p14_report(tax_year, employee=None):
        """Generate P14 report for a specific tax year and optionally a specific employee"""
        start_date = datetime(tax_year, 1, 1).date()
        end_date = datetime(tax_year, 12, 31).date()
        
        query = Payroll.objects.filter(
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        if employee:
            query = query.filter(employee=employee)
        
        # Group by employee and calculate totals
        employee_summaries = query.values(
            'employee__user__first_name',
            'employee__user__last_name',
            'employee__tax_number',
            'employee__nssa_number',
            'employee__nhima_number'
        ).annotate(
            total_gross=Sum('gross_salary'),
            total_paye=Sum('paye'),
            total_nssa=Sum('nssa'),
            total_nhima=Sum('nhima'),
            total_net=Sum('net_salary'),
            periods_worked=Count('id')
        ).order_by('employee__user__last_name')
        
        # Calculate company totals
        company_totals = query.aggregate(
            total_gross=Sum('gross_salary'),
            total_paye=Sum('paye'),
            total_nssa=Sum('nssa'),
            total_nhima=Sum('nhima'),
            total_net=Sum('net_salary'),
            employee_count=Count('employee', distinct=True)
        )
        
        return {
            'tax_year': tax_year,
            'report_type': 'P14 - Employee Tax Certificate',
            'generated_date': timezone.now().date(),
            'company_totals': company_totals,
            'employee_summaries': list(employee_summaries),
            'total_employees': len(employee_summaries)
        }
    
    @staticmethod
    def get_employee_p14(employee_id, tax_year):
        """Generate P14 for a specific employee"""
        try:
            employee = Employee.objects.get(id=employee_id)
            return P14Report.generate_p14_report(tax_year, employee)
        except Employee.DoesNotExist:
            return None

class P16Report:
    """Generate P16 report for ZIMRA - Employer Tax Certificate"""
    
    @staticmethod
    def generate_p16_report(tax_year, store=None):
        """Generate P16 report for a specific tax year and optionally a specific store"""
        start_date = datetime(tax_year, 1, 1).date()
        end_date = datetime(tax_year, 12, 31).date()
        
        # Get all employees for the store(s)
        employee_query = Employee.objects.all()
        if store:
            employee_query = employee_query.filter(department__store=store)
        
        employee_ids = employee_query.values_list('id', flat=True)
        
        # Get payroll data
        payroll_data = Payroll.objects.filter(
            employee__id__in=employee_ids,
            period_start__gte=start_date,
            period_end__lte=end_date,
            status='PAID'
        )
        
        # Calculate monthly breakdown
        monthly_breakdown = payroll_data.annotate(
            month=TruncMonth('period_start')
        ).values('month').annotate(
            gross_salary=Sum('gross_salary'),
            paye=Sum('paye'),
            nssa=Sum('nssa'),
            nhima=Sum('nhima'),
            net_salary=Sum('net_salary'),
            employee_count=Count('employee', distinct=True)
        ).order_by('month')
        
        # Calculate annual totals
        annual_totals = payroll_data.aggregate(
            total_gross=Sum('gross_salary'),
            total_paye=Sum('paye'),
            total_nssa=Sum('nssa'),
            total_nhima=Sum('nhima'),
            total_net=Sum('net_salary'),
            total_employees=Count('employee', distinct=True),
            total_periods=Count('id')
        )
        
        # Get employee count by employment type
        employment_breakdown = employee_query.values('employment_type').annotate(
            count=Count('id')
        ).order_by('employment_type')
        
        return {
            'tax_year': tax_year,
            'report_type': 'P16 - Employer Tax Certificate',
            'generated_date': timezone.now().date(),
            'store': store.name if store else 'All Stores',
            'annual_totals': annual_totals,
            'monthly_breakdown': list(monthly_breakdown),
            'employment_breakdown': list(employment_breakdown),
            'employee_count': len(employee_ids)
        }
    
    @staticmethod
    def get_store_p16(store_id, tax_year):
        """Generate P16 for a specific store"""
        try:
            store = Store.objects.get(id=store_id)
            return P16Report.generate_p16_report(tax_year, store)
        except Store.DoesNotExist:
            return None 