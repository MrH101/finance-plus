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
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
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
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
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
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
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
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
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
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
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
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
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
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, blank=True)
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
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='employees')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    position = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['employee_id']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"

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
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    
    class Meta:
        indexes = [
            models.Index(fields=['sale']),
            models.Index(fields=['product']),
        ]
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

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
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    modules = models.ManyToManyField(Module, blank=True, related_name='departments')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

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
