"""
Management command to set up extended ERP system
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from erp.models import Business, Department, Module
from erp.models_extended_part2 import LeaveType, CostCenter, BudgetPeriod, DocumentCategory
from erp.models_extended import AssetCategory
from erp.models import ChartOfAccounts
from decimal import Decimal


class Command(BaseCommand):
    help = 'Setup extended ERP system with initial data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--business-id',
            type=int,
            help='Business ID to setup',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        business_id = options.get('business_id')
        
        if business_id:
            try:
                business = Business.objects.get(id=business_id)
                self.setup_business(business)
            except Business.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Business with ID {business_id} not found'))
                return
        else:
            # Setup for all businesses
            for business in Business.objects.all():
                self.setup_business(business)
        
        self.stdout.write(self.style.SUCCESS('Extended ERP setup completed successfully!'))

    def setup_business(self, business):
        self.stdout.write(f'Setting up business: {business.name}')
        
        # Setup Leave Types
        self.setup_leave_types(business)
        
        # Setup Document Categories
        self.setup_document_categories(business)
        
        # Setup Cost Centers
        self.setup_cost_centers(business)
        
        # Setup Asset Categories
        self.setup_asset_categories(business)
        
        # Setup Budget Periods
        self.setup_budget_periods(business)
        
        self.stdout.write(self.style.SUCCESS(f'✓ Completed setup for {business.name}'))

    def setup_leave_types(self, business):
        """Setup Zimbabwe statutory and common leave types"""
        leave_types = [
            {
                'name': 'Annual Leave',
                'code': 'ANNUAL',
                'annual_allocation_days': 22,
                'is_paid': True,
                'is_carry_forward': True,
                'max_carry_forward_days': 10,
                'requires_approval': True,
                'is_statutory': True
            },
            {
                'name': 'Sick Leave',
                'code': 'SICK',
                'annual_allocation_days': 60,
                'is_paid': True,
                'is_carry_forward': False,
                'requires_approval': True,
                'requires_document': True,
                'is_statutory': True
            },
            {
                'name': 'Maternity Leave',
                'code': 'MATERNITY',
                'annual_allocation_days': 98,
                'is_paid': True,
                'is_carry_forward': False,
                'requires_approval': True,
                'requires_document': True,
                'is_statutory': True
            },
            {
                'name': 'Paternity Leave',
                'code': 'PATERNITY',
                'annual_allocation_days': 3,
                'is_paid': True,
                'is_carry_forward': False,
                'requires_approval': True,
                'is_statutory': True
            },
            {
                'name': 'Compassionate Leave',
                'code': 'COMPASSIONATE',
                'annual_allocation_days': 3,
                'is_paid': True,
                'is_carry_forward': False,
                'requires_approval': True,
                'is_statutory': False
            },
            {
                'name': 'Study Leave',
                'code': 'STUDY',
                'annual_allocation_days': 0,
                'is_paid': False,
                'is_carry_forward': False,
                'requires_approval': True,
                'is_statutory': False
            },
            {
                'name': 'Unpaid Leave',
                'code': 'UNPAID',
                'annual_allocation_days': 0,
                'is_paid': False,
                'is_carry_forward': False,
                'requires_approval': True,
                'is_statutory': False
            }
        ]
        
        for lt_data in leave_types:
            LeaveType.objects.get_or_create(
                business=business,
                code=lt_data['code'],
                defaults=lt_data
            )
        
        self.stdout.write('  ✓ Leave types configured')

    def setup_document_categories(self, business):
        """Setup document categories"""
        categories = [
            'Financial Documents',
            'HR Documents',
            'Legal Documents',
            'Contracts',
            'Policies',
            'Reports',
            'Invoices',
            'Purchase Orders',
            'Certificates',
            'Correspondence'
        ]
        
        for category_name in categories:
            DocumentCategory.objects.get_or_create(
                business=business,
                name=category_name,
                defaults={'is_active': True}
            )
        
        self.stdout.write('  ✓ Document categories configured')

    def setup_cost_centers(self, business):
        """Setup cost centers based on departments"""
        departments = Department.objects.filter(business=business)
        
        for dept in departments:
            CostCenter.objects.get_or_create(
                business=business,
                code=f"CC-{dept.name[:3].upper()}",
                defaults={
                    'name': f"{dept.name} Cost Center",
                    'department': dept,
                    'is_active': True
                }
            )
        
        # Add general cost centers
        general_cost_centers = [
            {'code': 'CC-ADM', 'name': 'Administration'},
            {'code': 'CC-SAL', 'name': 'Sales & Marketing'},
            {'code': 'CC-OPS', 'name': 'Operations'},
            {'code': 'CC-IT', 'name': 'Information Technology'},
        ]
        
        for cc_data in general_cost_centers:
            CostCenter.objects.get_or_create(
                business=business,
                code=cc_data['code'],
                defaults={
                    'name': cc_data['name'],
                    'is_active': True
                }
            )
        
        self.stdout.write('  ✓ Cost centers configured')

    def setup_asset_categories(self, business):
        """Setup fixed asset categories"""
        # Get or create required accounts
        stores = business.stores.first()
        if not stores:
            self.stdout.write(self.style.WARNING('  ⚠ No stores found. Skipping asset categories.'))
            return
        
        # Create asset accounts if they don't exist
        asset_account, _ = ChartOfAccounts.objects.get_or_create(
            store=stores,
            code='1500',
            defaults={
                'name': 'Fixed Assets',
                'account_type': 'ASSET',
                'description': 'Fixed Assets Account'
            }
        )
        
        depreciation_account, _ = ChartOfAccounts.objects.get_or_create(
            store=stores,
            code='1510',
            defaults={
                'name': 'Accumulated Depreciation',
                'account_type': 'ASSET',
                'description': 'Accumulated Depreciation'
            }
        )
        
        expense_account, _ = ChartOfAccounts.objects.get_or_create(
            store=stores,
            code='5200',
            defaults={
                'name': 'Depreciation Expense',
                'account_type': 'EXPENSE',
                'description': 'Depreciation Expense'
            }
        )
        
        asset_categories = [
            {
                'name': 'Computer Equipment',
                'depreciation_method': 'STRAIGHT_LINE',
                'useful_life_years': 3,
                'salvage_value_percent': Decimal('10')
            },
            {
                'name': 'Furniture & Fixtures',
                'depreciation_method': 'STRAIGHT_LINE',
                'useful_life_years': 7,
                'salvage_value_percent': Decimal('10')
            },
            {
                'name': 'Motor Vehicles',
                'depreciation_method': 'DECLINING_BALANCE',
                'useful_life_years': 5,
                'salvage_value_percent': Decimal('20')
            },
            {
                'name': 'Machinery',
                'depreciation_method': 'STRAIGHT_LINE',
                'useful_life_years': 10,
                'salvage_value_percent': Decimal('10')
            },
            {
                'name': 'Buildings',
                'depreciation_method': 'STRAIGHT_LINE',
                'useful_life_years': 40,
                'salvage_value_percent': Decimal('0')
            },
            {
                'name': 'Office Equipment',
                'depreciation_method': 'STRAIGHT_LINE',
                'useful_life_years': 5,
                'salvage_value_percent': Decimal('10')
            }
        ]
        
        for ac_data in asset_categories:
            AssetCategory.objects.get_or_create(
                business=business,
                name=ac_data['name'],
                defaults={
                    **ac_data,
                    'asset_account': asset_account,
                    'accumulated_depreciation_account': depreciation_account,
                    'depreciation_expense_account': expense_account
                }
            )
        
        self.stdout.write('  ✓ Asset categories configured')

    def setup_budget_periods(self, business):
        """Setup budget periods for current and next year"""
        import datetime
        
        current_year = datetime.date.today().year
        
        periods = [
            {
                'name': f'FY {current_year}',
                'period_type': 'ANNUAL',
                'start_date': datetime.date(current_year, 1, 1),
                'end_date': datetime.date(current_year, 12, 31)
            },
            {
                'name': f'FY {current_year + 1}',
                'period_type': 'ANNUAL',
                'start_date': datetime.date(current_year + 1, 1, 1),
                'end_date': datetime.date(current_year + 1, 12, 31)
            }
        ]
        
        from erp.models import User
        admin_user = User.objects.filter(business=business, role='employer').first()
        
        if not admin_user:
            admin_user = User.objects.filter(is_superuser=True).first()
        
        for period_data in periods:
            BudgetPeriod.objects.get_or_create(
                business=business,
                name=period_data['name'],
                defaults={
                    **period_data,
                    'created_by': admin_user,
                    'is_active': True
                }
            )
        
        self.stdout.write('  ✓ Budget periods configured')

