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
    contact_number = models.CharField(max_length=20)
    vat_number = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['manager']),
            models.Index(fields=['vat_number']),
        ]
    
    def clean(self):
        if not self.name:
            raise ValidationError("Store name is required")
        if not self.vat_number:
            raise ValidationError("VAT number is required")
        super().clean()
    
    def __str__(self):
        return self.name

# ==================== FINANCIAL MODELS ====================
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
    
    class Meta:
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['account_type']),
            models.Index(fields=['store', 'account_type']),
        ]
        unique_together = ['store', 'code']
    
    def clean(self):
        if not self.code:
            raise ValidationError("Account code is required")
        if not self.name:
            raise ValidationError("Account name is required")
        super().clean()
    
    def __str__(self):
        return f"{self.code} - {self.name}"

class GeneralLedger(models.Model):
    date = models.DateField(db_index=True)
    account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT, related_name='entries')
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reference = models.CharField(max_length=100)
    description = models.TextField()
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['account']),
            models.Index(fields=['date', 'account']),
        ]
    
    def clean(self):
        if self.debit < 0 or self.credit < 0:
            raise ValidationError("Debit and credit amounts cannot be negative")
        super().clean()
    
    def __str__(self):
        return f"{self.date} - {self.account.code}"

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

# ==================== INVENTORY MODELS ====================
class Product(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products')
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_level = models.IntegerField()
    current_stock = models.IntegerField(default=0)
    vat_rate = models.DecimalField(max_digits=4, decimal_places=2, default=0.15)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['store']),
            models.Index(fields=['current_stock']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(current_stock__gte=0),
                name="non_negative_stock"
            )
        ]
    
    def clean(self):
        if self.price < 0:
            raise ValidationError("Price cannot be negative")
        if self.reorder_level < 0:
            raise ValidationError("Reorder level cannot be negative")
        super().clean()
    
    def update_stock(self, quantity, movement_type):
        """Update stock level and create inventory movement record"""
        if movement_type == 'SALE':
            if self.current_stock < quantity:
                raise ValidationError(f"Insufficient stock for {self.name}. Available: {self.current_stock}")
            self.current_stock -= quantity
        elif movement_type == 'PURCHASE':
            self.current_stock += quantity
        elif movement_type == 'ADJUSTMENT':
            self.current_stock = quantity
        
        self.save()
        return self.current_stock
    
    def __str__(self):
        return self.name

class InventoryMovement(models.Model):
    MOVEMENT_TYPES = [
        ('PURCHASE', 'Purchase'),
        ('SALE', 'Sale'),
        ('ADJUSTMENT', 'Adjustment'),
    ]
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    reference = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.movement_type} - {self.product.name}"

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    vat_number = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return self.name

# ==================== SALES & PURCHASES ====================
class Sale(models.Model):
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey('Customer', on_delete=models.PROTECT, related_name='sales')
    date = models.DateTimeField(auto_now_add=True)
    total_before_tax = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    vat_amount = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    total_after_tax = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    zimra_status = models.CharField(max_length=20, 
                                   choices=[('PENDING', 'Pending'), ('SUBMITTED', 'Submitted')],
                                   default='PENDING')
    payment_status = models.CharField(max_length=20,
                                    choices=[('PENDING', 'Pending'), ('PAID', 'Paid'), ('PARTIAL', 'Partial')],
                                    default='PENDING')
    payment_method = models.CharField(max_length=20,
                                    choices=[('CASH', 'Cash'), ('CARD', 'Card'), ('BANK', 'Bank Transfer')],
                                    default='CASH')
    
    class Meta:
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['date']),
            models.Index(fields=['customer']),
            models.Index(fields=['payment_status']),
        ]
    
    def __str__(self):
        return f"Sale #{self.invoice_number}"

    @transaction.atomic
    def calculate_totals(self):
        """Calculate sale totals and update inventory"""
        total_before_tax = Decimal('0.00')
        vat_amount = Decimal('0.00')
        
        for item in self.items.all():
            # Update product stock
            item.product.update_stock(item.quantity, 'SALE')
            
            # Calculate totals
            item_total = item.quantity * item.unit_price
            total_before_tax += item_total
            vat_amount += item.vat_amount
        
        self.total_before_tax = total_before_tax
        self.vat_amount = vat_amount
        self.total_after_tax = total_before_tax + vat_amount
        self.save()
        
        # Create general ledger entries
        GeneralLedger.objects.create(
            date=self.date.date(),
            account=ChartOfAccounts.objects.get(code='SALES'),
            credit=total_before_tax,
            reference=f"Sale #{self.invoice_number}",
            description=f"Sale to {self.customer.name}"
        )
        
        if vat_amount > 0:
            GeneralLedger.objects.create(
                date=self.date.date(),
                account=ChartOfAccounts.objects.get(code='VAT_PAYABLE'),
                credit=vat_amount,
                reference=f"Sale #{self.invoice_number}",
                description=f"VAT on sale to {self.customer.name}"
            )
        
        return self.total_after_tax

class Purchase(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]

    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)
    purchase_date = models.DateField()
    due_date = models.DateField()
    reference_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_totals(self):
        total = sum(item.total for item in self.items.all())
        self.total_amount = total
        self.save()

    def __str__(self):
        return f"Purchase {self.reference_number} - {self.supplier.name}"

    class Meta:
        ordering = ['-purchase_date']
        verbose_name = 'Purchase'
        verbose_name_plural = 'Purchases'

# ==================== PAYROLL MODELS ====================
class Employee(models.Model):
    EMPLOYMENT_TYPES = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    department = models.ForeignKey('Department', on_delete=models.PROTECT, related_name='employees')
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES, default='FULL_TIME')
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    employment_date = models.DateField()
    termination_date = models.DateField(null=True, blank=True)
    bank_name = models.CharField(max_length=100)
    bank_account = models.CharField(max_length=50)
    tax_number = models.CharField(max_length=50, unique=True)
    nssa_number = models.CharField(max_length=50, unique=True)
    nhima_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    
    # Leave tracking
    annual_leave_balance = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    sick_leave_balance = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    maternity_leave_balance = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    
    class Meta:
        indexes = [
            models.Index(fields=['employment_type']),
            models.Index(fields=['department']),
            models.Index(fields=['tax_number']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.department.name})"
    
    def calculate_leave_entitlement(self):
        """Calculate annual leave entitlement based on employment type and duration"""
        if self.employment_type == 'FULL_TIME':
            # Full-time employees get 20 days per year
            return 20
        elif self.employment_type == 'PART_TIME':
            # Part-time employees get 10 days per year
            return 10
        return 0
    
    def update_leave_balances(self):
        """Update leave balances at the start of each year"""
        self.annual_leave_balance = self.calculate_leave_entitlement()
        self.sick_leave_balance = 30  # 30 days sick leave per year
        self.save()

class LeaveRequest(models.Model):
    LEAVE_TYPES = [
        ('ANNUAL', 'Annual Leave'),
        ('SICK', 'Sick Leave'),
        ('MATERNITY', 'Maternity Leave'),
        ('UNPAID', 'Unpaid Leave'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_leaves')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['leave_type']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date")
        
        # Check leave balance
        if self.leave_type == 'ANNUAL':
            if self.employee.annual_leave_balance < self.get_duration():
                raise ValidationError("Insufficient annual leave balance")
        elif self.leave_type == 'SICK':
            if self.employee.sick_leave_balance < self.get_duration():
                raise ValidationError("Insufficient sick leave balance")
    
    def get_duration(self):
        """Calculate leave duration in days"""
        return (self.end_date - self.start_date).days + 1
    
    def approve(self, approver):
        """Approve leave request and update balances"""
        if self.status != 'PENDING':
            raise ValidationError("Only pending leave requests can be approved")
        
        self.status = 'APPROVED'
        self.approved_by = approver
        self.approved_at = timezone.now()
        
        # Update leave balances
        duration = self.get_duration()
        if self.leave_type == 'ANNUAL':
            self.employee.annual_leave_balance -= duration
        elif self.leave_type == 'SICK':
            self.employee.sick_leave_balance -= duration
        
        self.employee.save()
        self.save()

class Overtime(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='overtime_records')
    date = models.DateField()
    hours = models.DecimalField(max_digits=4, decimal_places=2)
    rate_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.5)
    reason = models.TextField()
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_overtime')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['date']),
        ]
    
    def calculate_amount(self):
        """Calculate overtime amount based on employee's salary"""
        hourly_rate = self.employee.salary / 160  # Assuming 160 working hours per month
        return hourly_rate * self.hours * self.rate_multiplier

class Payroll(models.Model):
    PAY_PERIODS = [
        ('MONTHLY', 'Monthly'),
        ('FORTNIGHTLY', 'Fortnightly'),
        ('WEEKLY', 'Weekly'),
    ]
    PAYMENT_STATUS = [
        ('DRAFT', 'Draft'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='payroll_records')
    period_start = models.DateField()
    period_end = models.DateField()
    pay_period = models.CharField(max_length=20, choices=PAY_PERIODS)
    
    # Earnings
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    overtime_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    allowances = models.JSONField(default=dict)  # Housing, transport, etc.
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Deductions
    paye = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nssa = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    nhima = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_deductions = models.JSONField(default=dict)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Net salary
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status and payment
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='DRAFT')
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['period_start', 'period_end']),
            models.Index(fields=['status']),
        ]
        unique_together = ['employee', 'period_start', 'period_end']
    
    def __str__(self):
        return f"Payroll {self.period_start} - {self.period_end}"
    
    def calculate_paye(self):
        """Calculate PAYE based on Zimbabwe tax brackets"""
        annual_salary = self.gross_salary * 12
        
        if annual_salary <= 300000:
            return self.gross_salary * Decimal('0.20')
        elif annual_salary <= 600000:
            return self.gross_salary * Decimal('0.25')
        elif annual_salary <= 1200000:
            return self.gross_salary * Decimal('0.30')
        else:
            return self.gross_salary * Decimal('0.35')
    
    def calculate_nssa(self):
        """Calculate NSSA contribution"""
        return self.gross_salary * Decimal('0.05')
    
    def calculate_nhima(self):
        """Calculate NHIMA contribution"""
        return self.gross_salary * Decimal('0.03')
    
    @transaction.atomic
    def calculate_totals(self):
        """Calculate all payroll totals"""
        # Calculate overtime
        overtime_records = Overtime.objects.filter(
            employee=self.employee,
            date__gte=self.period_start,
            date__lte=self.period_end,
            approved_at__isnull=False
        )
        self.overtime_amount = sum(record.calculate_amount() for record in overtime_records)
        
        # Calculate gross salary
        self.gross_salary = self.basic_salary + self.overtime_amount
        for allowance in self.allowances.values():
            self.gross_salary += Decimal(str(allowance))
        
        # Calculate deductions
        self.paye = self.calculate_paye()
        self.nssa = self.calculate_nssa()
        self.nhima = self.calculate_nhima()
        
        # Calculate total deductions
        self.total_deductions = self.paye + self.nssa + self.nhima
        for deduction in self.other_deductions.values():
            self.total_deductions += Decimal(str(deduction))
        
        # Calculate net salary
        self.net_salary = self.gross_salary - self.total_deductions
        
        self.save()
        
        # Create general ledger entries
        GeneralLedger.objects.create(
            date=self.period_end,
            account=ChartOfAccounts.objects.get(code='SALARIES'),
            debit=self.gross_salary,
            reference=f"Payroll #{self.id}",
            description=f"Salary for {self.employee.user.get_full_name()}"
        )
        
        # Create deduction entries
        if self.paye > 0:
            GeneralLedger.objects.create(
                date=self.period_end,
                account=ChartOfAccounts.objects.get(code='PAYE_PAYABLE'),
                credit=self.paye,
                reference=f"Payroll #{self.id}",
                description=f"PAYE for {self.employee.user.get_full_name()}"
            )
        
        if self.nssa > 0:
            GeneralLedger.objects.create(
                date=self.period_end,
                account=ChartOfAccounts.objects.get(code='NSSA_PAYABLE'),
                credit=self.nssa,
                reference=f"Payroll #{self.id}",
                description=f"NSSA for {self.employee.user.get_full_name()}"
            )
        
        if self.nhima > 0:
            GeneralLedger.objects.create(
                date=self.period_end,
                account=ChartOfAccounts.objects.get(code='NHIMA_PAYABLE'),
                credit=self.nhima,
                reference=f"Payroll #{self.id}",
                description=f"NHIMA for {self.employee.user.get_full_name()}"
            )
        
        return self.net_salary
    
    def approve(self):
        """Approve payroll and create payment record"""
        if self.status != 'DRAFT':
            raise ValidationError("Only draft payrolls can be approved")
        
        self.status = 'APPROVED'
        self.save()
        
        # Create accounts payable record
        AccountsPayable.objects.create(
            supplier=self.employee.user,
            amount=self.net_salary,
            due_date=self.payment_date,
            description=f"Salary payment for {self.period_start} to {self.period_end}",
            reference_number=f"SAL-{self.id}"
        )
    
    def mark_as_paid(self, payment_reference):
        """Mark payroll as paid"""
        if self.status != 'APPROVED':
            raise ValidationError("Only approved payrolls can be marked as paid")
        
        self.status = 'PAID'
        self.payment_reference = payment_reference
        self.save()
        
        # Update accounts payable
        payable = AccountsPayable.objects.get(reference_number=f"SAL-{self.id}")
        payable.paid = True
        payable.save()

    def get_payslip_data(self):
        employee = self.employee
        return {
            'employee_name': employee.user.get_full_name(),
            'employee_id': employee.id,
            'department': employee.department.name,
            'bank_name': employee.bank_name,
            'bank_account': employee.bank_account,
            'tax_number': employee.tax_number,
            'nssa_number': employee.nssa_number,
            'nhima_number': employee.nhima_number,
            'employment_type': employee.employment_type,
            'employment_date': employee.employment_date,
            'period_start': self.period_start,
            'period_end': self.period_end,
            'pay_period': self.pay_period,
            'basic_salary': self.basic_salary,
            'overtime_amount': self.overtime_amount,
            'allowances': self.allowances,
            'gross_salary': self.gross_salary,
            'paye': self.paye,
            'nssa': self.nssa,
            'nhima': self.nhima,
            'other_deductions': self.other_deductions,
            'total_deductions': self.total_deductions,
            'net_salary': self.net_salary,
            'status': self.status,
            'payment_date': self.payment_date,
            'payment_reference': self.payment_reference,
        }

# ==================== SUPPORTING MODELS ====================
class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    vat_number = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return self.name

class Department(models.Model):
    name = models.CharField(max_length=100)
    cost_center = models.CharField(max_length=10)
    modules = models.ManyToManyField('Module', blank=True, related_name='departments')
    def __str__(self):
        return self.name

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
    ]
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=50)
    record_id = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField()
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user} {self.action} {self.model_name}"

# ==================== DOCUMENT MANAGEMENT ====================
class DocumentTemplate(models.Model):
    DOCUMENT_TYPES = [
        ('INVOICE', 'Invoice'),
        ('PAYSLIP', 'Payslip'),
        ('LETTER', 'Letter'),
        ('REPORT', 'Report'),
    ]
    name = models.CharField(max_length=100)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    content = models.TextField()  # Could use Django template syntax
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.get_document_type_display()} Template: {self.name}"

# ... [Existing User, Store, ChartOfAccounts, GeneralLedger, Tax models] ...

class Letter(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    recipient = models.CharField(max_length=255)
    generated_date = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.title

class Report(models.Model):
    REPORT_TYPES = [
        ('FINANCIAL', 'Financial'),
        ('INVENTORY', 'Inventory'),
        ('SALES', 'Sales'),
    ]
    title = models.CharField(max_length=255)
    content = models.TextField()
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    generated_date = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.get_report_type_display()} Report: {self.title}"

class ScheduledReport(models.Model):
    """Scheduled report generation"""
    FREQUENCY_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    ]
    
    REPORT_TYPES = [
        ('PAYROLL', 'Payroll Report'),
        ('TAX', 'Tax Report'),
        ('INVENTORY', 'Inventory Report'),
        ('SALES', 'Sales Report'),
        ('CASH_FLOW', 'Cash Flow Report'),
        ('FINANCIAL', 'Financial Report'),
    ]
    
    name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    is_active = models.BooleanField(default=True)
    last_generated = models.DateTimeField(null=True, blank=True)
    next_generation = models.DateTimeField(null=True, blank=True)
    recipients = models.JSONField(default=list)  # List of email addresses
    parameters = models.JSONField(default=dict)  # Report parameters
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['next_generation']),
            models.Index(fields=['report_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"
    
    def calculate_next_generation(self):
        """Calculate next generation date based on frequency"""
        from datetime import datetime, timedelta
        
        if not self.last_generated:
            # If never generated, schedule for tomorrow
            return timezone.now() + timedelta(days=1)
        
        last_gen = self.last_generated
        
        if self.frequency == 'DAILY':
            return last_gen + timedelta(days=1)
        elif self.frequency == 'WEEKLY':
            return last_gen + timedelta(weeks=1)
        elif self.frequency == 'MONTHLY':
            # Add one month (approximate)
            return last_gen + timedelta(days=30)
        elif self.frequency == 'QUARTERLY':
            return last_gen + timedelta(days=90)
        elif self.frequency == 'YEARLY':
            return last_gen + timedelta(days=365)
        
        return last_gen + timedelta(days=1)
    
    def generate_report(self):
        """Generate the scheduled report"""
        try:
            # Import report generation functions
            from .reports import (
                PayrollReport, TaxReport, CostAnalysisReport
            )
            
            # Get date range for report
            end_date = timezone.now().date()
            if self.frequency == 'DAILY':
                start_date = end_date - timedelta(days=1)
            elif self.frequency == 'WEEKLY':
                start_date = end_date - timedelta(weeks=1)
            elif self.frequency == 'MONTHLY':
                start_date = end_date - timedelta(days=30)
            elif self.frequency == 'QUARTERLY':
                start_date = end_date - timedelta(days=90)
            elif self.frequency == 'YEARLY':
                start_date = end_date - timedelta(days=365)
            else:
                start_date = end_date - timedelta(days=1)
            
            # Generate report based on type
            if self.report_type == 'PAYROLL':
                report_data = PayrollReport.get_payroll_summary(start_date, end_date)
            elif self.report_type == 'TAX':
                report_data = TaxReport.get_tax_summary(start_date, end_date)
            elif self.report_type == 'INVENTORY':
                # Inventory report logic
                report_data = {'type': 'inventory', 'period': {'start': start_date, 'end': end_date}}
            elif self.report_type == 'SALES':
                # Sales report logic
                report_data = {'type': 'sales', 'period': {'start': start_date, 'end': end_date}}
            elif self.report_type == 'CASH_FLOW':
                # Cash flow report logic
                report_data = {'type': 'cash_flow', 'period': {'start': start_date, 'end': end_date}}
            elif self.report_type == 'FINANCIAL':
                report_data = CostAnalysisReport.get_cost_summary(start_date, end_date)
            else:
                report_data = {'type': 'unknown', 'period': {'start': start_date, 'end': end_date}}
            
            # Create report record
            Report.objects.create(
                title=f"Scheduled {self.get_report_type_display()} - {start_date} to {end_date}",
                content=str(report_data),
                report_type='FINANCIAL' if self.report_type in ['PAYROLL', 'TAX', 'FINANCIAL'] else 'SALES',
                generated_by=self.created_by
            )
            
            # Update last generated and next generation
            self.last_generated = timezone.now()
            self.next_generation = self.calculate_next_generation()
            self.save()
            
            # Send email to recipients if any
            if self.recipients:
                self.send_report_email(report_data)
            
            return True
            
        except Exception as e:
            print(f"Error generating scheduled report {self.id}: {e}")
            return False
    
    def send_report_email(self, report_data):
        """Send report via email to recipients"""
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            
            subject = f"Scheduled Report: {self.name}"
            message = f"""
            Hello,
            
            Your scheduled report "{self.name}" has been generated.
            
            Report Type: {self.get_report_type_display()}
            Period: {report_data.get('period', {}).get('start')} to {report_data.get('period', {}).get('end')}
            
            Please log into the system to view the complete report.
            
            Best regards,
            Finance Plus System
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=self.recipients,
                fail_silently=False,
            )
            
        except Exception as e:
            print(f"Error sending scheduled report email: {e}")

class Budget(models.Model):
    name = models.CharField(max_length=255)
    account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(blank=True)

    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date")

    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"

class AccountsPayable(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    due_date = models.DateField()
    date_recorded = models.DateField(auto_now_add=True)
    paid = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    reference_number = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"Payable to {self.supplier.name}: {self.amount}"

class AccountsReceivable(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    due_date = models.DateField()
    date_recorded = models.DateField(auto_now_add=True)
    paid = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    reference_number = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"Receivable from {self.customer.name}: {self.amount}"

class SaleItem(models.Model):
    sale = models.ForeignKey('Sale', on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sale_items')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    vat_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    
    class Meta:
        indexes = [
            models.Index(fields=['sale']),
            models.Index(fields=['product']),
        ]
    
    def clean(self):
        if self.quantity <= 0:
            raise ValidationError("Quantity must be greater than zero")
        if self.unit_price < 0:
            raise ValidationError("Unit price cannot be negative")
        super().clean()
    
    def save(self, *args, **kwargs):
        self.total_amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

class GeneratedDocument(models.Model):
    template = models.ForeignKey(DocumentTemplate, on_delete=models.PROTECT)
    content = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return f"Document from {self.template.name}"

class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Calculate total before saving
        subtotal = self.quantity * self.unit_price
        tax_amount = subtotal * (self.tax_rate / 100)
        self.total = subtotal + tax_amount - self.discount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - {self.quantity} x {self.unit_price}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Purchase Item'
        verbose_name_plural = 'Purchase Items'

class BankAccount(models.Model):
    """Bank account for the company/store"""
    BANK_CHOICES = [
        ('CBZ', 'CBZ Bank'),
        ('STANBIC', 'Stanbic Bank'),
        ('ECOBANK', 'Ecobank'),
        ('FBC', 'FBC Bank'),
        ('ZB', 'ZB Bank'),
        ('NMB', 'NMB Bank'),
        ('OTHER', 'Other Bank'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=20, choices=BANK_CHOICES)
    account_number = models.CharField(max_length=50, unique=True)
    account_name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=[
        ('CURRENT', 'Current Account'),
        ('SAVINGS', 'Savings Account'),
        ('FIXED_DEPOSIT', 'Fixed Deposit'),
    ])
    branch_code = models.CharField(max_length=20, blank=True)
    swift_code = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['bank_name']),
            models.Index(fields=['account_number']),
            models.Index(fields=['store']),
        ]
    
    def __str__(self):
        return f"{self.get_bank_name_display()} - {self.account_number}"
    
    def update_balance(self, amount, transaction_type):
        """Update account balance based on transaction"""
        if transaction_type == 'CREDIT':
            self.current_balance += amount
        elif transaction_type == 'DEBIT':
            if self.current_balance < amount:
                raise ValidationError(f"Insufficient funds. Available: {self.current_balance}")
            self.current_balance -= amount
        self.save()

class BankTransaction(models.Model):
    """Bank transaction records"""
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('TRANSFER', 'Transfer'),
        ('PAYMENT', 'Payment'),
        ('RECEIPT', 'Receipt'),
        ('CHARGES', 'Bank Charges'),
        ('INTEREST', 'Interest'),
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
    reference = models.CharField(max_length=100)
    description = models.TextField()
    transaction_date = models.DateField()
    value_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    balance_after = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['transaction_date']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['status']),
            models.Index(fields=['bank_account']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.reference}"
    
    def save(self, *args, **kwargs):
        # Update bank account balance
        if self.status == 'COMPLETED':
            if self.transaction_type in ['DEPOSIT', 'RECEIPT', 'INTEREST']:
                self.bank_account.update_balance(self.amount, 'CREDIT')
            elif self.transaction_type in ['WITHDRAWAL', 'PAYMENT', 'CHARGES']:
                self.bank_account.update_balance(self.amount, 'DEBIT')
            
            # Set balance after transaction
            self.balance_after = self.bank_account.current_balance
        
        super().save(*args, **kwargs)

class MobileMoneyAccount(models.Model):
    """Mobile money account for the company/store"""
    PROVIDER_CHOICES = [
        ('ECOCASH', 'EcoCash'),
        ('ONEMONEY', 'OneMoney'),
        ('INNOV8', 'InnBucks'),
        ('TELECASH', 'TeleCash'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='mobile_money_accounts')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    phone_number = models.CharField(max_length=20, unique=True)
    account_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['provider']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['store']),
        ]
    
    def __str__(self):
        return f"{self.get_provider_display()} - {self.phone_number}"
    
    def update_balance(self, amount, transaction_type):
        """Update account balance based on transaction"""
        if transaction_type == 'CREDIT':
            self.current_balance += amount
        elif transaction_type == 'DEBIT':
            if self.current_balance < amount:
                raise ValidationError(f"Insufficient funds. Available: {self.current_balance}")
            self.current_balance -= amount
        self.save()

class MobileMoneyTransaction(models.Model):
    """Mobile money transaction records"""
    TRANSACTION_TYPES = [
        ('SEND', 'Send Money'),
        ('RECEIVE', 'Receive Money'),
        ('PAYMENT', 'Payment'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('DEPOSIT', 'Deposit'),
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
    reference = models.CharField(max_length=100)
    description = models.TextField()
    transaction_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    balance_after = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    sender_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-transaction_date']
        indexes = [
            models.Index(fields=['transaction_date']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['status']),
            models.Index(fields=['mobile_account']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.reference}"
    
    def save(self, *args, **kwargs):
        # Update mobile money account balance
        if self.status == 'COMPLETED':
            if self.transaction_type in ['RECEIVE', 'DEPOSIT']:
                self.mobile_account.update_balance(self.amount, 'CREDIT')
            elif self.transaction_type in ['SEND', 'PAYMENT', 'WITHDRAWAL']:
                self.mobile_account.update_balance(self.amount, 'DEBIT')
            
            # Set balance after transaction
            self.balance_after = self.mobile_account.current_balance
        
        super().save(*args, **kwargs)

class CashFlow(models.Model):
    """Cash flow tracking"""
    FLOW_TYPES = [
        ('INFLOW', 'Cash Inflow'),
        ('OUTFLOW', 'Cash Outflow'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='cash_flows')
    flow_type = models.CharField(max_length=20, choices=FLOW_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    source = models.CharField(max_length=100)  # e.g., 'Sales', 'Payroll', 'Suppliers'
    description = models.TextField()
    flow_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-flow_date']
        indexes = [
            models.Index(fields=['flow_date']),
            models.Index(fields=['flow_type']),
            models.Index(fields=['store']),
        ]
    
    def __str__(self):
        return f"{self.flow_type} - {self.amount} - {self.source}"

# ==================== CRM MODELS ====================
class Lead(models.Model):
    LEAD_STATUS = [
        ('NEW', 'New'),
        ('CONTACTED', 'Contacted'),
        ('QUALIFIED', 'Qualified'),
        ('PROPOSAL', 'Proposal Sent'),
        ('NEGOTIATION', 'Negotiation'),
        ('WON', 'Won'),
        ('LOST', 'Lost'),
    ]
    
    LEAD_SOURCES = [
        ('WEBSITE', 'Website'),
        ('REFERRAL', 'Referral'),
        ('SOCIAL_MEDIA', 'Social Media'),
        ('EMAIL', 'Email Campaign'),
        ('PHONE', 'Phone Call'),
        ('OTHER', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    source = models.CharField(max_length=20, choices=LEAD_SOURCES, default='OTHER')
    status = models.CharField(max_length=20, choices=LEAD_STATUS, default='NEW')
    estimated_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['source']),
            models.Index(fields=['assigned_to']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.company}"

class Opportunity(models.Model):
    OPPORTUNITY_STAGES = [
        ('PROSPECTING', 'Prospecting'),
        ('QUALIFICATION', 'Qualification'),
        ('PROPOSAL', 'Proposal'),
        ('NEGOTIATION', 'Negotiation'),
        ('CLOSED_WON', 'Closed Won'),
        ('CLOSED_LOST', 'Closed Lost'),
    ]
    
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='opportunities')
    title = models.CharField(max_length=255)
    stage = models.CharField(max_length=20, choices=OPPORTUNITY_STAGES, default='PROSPECTING')
    expected_revenue = models.DecimalField(max_digits=15, decimal_places=2)
    probability = models.IntegerField(default=0)  # Percentage
    expected_close_date = models.DateField()
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['stage']),
            models.Index(fields=['expected_close_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_stage_display()}"

class Contact(models.Model):
    CONTACT_TYPES = [
        ('CUSTOMER', 'Customer'),
        ('SUPPLIER', 'Supplier'),
        ('PARTNER', 'Partner'),
        ('PROSPECT', 'Prospect'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contacts', null=True, blank=True)
    supplier = models.ForeignKey('Supplier', on_delete=models.CASCADE, related_name='contacts', null=True, blank=True)
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPES, default='CUSTOMER')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    position = models.CharField(max_length=100, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['contact_type']),
            models.Index(fields=['is_primary']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

# ==================== MANUFACTURING MODELS ====================
class BillOfMaterials(models.Model):
    """Bill of Materials for manufacturing"""
    name = models.CharField(max_length=255)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='boms')
    version = models.CharField(max_length=20, default='1.0')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"BOM: {self.name} v{self.version}"

class BOMItem(models.Model):
    """Individual items in a Bill of Materials"""
    bom = models.ForeignKey(BillOfMaterials, on_delete=models.CASCADE, related_name='items')
    component = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='bom_components')
    quantity = models.DecimalField(max_digits=10, decimal_places=3)
    unit_of_measure = models.CharField(max_length=20, default='PCS')
    
    def __str__(self):
        return f"{self.component.name} - {self.quantity} {self.unit_of_measure}"

class WorkOrder(models.Model):
    """Manufacturing work orders"""
    WORK_ORDER_STATUS = [
        ('DRAFT', 'Draft'),
        ('PLANNED', 'Planned'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    work_order_number = models.CharField(max_length=50, unique=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    bom = models.ForeignKey(BillOfMaterials, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.IntegerField()
    planned_start_date = models.DateField()
    planned_end_date = models.DateField()
    actual_start_date = models.DateField(null=True, blank=True)
    actual_end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=WORK_ORDER_STATUS, default='DRAFT')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['planned_start_date']),
        ]
    
    def __str__(self):
        return f"WO: {self.work_order_number} - {self.product.name}"

class ProductionLine(models.Model):
    """Production lines/work centers"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    capacity_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

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
            models.Index(fields=['status']),
            models.Index(fields=['project_type']),
            models.Index(fields=['start_date']),
        ]
    
    def __str__(self):
        return self.name

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
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['assigned_to']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.project.name}"

class ProjectExpense(models.Model):
    """Project expenses tracking"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    expense_date = models.DateField()
    category = models.CharField(max_length=100, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.description} - ${self.amount}"

# ==================== ASSET MANAGEMENT MODELS ====================
class Asset(models.Model):
    ASSET_STATUS = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('RETIRED', 'Retired'),
        ('SOLD', 'Sold'),
    ]
    
    ASSET_TYPES = [
        ('EQUIPMENT', 'Equipment'),
        ('VEHICLE', 'Vehicle'),
        ('BUILDING', 'Building'),
        ('SOFTWARE', 'Software'),
        ('FURNITURE', 'Furniture'),
        ('OTHER', 'Other'),
    ]
    
    asset_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPES, default='EQUIPMENT')
    description = models.TextField(blank=True)
    purchase_date = models.DateField()
    purchase_cost = models.DecimalField(max_digits=15, decimal_places=2)
    current_value = models.DecimalField(max_digits=15, decimal_places=2)
    location = models.CharField(max_length=255, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=ASSET_STATUS, default='ACTIVE')
    warranty_expiry = models.DateField(null=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['asset_type']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_to']),
        ]
    
    def __str__(self):
        return f"{self.asset_code} - {self.name}"

class AssetMaintenance(models.Model):
    """Asset maintenance records"""
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance_records')
    maintenance_type = models.CharField(max_length=100)  # Preventive, Corrective, etc.
    description = models.TextField()
    scheduled_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ], default='SCHEDULED')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.asset.name} - {self.maintenance_type}"

# ==================== QUALITY MANAGEMENT MODELS ====================
class QualityControl(models.Model):
    """Quality control inspections"""
    QC_STATUS = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('PASSED', 'Passed'),
        ('FAILED', 'Failed'),
        ('REWORK', 'Rework Required'),
    ]
    
    reference_number = models.CharField(max_length=50, unique=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=50, blank=True)
    inspection_date = models.DateField()
    inspector = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=QC_STATUS, default='PENDING')
    quantity_inspected = models.IntegerField()
    quantity_passed = models.IntegerField(default=0)
    quantity_failed = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['inspection_date']),
        ]
    
    def __str__(self):
        return f"QC: {self.reference_number} - {self.product.name}"

class QualityParameter(models.Model):
    """Quality parameters for products"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='quality_parameters')
    parameter_name = models.CharField(max_length=100)
    specification = models.CharField(max_length=255)
    tolerance = models.CharField(max_length=100, blank=True)
    unit = models.CharField(max_length=20, blank=True)
    is_required = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.product.name} - {self.parameter_name}"

class QualityInspectionResult(models.Model):
    """Individual quality inspection results"""
    quality_control = models.ForeignKey(QualityControl, on_delete=models.CASCADE, related_name='results')
    parameter = models.ForeignKey(QualityParameter, on_delete=models.CASCADE)
    measured_value = models.CharField(max_length=100)
    is_within_spec = models.BooleanField()
    remarks = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.parameter.parameter_name} - {self.measured_value}"

# ==================== MAINTENANCE MANAGEMENT MODELS ====================
class MaintenanceSchedule(models.Model):
    """Preventive maintenance schedules"""
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance_schedules')
    maintenance_type = models.CharField(max_length=100)
    frequency = models.CharField(max_length=50)  # Daily, Weekly, Monthly, etc.
    last_maintenance = models.DateField(null=True, blank=True)
    next_maintenance = models.DateField()
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.asset.name} - {self.maintenance_type}"

class MaintenanceRequest(models.Model):
    """Maintenance requests from users"""
    REQUEST_STATUS = [
        ('OPEN', 'Open'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    REQUEST_PRIORITY = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='maintenance_requests')
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=REQUEST_PRIORITY, default='MEDIUM')
    status = models.CharField(max_length=20, choices=REQUEST_STATUS, default='OPEN')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_maintenance')
    requested_date = models.DateTimeField(auto_now_add=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    estimated_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['requested_date']),
        ]
    
    def __str__(self):
        return f"MR: {self.title} - {self.asset.name}"

# ==================== WEBSITE/E-COMMERCE MODELS ====================
class WebsitePage(models.Model):
    """Website pages for e-commerce"""
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    meta_description = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class ProductCategory(models.Model):
    """Product categories for e-commerce"""
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Product Categories"
    
    def __str__(self):
        return self.name

class ProductReview(models.Model):
    """Product reviews and ratings"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    review_text = models.TextField()
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.product.name} - {self.rating} stars"

# ==================== HEALTHCARE MODELS ====================
class Patient(models.Model):
    """Patient records for healthcare management"""
    patient_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    ])
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField()
    emergency_contact = models.CharField(max_length=255, blank=True)
    medical_history = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.patient_id} - {self.first_name} {self.last_name}"

class Appointment(models.Model):
    """Medical appointments"""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments')
    appointment_date = models.DateTimeField()
    appointment_type = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=[
        ('SCHEDULED', 'Scheduled'),
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
    ], default='SCHEDULED')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.patient.first_name} {self.patient.last_name} - {self.appointment_date}"

# ==================== EDUCATION MODELS ====================
class Student(models.Model):
    """Student records for education management"""
    student_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    ])
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    enrollment_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

class Course(models.Model):
    """Educational courses"""
    course_code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    duration_weeks = models.IntegerField()
    credits = models.IntegerField()
    instructor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.course_code} - {self.title}"

class Enrollment(models.Model):
    """Student course enrollments"""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrollment_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('ENROLLED', 'Enrolled'),
        ('COMPLETED', 'Completed'),
        ('WITHDRAWN', 'Withdrawn'),
    ], default='ENROLLED')
    grade = models.CharField(max_length=5, blank=True)
    
    def __str__(self):
        return f"{self.student.first_name} {self.student.last_name} - {self.course.title}"

# ==================== AGRICULTURE MODELS ====================
class Farm(models.Model):
    """Farm management"""
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    total_area = models.DecimalField(max_digits=10, decimal_places=2)  # in hectares
    farm_type = models.CharField(max_length=100)  # Crop, Livestock, Mixed
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Crop(models.Model):
    """Crop management"""
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='crops')
    crop_name = models.CharField(max_length=255)
    variety = models.CharField(max_length=255, blank=True)
    planting_date = models.DateField()
    expected_harvest_date = models.DateField()
    area_planted = models.DecimalField(max_digits=10, decimal_places=2)  # in hectares
    status = models.CharField(max_length=20, choices=[
        ('PLANTED', 'Planted'),
        ('GROWING', 'Growing'),
        ('HARVESTED', 'Harvested'),
        ('FAILED', 'Failed'),
    ], default='PLANTED')
    yield_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.crop_name} - {self.farm.name}"

class Livestock(models.Model):
    """Livestock management"""
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='livestock')
    animal_type = models.CharField(max_length=100)
    breed = models.CharField(max_length=100, blank=True)
    quantity = models.IntegerField()
    purchase_date = models.DateField()
    purchase_cost = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('ACTIVE', 'Active'),
        ('SOLD', 'Sold'),
        ('DIED', 'Died'),
    ], default='ACTIVE')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.animal_type} - {self.farm.name}"

# --- POS MODULE ---
class SaleSession(models.Model):
    cashier = models.ForeignKey(User, on_delete=models.CASCADE)
    opened_at = models.DateTimeField(default=timezone.now)
    closed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Session {self.id} by {self.cashier} ({'Active' if self.is_active else 'Closed'})"

class POSSale(models.Model):
    session = models.ForeignKey(SaleSession, on_delete=models.CASCADE, related_name='sales')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    fiscalized = models.BooleanField(default=False)
    fiscal_receipt_number = models.CharField(max_length=64, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"POS Sale {self.id} - {self.total_amount}"

class POSItem(models.Model):
    sale = models.ForeignKey(POSSale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

class FiscalizationLog(models.Model):
    sale = models.OneToOneField(POSSale, on_delete=models.CASCADE, related_name='fiscal_log')
    request_payload = models.TextField()
    response_payload = models.TextField()
    fiscal_receipt_number = models.CharField(max_length=64)
    fiscalized_at = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Fiscalization for Sale {self.sale.id} - {'Success' if self.success else 'Failed'}"

class Module(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name