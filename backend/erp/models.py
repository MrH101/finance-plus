from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from decimal import Decimal
from django.utils import timezone

# ==================== CORE MODELS ====================
class Business(models.Model):
    name = models.CharField(max_length=255, unique=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('employer', 'Employer'),
        ('employee', 'Employee'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    business = models.ForeignKey(Business, null=True, blank=True, on_delete=models.SET_NULL, related_name='users')
    modules = models.ManyToManyField('Module', blank=True, related_name='users', help_text='Override department modules for this user')
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Store(models.Model):
    name = models.CharField(max_length=100, db_index=True)
    address = models.TextField()
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_stores')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='stores')
    contact_number = models.CharField(max_length=20)
    vat_number = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['manager']),
            models.Index(fields=['vat_number']),
            models.Index(fields=['business']),
        ]
    
    def clean(self):
        if not self.name:
            raise ValidationError("Store name is required")
        if not self.vat_number:
            raise ValidationError("VAT number is required")
        super().clean()
    
    def __str__(self):
        return self.name

# ==================== ENHANCED FINANCIAL MODELS ====================
class ChartOfAccounts(models.Model):
    ACCOUNT_TYPES = [
        ('ASSET', 'Asset'),
        ('LIABILITY', 'Liability'),
        ('EQUITY', 'Equity'),
        ('REVENUE', 'Revenue'),
        ('EXPENSE', 'Expense'),
    ]

    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='accounts')
    code = models.CharField(max_length=10, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES, db_index=True)
    description = models.TextField(blank=True)
    parent_account = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='sub_accounts')
    is_active = models.BooleanField(default=True)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['account_type']),
            models.Index(fields=['store', 'account_type']),
            models.Index(fields=['parent_account']),
            models.Index(fields=['is_active']),
        ]
        unique_together = ['store', 'code']
    
    def clean(self):
        if not self.code:
            raise ValidationError("Account code is required")
        if not self.name:
            raise ValidationError("Account name is required")
        super().clean()
    
    def get_balance(self):
        """Get the current balance of the account"""
        return self.current_balance
    
    def update_balance(self, amount, is_debit=True):
        """Update the account balance"""
        if is_debit:
            self.current_balance += amount
        else:
            self.current_balance -= amount
        self.save()
    
    def __str__(self):
        return f"{self.code} - {self.name}"

class JournalEntry(models.Model):
    ENTRY_TYPES = [
        ('GENERAL', 'General Journal'),
        ('SALES', 'Sales Journal'),
        ('PURCHASES', 'Purchases Journal'),
        ('CASH_RECEIPTS', 'Cash Receipts Journal'),
        ('CASH_DISBURSEMENTS', 'Cash Disbursements Journal'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('POSTED', 'Posted'),
        ('REVERSED', 'Reversed'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='journal_entries')
    entry_number = models.CharField(max_length=20, unique=True)
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES, default='GENERAL')
    date = models.DateField()
    reference = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    total_debits = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_credits = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_journal_entries')
    posted_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True, related_name='posted_journal_entries')
    posted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['entry_number']),
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['store']),
            models.Index(fields=['created_by']),
        ]
    
    def clean(self):
        if self.total_debits != self.total_credits:
            raise ValidationError("Total debits must equal total credits")
        super().clean()
    
    def __str__(self):
        return f"{self.entry_number} - {self.description}"

class JournalEntryLine(models.Model):
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT)
    description = models.TextField()
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
        indexes = [
            models.Index(fields=['journal_entry']),
            models.Index(fields=['account']),
        ]
    
    def clean(self):
        if self.debit < 0 or self.credit < 0:
            raise ValidationError("Debit and credit amounts cannot be negative")
        if self.debit > 0 and self.credit > 0:
            raise ValidationError("A line cannot have both debit and credit amounts")
        if self.debit == 0 and self.credit == 0:
            raise ValidationError("A line must have either a debit or credit amount")
        super().clean()
    
    def __str__(self):
        return f"{self.journal_entry.entry_number} - {self.account.code}"

class GeneralLedger(models.Model):
    date = models.DateField(db_index=True)
    account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT, related_name='entries')
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.PROTECT, related_name='ledger_entries')
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reference = models.CharField(max_length=100)
    description = models.TextField()
    running_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['account']),
            models.Index(fields=['date', 'account']),
            models.Index(fields=['journal_entry']),
        ]
    
    def clean(self):
        if self.debit < 0 or self.credit < 0:
            raise ValidationError("Debit and credit amounts cannot be negative")
        super().clean()
    
    def update_running_balance(self):
        """Update the running balance for this account"""
        # Get the previous balance
        previous_entries = GeneralLedger.objects.filter(
            account=self.account,
            date__lt=self.date
        ).order_by('-date', '-id')
        
        if previous_entries.exists():
            previous_balance = previous_entries.first().running_balance
        else:
            previous_balance = self.account.opening_balance
        
        # Calculate new balance
        if self.debit > 0:
            self.running_balance = previous_balance + self.debit
        else:
            self.running_balance = previous_balance - self.credit
        
        self.save()
    
    def __str__(self):
        return f"{self.date} - {self.account.code}"

# ==================== BANKING MODELS ====================
class BankAccount(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='bank_accounts')
    account_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    bank_name = models.CharField(max_length=100)
    branch_code = models.CharField(max_length=20, blank=True)
    account_type = models.CharField(max_length=50, default='Current')
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['store']),
            models.Index(fields=['account_number']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.bank_name} - {self.account_number}"

class MobileMoneyAccount(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='mobile_money_accounts')
    account_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    provider = models.CharField(max_length=50)  # EcoCash, OneMoney, etc.
    account_type = models.CharField(max_length=50, default='Personal')
    currency_code = models.CharField(max_length=10, blank=True, null=True, help_text='Currency code (e.g., USD, ZWL)')
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['store']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.provider} - {self.phone_number}"

class CashTill(models.Model):
    """Cash at hand account for managing physical cash in stores"""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='cash_tills')
    account_name = models.CharField(max_length=100)
    currency_code = models.CharField(max_length=10, blank=True, null=True, help_text='Currency code (e.g., USD, ZWL)')
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['store']),
            models.Index(fields=['account_name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.account_name} - {self.store.name}"

class BankTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('TRANSFER', 'Transfer'),
        ('PAYMENT', 'Payment'),
        ('RECEIPT', 'Receipt'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    bank_account = models.ForeignKey(BankAccount, on_delete=models.PROTECT, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    transaction_date = models.DateField()
    value_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['bank_account']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['transaction_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.transaction_date}"

class MobileMoneyTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('TRANSFER', 'Transfer'),
        ('PAYMENT', 'Payment'),
        ('RECEIPT', 'Receipt'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    mobile_account = models.ForeignKey(MobileMoneyAccount, on_delete=models.PROTECT, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    transaction_date = models.DateField()
    value_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['mobile_account']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['transaction_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.transaction_date}"

# ==================== INVENTORY MODELS ====================
class Product(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='products')
    store = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, blank=True, related_name='products', help_text='Store this product belongs to (optional for multi-store scenarios)')
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, blank=True, default="General")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_in_stock = models.PositiveIntegerField(default=0)
    minimum_stock_level = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['sku']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.sku})"

class Service(models.Model):
    """Service model for businesses that provide services instead of or in addition to products"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='services')
    store = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, blank=True, related_name='services', help_text='Store this service belongs to (optional for multi-store scenarios)')
    name = models.CharField(max_length=100)
    service_code = models.CharField(max_length=50, unique=True, help_text='Unique service code/identifier')
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, blank=True, default="General")
    service_price = models.DecimalField(max_digits=10, decimal_places=2, help_text='Price for this service')
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Estimated duration in hours (optional)')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['service_code']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
        verbose_name_plural = "Services"
    
    def __str__(self):
        return f"{self.name} ({self.service_code})"

class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_records')
    quantity = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=[
        ('PURCHASE', 'Purchase'),
        ('SALE', 'Sale'),
        ('ADJUSTMENT', 'Adjustment'),
        ('TRANSFER', 'Transfer'),
    ])
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.quantity} units"

# ==================== EMPLOYEE MODELS ====================
class Employee(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='employees', default=1)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    position = models.CharField(max_length=100)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    hire_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    # Emergency Contact Information
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)
    emergency_contact_address = models.TextField(blank=True)
    
    # Additional fields for comprehensive HR management
    national_id = models.CharField(max_length=20, blank=True)
    passport_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], blank=True)
    marital_status = models.CharField(max_length=20, choices=[
        ('SINGLE', 'Single'),
        ('MARRIED', 'Married'),
        ('DIVORCED', 'Divorced'),
        ('WIDOWED', 'Widowed')
    ], blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['employee_id']),
            models.Index(fields=['is_active']),
            models.Index(fields=['department']),
        ]
        unique_together = ['business', 'employee_id']

    def clean(self):
        if not self.first_name:
            raise ValidationError("First name is required")
        if not self.last_name:
            raise ValidationError("Last name is required")
        if not self.email:
            raise ValidationError("Email is required")
        if self.department and self.department.business != self.business:
            raise ValidationError("Employee department must belong to the same business")

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_current_salary(self):
        return self.salary


class Payroll(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payroll_records')
    period_start = models.DateField()
    period_end = models.DateField()
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2)
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
    ], default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-period_end']
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['period_start']),
            models.Index(fields=['period_end']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.employee.first_name} {self.employee.last_name} - {self.period_start} to {self.period_end}"

# ==================== POS MODELS ====================
class SaleSession(models.Model):
    cashier = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sale_sessions')
    store = models.ForeignKey(Store, on_delete=models.PROTECT, related_name='sale_sessions', null=True, blank=True, help_text='Store where this POS session is active')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    opening_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    closing_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_sales = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_transactions = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['cashier']),
            models.Index(fields=['is_active']),
            models.Index(fields=['start_time']),
        ]
    
    def __str__(self):
        return f"Session {self.id} - {self.cashier.username}"

class POSSale(models.Model):
    session = models.ForeignKey(SaleSession, on_delete=models.PROTECT, related_name='sales')
    sale_number = models.CharField(max_length=20, unique=True)
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=[
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('MIXED', 'Mixed'),
    ])
    status = models.CharField(max_length=20, choices=[
        ('COMPLETED', 'Completed'),
        ('REFUNDED', 'Refunded'),
        ('CANCELLED', 'Cancelled'),
    ], default='COMPLETED')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session']),
            models.Index(fields=['sale_number']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Sale {self.sale_number} - {self.total_amount}"

class POSItem(models.Model):
    sale = models.ForeignKey(POSSale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True, help_text='Product for this item (if applicable)')
    service = models.ForeignKey(Service, on_delete=models.PROTECT, null=True, blank=True, help_text='Service for this item (if applicable)')
    item_name = models.CharField(max_length=200, blank=True, help_text='Name of the item (product or service)')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    
    class Meta:
        indexes = [
            models.Index(fields=['sale']),
            models.Index(fields=['product']),
            models.Index(fields=['service']),
        ]
    
    def clean(self):
        if not self.product and not self.service:
            raise ValidationError("Either product or service must be specified")
        if self.product and self.service:
            raise ValidationError("Cannot specify both product and service")
        # Set item_name from product or service if not provided
        if not self.item_name:
            if self.product:
                self.item_name = self.product.name
            elif self.service:
                self.item_name = self.service.name
    
    def save(self, *args, **kwargs):
        # Auto-set item_name if not provided
        if not self.item_name:
            if self.product:
                self.item_name = self.product.name
            elif self.service:
                self.item_name = self.service.name
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        item_type = 'Product' if self.product else 'Service'
        item_name = self.item_name or (self.product.name if self.product else (self.service.name if self.service else 'Unknown'))
        return f"{item_type}: {item_name} x {self.quantity}"

class FiscalizationLog(models.Model):
    sale = models.ForeignKey(POSSale, on_delete=models.CASCADE, related_name='fiscalization_logs')
    fiscal_receipt_number = models.CharField(max_length=50)
    success = models.BooleanField()
    request_payload = models.TextField()
    response_payload = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sale']),
            models.Index(fields=['fiscal_receipt_number']),
            models.Index(fields=['success']),
        ]
    
    def __str__(self):
        return f"Fiscalization {self.fiscal_receipt_number} - {'Success' if self.success else 'Failed'}"

# ==================== MODULE SYSTEM ====================
class Module(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Department(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='departments', default=1)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    cost_center = models.CharField(max_length=50, blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments')
    modules = models.ManyToManyField(Module, blank=True, related_name='departments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['business', 'name']
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['manager']),
            models.Index(fields=['is_active']),
        ]
    
    def clean(self):
        if not self.name:
            raise ValidationError("Department name is required")
        if self.manager and self.manager.business != self.business:
            raise ValidationError("Manager must belong to the same business")
    
    def __str__(self):
        return f"{self.name} ({self.business.name})"
    
    def get_employee_count(self):
        return self.employees.count()
    
    def get_active_employee_count(self):
        return self.employees.filter(is_active=True).count()

# ==================== TAX MODELS ====================
class Tax(models.Model):
    TAX_TYPES = [
        ('VAT', 'Value Added Tax'),
        ('PAYE', 'Pay As You Earn'),
        ('CORPORATE', 'Corporate Tax'),
    ]
    type = models.CharField(max_length=20, choices=TAX_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    period_start = models.DateField()
    period_end = models.DateField()
    submission_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, 
                             choices=[('DRAFT', 'Draft'), ('SUBMITTED', 'Submitted')],
                             default='DRAFT')
    
    def clean(self):
        if self.period_start >= self.period_end:
            raise ValidationError("Period end must be after period start")
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.period_start} to {self.period_end}"

class TaxReminder(models.Model):
    """Tax payment reminders and scheduling"""
    REMINDER_TYPES = [
        ('EMAIL', 'Email Reminder'),
        ('SMS', 'SMS Reminder'),
        ('SYSTEM', 'System Notification'),
    ]
    
    tax = models.ForeignKey(Tax, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES)
    reminder_date = models.DateField()
    message = models.TextField()
    sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['reminder_date']
        indexes = [
            models.Index(fields=['reminder_date']),
            models.Index(fields=['sent']),
            models.Index(fields=['tax']),
        ]
    
    def __str__(self):
        return f"{self.get_reminder_type_display()} - {self.tax.get_type_display()} - {self.reminder_date}"
    
    def send_reminder(self):
        """Send the reminder"""
        if self.sent:
            return False
        
        try:
            if self.reminder_type == 'EMAIL':
                # Send email reminder
                from django.core.mail import send_mail
                from django.conf import settings
                
                send_mail(
                    subject=f"Tax Payment Reminder - {self.tax.get_type_display()}",
                    message=self.message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.ADMIN_EMAIL],
                    fail_silently=False,
                )
            elif self.reminder_type == 'SMS':
                # Send SMS reminder (would integrate with SMS service)
                pass
            elif self.reminder_type == 'SYSTEM':
                # Create system notification
                pass
            
            self.sent = True
            self.sent_at = timezone.now()
            self.save()
            return True
            
        except Exception as e:
            # Log error but don't fail
            print(f"Failed to send reminder: {e}")
            return False

# ==================== CUSTOMER MODELS ====================
class Customer(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='customers', default=1)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    vat_number = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['is_active']),
        ]
        unique_together = ['business', 'email']
    
    def __str__(self):
        return f"{self.name} ({self.business.name})"

# ==================== PROJECT MANAGEMENT MODELS ====================
class Project(models.Model):
    PROJECT_STATUS = [
        ('PLANNING', 'Planning'),
        ('IN_PROGRESS', 'In Progress'),
        ('ON_HOLD', 'On Hold'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    PROJECT_TYPES = [
        ('INTERNAL', 'Internal'),
        ('CLIENT', 'Client Project'),
        ('RESEARCH', 'Research & Development'),
        ('MAINTENANCE', 'Maintenance'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='projects', default=1)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPES, default='INTERNAL')
    status = models.CharField(max_length=20, choices=PROJECT_STATUS, default='PLANNING')
    start_date = models.DateField()
    end_date = models.DateField()
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    progress = models.IntegerField(default=0)  # Percentage
    project_manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_projects')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['status']),
            models.Index(fields=['project_type']),
            models.Index(fields=['start_date']),
        ]
    
    def clean(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("Start date cannot be after end date")
        if self.customer and self.customer.business != self.business:
            raise ValidationError("Customer must belong to the same business")
    
    def __str__(self):
        return f"{self.name} ({self.business.name})"
    
    def get_completion_percentage(self):
        return self.progress
    
    def get_budget_utilization(self):
        if self.budget and self.budget > 0:
            return (self.actual_cost / self.budget) * 100
        return 0

class ProjectTask(models.Model):
    TASK_STATUS = [
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('REVIEW', 'Review'),
        ('DONE', 'Done'),
    ]
    
    TASK_PRIORITY = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=TASK_STATUS, default='TODO')
    priority = models.CharField(max_length=20, choices=TASK_PRIORITY, default='MEDIUM')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    progress = models.IntegerField(default=0)  # Percentage
    # Commenting out parent_task to avoid circular reference issues for now
    # parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['assigned_to']),
        ]
    
    def clean(self):
        if self.start_date and self.due_date and self.start_date > self.due_date:
            raise ValidationError("Start date cannot be after due date")
        if self.assigned_to and self.assigned_to.business != self.project.business:
            raise ValidationError("Assigned user must belong to the same business")
    
    def __str__(self):
        return f"{self.title} - {self.project.name}"

class ProjectExpense(models.Model):
    """Project expenses tracking"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    expense_date = models.DateField()
    category = models.CharField(default="General",max_length=100, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['project']),
            models.Index(fields=['expense_date']),
        ]
    
    def clean(self):
        if self.approved_by and self.approved_by.business != self.project.business:
            raise ValidationError("Approver must belong to the same business")
    
    def __str__(self):
        return f"{self.description} - ${self.amount} ({self.project.name})"

class ProjectTimesheet(models.Model):
    """Time tracking for project tasks"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='timesheets')
    task = models.ForeignKey(ProjectTask, on_delete=models.CASCADE, null=True, blank=True, related_name='timesheets')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='timesheets')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    hours_worked = models.DecimalField(max_digits=4, decimal_places=2)
    description = models.TextField(blank=True)
    is_billable = models.BooleanField(default=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['project']),
            models.Index(fields=['employee']),
            models.Index(fields=['date']),
        ]
        unique_together = ['employee', 'date', 'start_time']
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")
        if self.employee.business != self.project.business:
            raise ValidationError("Employee must belong to the same business as the project")
    
    def save(self, *args, **kwargs):
        # Auto-calculate hours worked
        if self.start_time and self.end_time:
            start_datetime = timezone.datetime.combine(timezone.datetime.today(), self.start_time)
            end_datetime = timezone.datetime.combine(timezone.datetime.today(), self.end_time)
            if end_datetime < start_datetime:  # Handle overnight work
                end_datetime += timezone.timedelta(days=1)
            duration = end_datetime - start_datetime
            self.hours_worked = Decimal(str(duration.total_seconds() / 3600))
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.project.name} ({self.date})"
    
    @property
    def billable_amount(self):
        if self.is_billable and self.hourly_rate:
            return self.hours_worked * self.hourly_rate
        return Decimal('0.00')

# ==================== ZIMBABWE-SPECIFIC COMPLIANCE MODELS ====================

class Currency(models.Model):
    """Multi-currency support for Zimbabwe's economic environment"""
    code = models.CharField(max_length=3, unique=True)  # USD, ZWL, etc.
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10)
    exchange_rate_to_usd = models.DecimalField(max_digits=15, decimal_places=6, default=1.0)
    is_base_currency = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Currencies"
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
            models.Index(fields=['is_base_currency']),
        ]
    
    def clean(self):
        # Ensure only one base currency
        if self.is_base_currency:
            base_currencies = Currency.objects.filter(is_base_currency=True)
            if self.pk:
                base_currencies = base_currencies.exclude(pk=self.pk)
            if base_currencies.exists():
                raise ValidationError("Only one base currency is allowed")
    
    def __str__(self):
        return f"{self.code} - {self.name}"

class ExchangeRate(models.Model):
    """Historical exchange rates for accurate financial reporting"""
    from_currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='from_rates')
    to_currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='to_rates')
    rate = models.DecimalField(max_digits=15, decimal_places=6)
    date = models.DateField()
    source = models.CharField(max_length=100, blank=True)  # RBZ, Banks, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['from_currency', 'to_currency', 'date']
        indexes = [
            models.Index(fields=['from_currency', 'to_currency', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.from_currency.code}/{self.to_currency.code} = {self.rate} ({self.date})"

class ZIMRAConfiguration(models.Model):
    """ZIMRA (Zimbabwe Revenue Authority) configuration"""
    business = models.OneToOneField(Business, on_delete=models.CASCADE, related_name='zimra_config')
    vat_registration_number = models.CharField(max_length=20, unique=True)
    paye_number = models.CharField(max_length=20, blank=True)
    corporate_tax_number = models.CharField(max_length=20, blank=True)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.0)  # 15% VAT
    vat_threshold = models.DecimalField(max_digits=15, decimal_places=2, default=60000)  # VAT registration threshold
    is_vat_registered = models.BooleanField(default=False)
    vat_period = models.CharField(max_length=20, choices=[
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
    ], default='MONTHLY')
    fiscal_year_start = models.DateField(default='2024-01-01')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['vat_registration_number']),
            models.Index(fields=['is_vat_registered']),
        ]
    
    def __str__(self):
        return f"ZIMRA Config - {self.business.name}"

class VATReturn(models.Model):
    """VAT return submissions to ZIMRA"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='vat_returns', default=1)
    period_start = models.DateField()
    period_end = models.DateField()
    total_sales = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    vat_on_sales = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_purchases = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    vat_on_purchases = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_vat_payable = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ], default='DRAFT')
    submission_date = models.DateTimeField(null=True, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateField()
    penalty_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    interest_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['business', 'period_start', 'period_end']
        indexes = [
            models.Index(fields=['business', 'period_start']),
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
        ]
    
    def calculate_net_vat(self):
        """Calculate net VAT payable"""
        self.net_vat_payable = self.vat_on_sales - self.vat_on_purchases
        if self.net_vat_payable < 0:
            self.net_vat_payable = 0  # No refunds in basic implementation
    
    def __str__(self):
        return f"VAT Return {self.period_start} - {self.period_end} ({self.business.name})"

class PAYECalculation(models.Model):
    """PAYE (Pay As You Earn) tax calculations"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='paye_calculations')
    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='paye_calculations')
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2)
    taxable_income = models.DecimalField(max_digits=10, decimal_places=2)
    tax_free_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=700)  # Monthly threshold
    paye_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['payroll']),
        ]
    
    def calculate_paye(self):
        """Calculate PAYE tax based on Zimbabwe tax brackets"""
        if self.taxable_income <= self.tax_free_threshold:
            self.paye_amount = 0
        else:
            taxable = self.taxable_income - self.tax_free_threshold
            
            # Zimbabwe PAYE tax brackets (simplified)
            if taxable <= 1200:
                self.paye_amount = taxable * Decimal('0.20')  # 20%
            elif taxable <= 3600:
                self.paye_amount = (1200 * Decimal('0.20')) + ((taxable - 1200) * Decimal('0.25'))  # 25%
            else:
                self.paye_amount = (1200 * Decimal('0.20')) + (2400 * Decimal('0.25')) + ((taxable - 3600) * Decimal('0.30'))  # 30%
    
    def __str__(self):
        return f"PAYE - {self.employee.full_name} ({self.payroll.period_start})"

class NSSAContribution(models.Model):
    """NSSA (National Social Security Authority) contributions"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='nssa_contributions')
    payroll = models.ForeignKey(Payroll, on_delete=models.CASCADE, related_name='nssa_contributions')
    nssa_number = models.CharField(max_length=20)
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2)
    employee_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    employer_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    contribution_rate = models.DecimalField(max_digits=5, decimal_places=2, default=3.0)  # 3% each
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['nssa_number']),
        ]
    
    def calculate_contributions(self):
        """Calculate NSSA contributions (3% employee, 3% employer)"""
        rate = self.contribution_rate / 100
        self.employee_contribution = self.gross_salary * rate
        self.employer_contribution = self.gross_salary * rate
        self.total_contribution = self.employee_contribution + self.employer_contribution
    
    def __str__(self):
        return f"NSSA - {self.employee.full_name} ({self.nssa_number})"

class MobileMoneyIntegration(models.Model):
    """Integration with Zimbabwe's mobile money platforms"""
    PROVIDERS = [
        ('ECOCASH', 'EcoCash'),
        ('ONEMONEY', 'OneMoney'),
        ('TELECASH', 'TeleCash'),
        ('MUKURU', 'Mukuru'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='mobile_money_configs', default=1)
    provider = models.CharField(max_length=20, choices=PROVIDERS)
    merchant_code = models.CharField(max_length=50)
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    webhook_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    test_mode = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['business', 'provider']
        indexes = [
            models.Index(fields=['provider']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_provider_display()} - {self.business.name}"

class MobileMoneyPayment(models.Model):
    """Mobile money payment transactions"""
    TRANSACTION_TYPES = [
        ('PAYMENT', 'Payment'),
        ('REFUND', 'Refund'),
        ('WITHDRAWAL', 'Withdrawal'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESSFUL', 'Successful'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    integration = models.ForeignKey(MobileMoneyIntegration, on_delete=models.CASCADE, related_name='payments')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    phone_number = models.CharField(max_length=20)
    reference = models.CharField(max_length=100)
    external_reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    status_message = models.TextField(blank=True)
    transaction_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['integration']),
            models.Index(fields=['status']),
            models.Index(fields=['transaction_date']),
            models.Index(fields=['reference']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount} {self.currency.code}"

# ==================== ENHANCED INVENTORY MODELS ====================

class Warehouse(models.Model):
    """Multi-warehouse management"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='warehouses', default=1)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField()
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_warehouses')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['business', 'name']
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"

class ProductCategory(models.Model):
    """Product categorization"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='product_categories', default=1)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Product Categories"
        unique_together = ['business', 'name']
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['parent_category']),
        ]
    
    def __str__(self):
        return self.name

class InventoryItem(models.Model):
    """Enhanced inventory item with batch/serial tracking"""
    ITEM_TYPES = [
        ('PRODUCT', 'Product'),
        ('SERVICE', 'Service'),
        ('RAW_MATERIAL', 'Raw Material'),
        ('FINISHED_GOOD', 'Finished Good'),
    ]
    
    VALUATION_METHODS = [
        ('FIFO', 'First In, First Out'),
        ('LIFO', 'Last In, First Out'),
        ('WEIGHTED_AVERAGE', 'Weighted Average'),
        ('STANDARD_COST', 'Standard Cost'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='inventory_items', default=1)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, blank=True)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES, default='PRODUCT')
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, blank=True)
    unit_of_measure = models.CharField(max_length=50, default='pieces')
    purchase_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    minimum_stock_level = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    maximum_stock_level = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reorder_point = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    valuation_method = models.CharField(max_length=20, choices=VALUATION_METHODS, default='FIFO')
    track_batches = models.BooleanField(default=False)
    track_serial_numbers = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['sku']),
            models.Index(fields=['barcode']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    def get_current_stock(self, warehouse=None):
        """Get current stock quantity"""
        stock_query = self.stock_records.filter(warehouse__is_active=True)
        if warehouse:
            stock_query = stock_query.filter(warehouse=warehouse)
        return stock_query.aggregate(total=models.Sum('quantity'))['total'] or 0

class StockRecord(models.Model):
    """Stock records per warehouse"""
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='stock_records')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stock_records')
    quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reserved_quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    available_quantity = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['item', 'warehouse']
        indexes = [
            models.Index(fields=['item']),
            models.Index(fields=['warehouse']),
        ]
    
    def save(self, *args, **kwargs):
        self.available_quantity = self.quantity - self.reserved_quantity
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.item.name} @ {self.warehouse.name}: {self.quantity}"

class StockMovement(models.Model):
    """Stock movement tracking"""
    MOVEMENT_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('TRANSFER', 'Transfer'),
        ('ADJUSTMENT', 'Adjustment'),
        ('DAMAGE', 'Damage'),
        ('EXPIRED', 'Expired'),
    ]
    
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='movements')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.DecimalField(max_digits=15, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['item']),
            models.Index(fields=['warehouse']),
            models.Index(fields=['movement_type']),
            models.Index(fields=['created_at']),
        ]
    
    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.unit_cost
        super().save(*args, **kwargs)
        
        # Update stock record
        stock_record, created = StockRecord.objects.get_or_create(
            item=self.item,
            warehouse=self.warehouse,
            defaults={'quantity': 0}
        )
        
        if self.movement_type in ['IN', 'ADJUSTMENT']:
            stock_record.quantity += self.quantity
        elif self.movement_type in ['OUT', 'DAMAGE', 'EXPIRED']:
            stock_record.quantity -= self.quantity
        
        stock_record.save()
    
    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.item.name} ({self.quantity})"

# ==================== MANUFACTURING MODELS ====================

class BillOfMaterials(models.Model):
    """Bill of Materials for manufacturing"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='boms', default=1)
    finished_product = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='boms', default=1)
    name = models.CharField(max_length=255)
    version = models.CharField(max_length=50, default='1.0')
    quantity = models.DecimalField(max_digits=15, decimal_places=2, default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Bill of Materials"
        verbose_name_plural = "Bills of Materials"
        unique_together = ['finished_product', 'version']
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['finished_product']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"BOM: {self.finished_product.name} v{self.version}"
    
    def get_total_cost(self):
        """Calculate total cost of materials"""
        return sum(item.get_total_cost() for item in self.items.all())

class BOMItem(models.Model):
    """Items in a Bill of Materials"""
    bom = models.ForeignKey(BillOfMaterials, on_delete=models.CASCADE, related_name='items')
    material = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.DecimalField(max_digits=15, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    scrap_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ['bom', 'material']
        indexes = [
            models.Index(fields=['bom']),
            models.Index(fields=['material']),
        ]
    
    def get_total_cost(self):
        """Calculate total cost including scrap"""
        scrap_factor = 1 + (self.scrap_percentage / 100)
        return self.quantity * self.unit_cost * scrap_factor
    
    def __str__(self):
        return f"{self.material.name} x {self.quantity}"

class WorkOrder(models.Model):
    """Manufacturing work orders"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('RELEASED', 'Released'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='work_orders', default=1)
    work_order_number = models.CharField(max_length=50, unique=True)
    bom = models.ForeignKey(BillOfMaterials, on_delete=models.CASCADE)
    quantity_to_produce = models.DecimalField(max_digits=15, decimal_places=2)
    quantity_produced = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    planned_start_date = models.DateTimeField()
    planned_end_date = models.DateTimeField()
    actual_start_date = models.DateTimeField(null=True, blank=True)
    actual_end_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['work_order_number']),
            models.Index(fields=['status']),
            models.Index(fields=['planned_start_date']),
        ]
    
    def __str__(self):
        return f"WO-{self.work_order_number}: {self.bom.finished_product.name}"
    
    def get_completion_percentage(self):
        """Calculate completion percentage"""
        if self.quantity_to_produce > 0:
            return (self.quantity_produced / self.quantity_to_produce) * 100
        return 0

# ==================== AGRICULTURE-SPECIFIC MODELS ====================

class Farm(models.Model):
    """Farm management for agricultural businesses"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='farms', default=1)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    total_area = models.DecimalField(max_digits=10, decimal_places=2)  # in hectares
    area_unit = models.CharField(max_length=20, default='hectares')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_farms')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['business', 'name']
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.total_area} {self.area_unit})"

class Crop(models.Model):
    """Crop types for agricultural tracking"""
    name = models.CharField(max_length=100, unique=True, default='Generic Crop')
    scientific_name = models.CharField(max_length=255, blank=True)
    category = models.CharField(default="General",max_length=100)  # Cereal, Vegetable, Fruit, etc.
    growing_season = models.CharField(max_length=100, default='All-year', blank=True)  # Summer, Winter, All-year
    average_yield_per_hectare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class CropSeason(models.Model):
    """Crop seasons/plantings"""
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='crop_seasons')
    crop = models.ForeignKey(Crop, on_delete=models.CASCADE)
    season_name = models.CharField(max_length=100)  # 2024 Summer Maize
    area_planted = models.DecimalField(max_digits=10, decimal_places=2)
    planting_date = models.DateField()
    expected_harvest_date = models.DateField()
    actual_harvest_date = models.DateField(null=True, blank=True)
    expected_yield = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    actual_yield = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=[
        ('PLANNED', 'Planned'),
        ('PLANTED', 'Planted'),
        ('GROWING', 'Growing'),
        ('HARVESTED', 'Harvested'),
        ('FAILED', 'Failed'),
    ], default='PLANNED')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['farm']),
            models.Index(fields=['crop']),
            models.Index(fields=['status']),
            models.Index(fields=['planting_date']),
        ]
    
    def __str__(self):
        return f"{self.season_name} - {self.crop.name}"

class AgriculturalExpense(models.Model):
    """Agricultural expenses tracking"""
    EXPENSE_CATEGORIES = [
        ('SEEDS', 'Seeds'),
        ('FERTILIZER', 'Fertilizer'),
        ('PESTICIDE', 'Pesticide'),
        ('FUEL', 'Fuel'),
        ('LABOR', 'Labor'),
        ('EQUIPMENT', 'Equipment'),
        ('IRRIGATION', 'Irrigation'),
        ('OTHER', 'Other'),
    ]
    
    crop_season = models.ForeignKey(CropSeason, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(default="General",max_length=20, choices=EXPENSE_CATEGORIES)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    expense_date = models.DateField()
    supplier = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['crop_season']),
            models.Index(fields=['category']),
            models.Index(fields=['expense_date']),
        ]

    def __str__(self):
        return f"{self.get_category_display()} - {self.amount} {self.currency.code}"

