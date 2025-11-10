from rest_framework import serializers
from .models import *
from .models_extended import Vendor

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'business', 'phone', 'is_verified', 'is_staff']
        read_only_fields = ['id', 'is_staff']

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ['id', 'name', 'address', 'created_at']

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name', 'address', 'manager', 'business', 'contact_number', 'vat_number', 'created_at']

class ChartOfAccountsSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    
    class Meta:
        model = ChartOfAccounts
        fields = ['id', 'store', 'code', 'name', 'account_type', 'description', 'parent_account', 'is_active', 'opening_balance', 'current_balance', 'balance', 'created_at', 'updated_at']
    
    def get_balance(self, obj):
        return obj.get_balance()

class JournalEntryLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntryLine
        fields = ['id', 'journal_entry', 'account', 'description', 'debit', 'credit', 'created_by', 'created_at']

class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalEntryLineSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    entry_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = ['id', 'store', 'entry_number', 'entry_type', 'date', 'reference', 'description', 'status', 'total_debits', 'total_credits', 'lines', 'created_by', 'created_by_name', 'posted_by', 'posted_at', 'entry_type_display', 'status_display', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else ''
    
    def get_entry_type_display(self, obj):
        return obj.get_entry_type_display()
    
    def get_status_display(self, obj):
        return obj.get_status_display()

class GeneralLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralLedger
        fields = ['id', 'date', 'account', 'journal_entry', 'debit', 'credit', 'reference', 'description', 'running_balance', 'created_by', 'created_at']

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ['id', 'store', 'account_name', 'account_number', 'bank_name', 'branch_code', 'account_type', 'opening_balance', 'current_balance', 'is_active', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        # If current_balance not explicitly provided, initialize it to opening_balance
        if 'current_balance' not in validated_data:
            validated_data['current_balance'] = validated_data.get('opening_balance', 0)
        return super().create(validated_data)

class MobileMoneyAccountSerializer(serializers.ModelSerializer):
    currency_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = MobileMoneyAccount
        fields = ['id', 'store', 'account_name', 'phone_number', 'provider', 'account_type', 'currency_code', 'opening_balance', 'current_balance', 'is_active', 'created_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'currency_code': {'required': False, 'allow_blank': True, 'allow_null': True}
        }

    def create(self, validated_data):
        # Initialize current_balance to opening_balance when not explicitly provided
        if 'current_balance' not in validated_data:
            validated_data['current_balance'] = validated_data.get('opening_balance', 0)
        return super().create(validated_data)

class CashTillSerializer(serializers.ModelSerializer):
    currency_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = CashTill
        fields = ['id', 'store', 'account_name', 'currency_code', 'opening_balance', 'current_balance', 'is_active', 'created_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'currency_code': {'required': False, 'allow_blank': True, 'allow_null': True}
        }

    def create(self, validated_data):
        # Initialize current_balance to opening_balance when not explicitly provided
        if 'current_balance' not in validated_data:
            validated_data['current_balance'] = validated_data.get('opening_balance', 0)
        return super().create(validated_data)

class BankTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankTransaction
        fields = ['id', 'bank_account', 'transaction_type', 'amount', 'reference', 'description', 'transaction_date', 'value_date', 'status', 'created_by', 'created_at', 'updated_at']

class MobileMoneyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MobileMoneyTransaction
        fields = ['id', 'mobile_account', 'transaction_type', 'amount', 'reference', 'description', 'transaction_date', 'value_date', 'status', 'created_by', 'created_at', 'updated_at']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'business', 'store', 'name', 'sku', 'description', 'category', 'unit_price', 'cost_price', 'quantity_in_stock', 'minimum_stock_level', 'is_active', 'created_at', 'updated_at']
        extra_kwargs = {
            'business': {'required': False, 'allow_null': True},
            'store': {'required': False, 'allow_null': True}
        }

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'business', 'store', 'name', 'service_code', 'description', 'category', 'service_price', 'duration_hours', 'is_active', 'created_at', 'updated_at']
        extra_kwargs = {
            'business': {'required': False, 'allow_null': True},
            'store': {'required': False, 'allow_null': True},
            'service_code': {'required': True},
            'name': {'required': True},
            'service_price': {'required': True},
            'duration_hours': {'required': False, 'allow_null': True},
        }

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['id', 'product', 'quantity', 'unit_cost', 'total_cost', 'transaction_type', 'reference', 'notes', 'created_at']

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'business', 'user', 'employee_id', 'first_name', 'last_name', 'email', 
            'phone', 'position', 'department', 'department_name', 'hire_date', 'salary', 
            'is_active', 'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relationship', 'emergency_contact_address',
            'national_id', 'passport_number', 'address', 'date_of_birth', 'gender', 
            'marital_status', 'full_name', 'created_at', 'updated_at'
        ]


class PayrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = ['id', 'employee', 'period_start', 'period_end', 'gross_salary', 'basic_salary', 'allowances', 'deductions', 'net_salary', 'status', 'created_at', 'updated_at']

class SaleSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleSession
        fields = ['id', 'cashier', 'store', 'start_time', 'end_time', 'is_active', 'opening_balance', 'closing_balance', 'total_sales', 'total_transactions', 'created_at']

class POSItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSItem
        fields = ['id', 'sale', 'product', 'service', 'item_name', 'quantity', 'unit_price', 'total_price']
        extra_kwargs = {
            'product': {'required': False, 'allow_null': True},
            'service': {'required': False, 'allow_null': True},
            'item_name': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, data):
        if not data.get('product') and not data.get('service'):
            raise serializers.ValidationError("Either product or service must be specified")
        if data.get('product') and data.get('service'):
            raise serializers.ValidationError("Cannot specify both product and service")
        return data


class POSItemDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_sku = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()
    service_code = serializers.SerializerMethodField()
    item_type = serializers.SerializerMethodField()

    class Meta:
        model = POSItem
        fields = ['id', 'product', 'service', 'product_name', 'product_sku', 'service_name', 'service_code', 'item_name', 'item_type', 'quantity', 'unit_price', 'total_price']
        read_only_fields = fields
    
    def get_product_name(self, obj):
        return obj.product.name if obj.product else None
    
    def get_product_sku(self, obj):
        return obj.product.sku if obj.product else None
    
    def get_service_name(self, obj):
        return obj.service.name if obj.service else None
    
    def get_service_code(self, obj):
        return obj.service.service_code if obj.service else None
    
    def get_item_type(self, obj):
        return 'product' if obj.product else 'service'


class POSSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSSale
        fields = ['id', 'session', 'sale_number', 'customer_name', 'customer_phone', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'payment_method', 'status', 'created_at']
        extra_kwargs = {
            'session': {'required': False, 'allow_null': True}
        }


class POSSaleDetailSerializer(POSSaleSerializer):
    items = POSItemDetailSerializer(many=True, read_only=True)
    session_id = serializers.IntegerField(source='session.id', read_only=True)

    class Meta(POSSaleSerializer.Meta):
        fields = POSSaleSerializer.Meta.fields + ['items', 'session_id']

class FiscalizationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FiscalizationLog
        fields = ['id', 'sale', 'fiscal_receipt_number', 'success', 'request_payload', 'response_payload', 'created_at']

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'name', 'description', 'is_active', 'created_at']

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            'id', 'business', 'vendor_code', 'name', 'vendor_type', 'email', 'phone', 'mobile',
            'address_line1', 'address_line2', 'city', 'province', 'country', 'postal_code',
            'tax_id', 'vat_number', 'registration_number', 'credit_limit', 'payment_terms_days',
            'currency', 'bank_name', 'bank_account_number', 'bank_branch', 'swift_code',
            'is_active', 'rating', 'notes', 'created_by', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'business': {'required': False, 'allow_null': True},
            'vendor_code': {'required': False},
            'phone': {'required': False, 'allow_blank': True},
            'address_line1': {'required': False, 'allow_blank': True},
            'city': {'required': False, 'allow_blank': True},
            'province': {'required': False, 'allow_blank': True},
            'created_by': {'required': False, 'allow_null': True},
            'address_line2': {'required': False, 'allow_blank': True},
            'postal_code': {'required': False, 'allow_blank': True},
            'website': {'required': False, 'allow_blank': True},
            'vat_number': {'required': False, 'allow_blank': True},
            'registration_number': {'required': False, 'allow_blank': True},
            'currency': {'required': False, 'allow_null': True},
            'bank_name': {'required': False, 'allow_blank': True},
            'bank_account_number': {'required': False, 'allow_blank': True},
            'bank_branch': {'required': False, 'allow_blank': True},
            'swift_code': {'required': False, 'allow_blank': True},
            'notes': {'required': False, 'allow_blank': True},
        }
    
    def create(self, validated_data):
        import random
        import string
        from decimal import Decimal
        user = self.context['request'].user
        
        # Set created_by if not provided (required field)
        if 'created_by' not in validated_data or not validated_data.get('created_by'):
            validated_data['created_by'] = user
        
        # Set business if not provided (required field)
        if 'business' not in validated_data or not validated_data.get('business'):
            business = getattr(user, 'business', None)
            if business:
                validated_data['business'] = business
            else:
                # If user has no business, try to get or create a default business
                from .models import Business
                business = Business.objects.first()
                if not business:
                    business = Business.objects.create(name=f"{user.username}'s Business")
                validated_data['business'] = business
        
        # Auto-generate vendor_code if not provided
        if not validated_data.get('vendor_code'):
            prefix = validated_data.get('name', 'VENDOR')[:3].upper()
            random_suffix = ''.join(random.choices(string.digits, k=6))
            validated_data['vendor_code'] = f"{prefix}-{random_suffix}"
        
        # Ensure vendor_code is unique (globally unique since unique=True at field level)
        prefix = validated_data['vendor_code'].split('-')[0] if '-' in validated_data['vendor_code'] else validated_data['vendor_code'][:3].upper()
        
        while Vendor.objects.filter(vendor_code=validated_data['vendor_code']).exists():
            random_suffix = ''.join(random.choices(string.digits, k=6))
            validated_data['vendor_code'] = f"{prefix}-{random_suffix}"
        
        # Set defaults for required fields (from models_extended, these are required at model level)
        # Use mobile if phone is not provided
        if not validated_data.get('phone') or validated_data.get('phone') == '':
            validated_data['phone'] = validated_data.get('mobile', 'N/A')
        # Ensure required address fields have values
        if not validated_data.get('address_line1') or validated_data.get('address_line1') == '':
            validated_data['address_line1'] = 'N/A'
        if not validated_data.get('city') or validated_data.get('city') == '':
            validated_data['city'] = 'N/A'
        if not validated_data.get('province') or validated_data.get('province') == '':
            validated_data['province'] = 'N/A'
        
        # Convert credit_limit to Decimal if it's a string or number
        if 'credit_limit' in validated_data:
            if isinstance(validated_data['credit_limit'], str):
                try:
                    validated_data['credit_limit'] = Decimal(validated_data['credit_limit'])
                except (ValueError, TypeError):
                    validated_data['credit_limit'] = Decimal('0')
            elif isinstance(validated_data['credit_limit'], (int, float)):
                validated_data['credit_limit'] = Decimal(str(validated_data['credit_limit']))
        
        # Ensure payment_terms_days is an integer
        if 'payment_terms_days' in validated_data:
            if isinstance(validated_data['payment_terms_days'], str):
                try:
                    validated_data['payment_terms_days'] = int(validated_data['payment_terms_days'])
                except (ValueError, TypeError):
                    validated_data['payment_terms_days'] = 30
        
        return super().create(validated_data)

class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.username', read_only=True)
    employee_count = serializers.IntegerField(read_only=True)
    active_employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = [
            'id', 'business', 'name', 'description', 'cost_center', 'manager', 
            'manager_name', 'modules', 'is_active', 'employee_count', 
            'active_employee_count', 'created_at', 'updated_at'
        ]
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['employee_count'] = instance.get_employee_count()
        data['active_employee_count'] = instance.get_active_employee_count()
        return data


class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = ['id', 'type', 'amount', 'period_start', 'period_end', 'submission_date', 'status']

class TaxReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxReminder
        fields = ['id', 'tax', 'reminder_type', 'reminder_date', 'message', 'sent', 'sent_at', 'created_at']

# ==================== PROJECT MANAGEMENT SERIALIZERS ====================
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'business', 'name', 'email', 'phone', 'address', 
            'vat_number', 'is_active', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'business': {'required': False, 'allow_null': True}
        }

class ProjectSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    project_manager_name = serializers.CharField(source='project_manager.username', read_only=True)
    completion_percentage = serializers.IntegerField(source='get_completion_percentage', read_only=True)
    budget_utilization = serializers.DecimalField(source='get_budget_utilization', max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'business', 'name', 'description', 'project_type', 'status',
            'start_date', 'end_date', 'budget', 'actual_cost', 'progress',
            'project_manager', 'project_manager_name', 'customer', 'customer_name',
            'completion_percentage', 'budget_utilization', 'created_at', 'updated_at'
        ]

class ProjectTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = ProjectTask
        fields = [
            'id', 'project', 'project_name', 'title', 'description', 'status',
            'priority', 'assigned_to', 'assigned_to_name', 'start_date', 'due_date',
            'estimated_hours', 'actual_hours', 'progress', 'created_at', 'updated_at'
        ]

class ProjectExpenseSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = ProjectExpense
        fields = [
            'id', 'project', 'project_name', 'description', 'amount', 
            'expense_date', 'category', 'approved_by', 'approved_by_name',
            'created_at', 'updated_at'
        ]

class ProjectTimesheetSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    billable_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = ProjectTimesheet
        fields = [
            'id', 'project', 'project_name', 'task', 'task_title', 'employee', 
            'employee_name', 'date', 'start_time', 'end_time', 'hours_worked',
            'description', 'is_billable', 'hourly_rate', 'billable_amount',
            'created_at', 'updated_at'
        ]

# ==================== ZIMBABWE-SPECIFIC SERIALIZERS ====================

class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'exchange_rate_to_usd', 'is_base_currency', 'is_active', 'last_updated']

class ExchangeRateSerializer(serializers.ModelSerializer):
    from_currency_name = serializers.CharField(source='from_currency.name', read_only=True)
    to_currency_name = serializers.CharField(source='to_currency.name', read_only=True)
    
    class Meta:
        model = ExchangeRate
        fields = ['id', 'from_currency', 'from_currency_name', 'to_currency', 'to_currency_name', 'rate', 'date', 'source']

class ZIMRAConfigurationSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    
    class Meta:
        model = ZIMRAConfiguration
        fields = [
            'id', 'business', 'business_name', 'vat_registration_number', 'paye_number',
            'corporate_tax_number', 'vat_rate', 'vat_threshold', 'is_vat_registered',
            'vat_period', 'fiscal_year_start', 'created_at', 'updated_at'
        ]
        read_only_fields = ['business']
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        return super().create(validated_data)

class VATReturnSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    
    class Meta:
        model = VATReturn
        fields = [
            'id', 'business', 'business_name', 'period_start', 'period_end',
            'total_sales', 'vat_on_sales', 'total_purchases', 'vat_on_purchases',
            'net_vat_payable', 'status', 'submission_date', 'payment_date',
            'due_date', 'penalty_amount', 'interest_amount', 'created_at', 'updated_at'
        ]
        read_only_fields = ['business', 'net_vat_payable']
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        return super().create(validated_data)

class PAYECalculationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    
    class Meta:
        model = PAYECalculation
        fields = [
            'id', 'employee', 'employee_name', 'payroll', 'gross_salary',
            'taxable_income', 'tax_free_threshold', 'paye_amount', 'created_at'
        ]
        read_only_fields = ['paye_amount']

class NSSAContributionSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    
    class Meta:
        model = NSSAContribution
        fields = [
            'id', 'employee', 'employee_name', 'payroll', 'nssa_number',
            'gross_salary', 'employee_contribution', 'employer_contribution',
            'total_contribution', 'contribution_rate', 'created_at'
        ]
        read_only_fields = ['employee_contribution', 'employer_contribution', 'total_contribution']

class MobileMoneyIntegrationSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    
    class Meta:
        model = MobileMoneyIntegration
        fields = [
            'id', 'business', 'business_name', 'provider', 'merchant_code',
            'is_active', 'test_mode', 'created_at', 'updated_at'
        ]
        read_only_fields = ['business']
        extra_kwargs = {
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True}
        }
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        return super().create(validated_data)

class MobileMoneyPaymentSerializer(serializers.ModelSerializer):
    provider = serializers.CharField(source='integration.provider', read_only=True)
    currency_code = serializers.CharField(source='currency.code', read_only=True)
    
    class Meta:
        model = MobileMoneyPayment
        fields = [
            'id', 'integration', 'provider', 'transaction_type', 'amount',
            'currency', 'currency_code', 'phone_number', 'reference',
            'external_reference', 'status', 'status_message',
            'transaction_date', 'created_at', 'updated_at'
        ]

# ==================== ENHANCED INVENTORY SERIALIZERS ====================

class WarehouseSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    
    class Meta:
        model = Warehouse
        fields = [
            'id', 'business', 'business_name', 'name', 'code', 'address',
            'manager', 'manager_name', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['business']
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        return super().create(validated_data)

class ProductCategorySerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    parent_name = serializers.CharField(source='parent_category.name', read_only=True)
    
    class Meta:
        model = ProductCategory
        fields = [
            'id', 'business', 'business_name', 'name', 'code', 'description',
            'parent_category', 'parent_name', 'is_active', 'created_at'
        ]
        read_only_fields = ['business']
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        return super().create(validated_data)

class InventoryItemSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'business', 'business_name', 'name', 'sku', 'barcode',
            'item_type', 'category', 'category_name', 'unit_of_measure',
            'purchase_price', 'selling_price', 'minimum_stock_level',
            'maximum_stock_level', 'reorder_point', 'valuation_method',
            'track_batches', 'track_serial_numbers', 'current_stock',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['business', 'current_stock']
    
    def get_current_stock(self, obj):
        return obj.get_current_stock()
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        return super().create(validated_data)

class StockRecordSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    
    class Meta:
        model = StockRecord
        fields = [
            'id', 'item', 'item_name', 'warehouse', 'warehouse_name',
            'quantity', 'reserved_quantity', 'available_quantity', 'last_updated'
        ]
        read_only_fields = ['available_quantity']

class StockMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'item_name', 'warehouse', 'warehouse_name',
            'movement_type', 'quantity', 'unit_cost', 'total_cost',
            'reference', 'notes', 'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['total_cost', 'created_by']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

# ==================== MANUFACTURING SERIALIZERS ====================

class BOMItemSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    total_cost = serializers.SerializerMethodField()
    
    class Meta:
        model = BOMItem
        fields = [
            'id', 'material', 'material_name', 'quantity', 'unit_cost',
            'scrap_percentage', 'total_cost'
        ]
    
    def get_total_cost(self, obj):
        return obj.get_total_cost()

class BillOfMaterialsSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    finished_product_name = serializers.CharField(source='finished_product.name', read_only=True)
    items = BOMItemSerializer(many=True, read_only=True)
    total_cost = serializers.SerializerMethodField()
    
    class Meta:
        model = BillOfMaterials
        fields = [
            'id', 'business', 'business_name', 'finished_product', 'finished_product_name',
            'name', 'version', 'quantity', 'items', 'total_cost',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['business', 'total_cost']
    
    def get_total_cost(self, obj):
        return obj.get_total_cost()
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        return super().create(validated_data)

class WorkOrderSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    product_name = serializers.CharField(source='bom.finished_product.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkOrder
        fields = [
            'id', 'business', 'business_name', 'work_order_number', 'bom',
            'product_name', 'quantity_to_produce', 'quantity_produced',
            'status', 'planned_start_date', 'planned_end_date',
            'actual_start_date', 'actual_end_date', 'completion_percentage',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['business', 'created_by', 'completion_percentage']
    
    def get_completion_percentage(self, obj):
        return obj.get_completion_percentage()
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

# ==================== AGRICULTURE SERIALIZERS ====================

class CropSerializer(serializers.ModelSerializer):
    class Meta:
        model = Crop
        fields = [
            'id', 'name', 'scientific_name', 'category', 'growing_season',
            'average_yield_per_hectare', 'created_at'
        ]

class FarmSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    
    class Meta:
        model = Farm
        fields = [
            'id', 'business', 'business_name', 'name', 'location',
            'total_area', 'area_unit', 'manager', 'manager_name',
            'is_active', 'created_at'
        ]
        read_only_fields = ['business']
    
    def create(self, validated_data):
        validated_data['business'] = self.context['request'].user.business
        return super().create(validated_data)

class CropSeasonSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    crop_name = serializers.CharField(source='crop.name', read_only=True)
    
    class Meta:
        model = CropSeason
        fields = [
            'id', 'farm', 'farm_name', 'crop', 'crop_name', 'season_name',
            'area_planted', 'planting_date', 'expected_harvest_date',
            'actual_harvest_date', 'expected_yield', 'actual_yield',
            'status', 'created_at'
        ]

class AgriculturalExpenseSerializer(serializers.ModelSerializer):
    crop_season_name = serializers.CharField(source='crop_season.season_name', read_only=True)
    currency_code = serializers.CharField(source='currency.code', read_only=True)
    
    class Meta:
        model = AgriculturalExpense
        fields = [
            'id', 'crop_season', 'crop_season_name', 'category', 'description',
            'amount', 'currency', 'currency_code', 'expense_date',
            'supplier', 'created_at'
        ]

