"""
Extended ERP Models - Part 2
HR, Documents, Zimbabwe Fiscalization
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.utils import timezone
from decimal import Decimal
from .models import Business, Store, User, Employee, Department
from .models_extended import Vendor, PurchaseOrder, SalesOrder

# ==================== ADVANCED HR MANAGEMENT ====================

class LeaveType(models.Model):
    """Leave Types Configuration"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='leave_types')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    
    # Allocation
    annual_allocation_days = models.IntegerField(default=0)
    max_consecutive_days = models.IntegerField(null=True, blank=True)
    min_notice_days = models.IntegerField(default=0)
    
    # Rules
    is_paid = models.BooleanField(default=True)
    is_carry_forward = models.BooleanField(default=False)
    max_carry_forward_days = models.IntegerField(null=True, blank=True)
    
    requires_approval = models.BooleanField(default=True)
    requires_document = models.BooleanField(default=False)  # e.g., medical certificate
    
    # Zimbabwe specific
    is_statutory = models.BooleanField(default=False)  # Statutory leave as per ZW law
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]
        unique_together = ['business', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class LeaveAllocation(models.Model):
    """Employee Leave Allocations"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_allocations')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='allocations')
    
    year = models.IntegerField()
    allocated_days = models.DecimalField(max_digits=5, decimal_places=1)
    used_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    balance_days = models.DecimalField(max_digits=5, decimal_places=1)
    
    carried_forward_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_leave_allocations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['employee', 'year']),
        ]
        unique_together = ['employee', 'leave_type', 'year']
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type.name} - {self.year}"


class LeaveApplication(models.Model):
    """Employee Leave Applications"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    application_number = models.CharField(max_length=20, unique=True, db_index=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_applications')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT, related_name='applications')
    
    from_date = models.DateField()
    to_date = models.DateField()
    number_of_days = models.DecimalField(max_digits=5, decimal_places=1)
    
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Approval workflow
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Supporting documents
    attachment = models.FileField(upload_to='leave_attachments/', null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_leave_applications')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['application_number']),
        ]
    
    def __str__(self):
        return f"{self.application_number} - {self.employee.full_name}"


class AttendanceRecord(models.Model):
    """Daily Attendance Records"""
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('HALF_DAY', 'Half Day'),
        ('ON_LEAVE', 'On Leave'),
        ('HOLIDAY', 'Public Holiday'),
        ('WEEKEND', 'Weekend'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(db_index=True)
    
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Overtime
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Late/Early
    is_late = models.BooleanField(default=False)
    late_minutes = models.IntegerField(default=0)
    is_early_departure = models.BooleanField(default=False)
    early_departure_minutes = models.IntegerField(default=0)
    
    remarks = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_attendance_records')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date', 'status']),
        ]
        unique_together = ['employee', 'date']
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.date} - {self.status}"


class PerformanceReviewCycle(models.Model):
    """Performance Review Cycles"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='review_cycles')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_review_cycles')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"


class PerformanceReview(models.Model):
    """Employee Performance Reviews"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SELF_REVIEW', 'Self Review Pending'),
        ('MANAGER_REVIEW', 'Manager Review Pending'),
        ('HR_REVIEW', 'HR Review Pending'),
        ('COMPLETED', 'Completed'),
    ]
    
    RATING_CHOICES = [
        (1, 'Unsatisfactory'),
        (2, 'Needs Improvement'),
        (3, 'Meets Expectations'),
        (4, 'Exceeds Expectations'),
        (5, 'Outstanding'),
    ]
    
    review_number = models.CharField(max_length=20, unique=True, db_index=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    cycle = models.ForeignKey(PerformanceReviewCycle, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='conducted_reviews')
    
    # Ratings
    overall_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    quality_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    productivity_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    teamwork_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    communication_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    
    # Comments
    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    goals_achieved = models.TextField(blank=True)
    goals_for_next_period = models.TextField(blank=True)
    
    # Self Review
    employee_comments = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    completed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'cycle']),
            models.Index(fields=['review_number']),
        ]
    
    def __str__(self):
        return f"{self.review_number} - {self.employee.full_name}"


class JobPosting(models.Model):
    """Job Postings for Recruitment"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('ON_HOLD', 'On Hold'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='job_postings')
    job_number = models.CharField(max_length=20, unique=True, db_index=True)
    title = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    
    description = models.TextField()
    responsibilities = models.TextField()
    requirements = models.TextField()
    
    # Employment Details
    employment_type = models.CharField(max_length=20, choices=[
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
        ('TEMPORARY', 'Temporary'),
    ])
    
    positions_available = models.IntegerField(default=1)
    salary_range_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_range_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Dates
    posted_date = models.DateField()
    closing_date = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_job_postings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-posted_date']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['job_number']),
        ]
    
    def __str__(self):
        return f"{self.job_number} - {self.title}"


class JobApplication(models.Model):
    """Job Applications"""
    STATUS_CHOICES = [
        ('RECEIVED', 'Received'),
        ('SCREENING', 'Screening'),
        ('SHORTLISTED', 'Shortlisted'),
        ('INTERVIEW', 'Interview Scheduled'),
        ('OFFER', 'Offer Made'),
        ('ACCEPTED', 'Offer Accepted'),
        ('REJECTED', 'Rejected'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    
    application_number = models.CharField(max_length=20, unique=True, db_index=True)
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications')
    
    # Applicant Details
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    # Documents
    resume = models.FileField(upload_to='job_applications/resumes/')
    cover_letter = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='RECEIVED')
    
    # Screening
    screening_score = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    screening_notes = models.TextField(blank=True)
    
    application_date = models.DateField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-application_date']
        indexes = [
            models.Index(fields=['job_posting', 'status']),
            models.Index(fields=['application_number']),
        ]
    
    def __str__(self):
        return f"{self.application_number} - {self.first_name} {self.last_name}"


class TrainingProgram(models.Model):
    """Employee Training Programs"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='training_programs')
    program_code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    
    trainer = models.CharField(max_length=200)
    training_provider = models.CharField(max_length=200, blank=True)
    
    start_date = models.DateField()
    end_date = models.DateField()
    duration_days = models.IntegerField()
    
    cost_per_participant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_participants = models.IntegerField()
    
    location = models.CharField(max_length=200)
    
    is_mandatory = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_training_programs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['business']),
            models.Index(fields=['program_code']),
        ]
    
    def __str__(self):
        return f"{self.program_code} - {self.name}"


class TrainingAttendance(models.Model):
    """Employee Training Attendance"""
    STATUS_CHOICES = [
        ('REGISTERED', 'Registered'),
        ('ATTENDED', 'Attended'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    program = models.ForeignKey(TrainingProgram, on_delete=models.CASCADE, related_name='attendances')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='training_attendances')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REGISTERED')
    
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    assessment_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    certificate_issued = models.BooleanField(default=False)
    certificate_number = models.CharField(max_length=50, blank=True)
    
    feedback = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['program', 'employee']),
        ]
        unique_together = ['program', 'employee']
    
    def __str__(self):
        return f"{self.employee.full_name} - {self.program.name}"


# ==================== DOCUMENT MANAGEMENT ====================

class DocumentCategory(models.Model):
    """Document Categories"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='document_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]
        verbose_name_plural = 'Document Categories'
    
    def __str__(self):
        return self.name


class Document(models.Model):
    """Document Management System"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('ARCHIVED', 'Archived'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='documents')
    document_number = models.CharField(max_length=20, unique=True, db_index=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(DocumentCategory, on_delete=models.SET_NULL, null=True)
    
    file = models.FileField(upload_to='documents/%Y/%m/')
    file_size = models.IntegerField()  # in bytes
    file_type = models.CharField(max_length=50)
    
    # Version Control
    version = models.CharField(max_length=20, default='1.0')
    is_latest_version = models.BooleanField(default=True)
    previous_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='next_versions')
    
    # Access Control
    is_public = models.BooleanField(default=False)
    allowed_departments = models.ManyToManyField(Department, blank=True)
    allowed_users = models.ManyToManyField(User, blank=True, related_name='accessible_documents')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Metadata
    tags = models.CharField(max_length=500, blank=True)  # Comma-separated tags
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_documents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['document_number']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.document_number} - {self.title}"


class DocumentTemplate(models.Model):
    """Document Templates (Invoices, Contracts, etc.)"""
    TEMPLATE_TYPE_CHOICES = [
        ('INVOICE', 'Invoice'),
        ('QUOTATION', 'Quotation'),
        ('PURCHASE_ORDER', 'Purchase Order'),
        ('CONTRACT', 'Contract'),
        ('LETTER', 'Letter'),
        ('REPORT', 'Report'),
        ('OTHER', 'Other'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='document_templates')
    name = models.CharField(max_length=200)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Template content (HTML with placeholders)
    template_content = models.TextField()
    
    # CSS Styling
    css_styling = models.TextField(blank=True)
    
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'template_type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.template_type})"


# ==================== ZIMBABWE FISCALIZATION ====================

class ZIMRAVirtualFiscalDevice(models.Model):
    """ZIMRA Virtual Fiscal Device Configuration"""
    STATUS_CHOICES = [
        ('PENDING_REGISTRATION', 'Pending Registration'),
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('DEACTIVATED', 'Deactivated'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='fiscal_devices')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='fiscal_devices')
    
    # ZIMRA Registration Details
    device_id = models.CharField(max_length=50, unique=True, db_index=True)
    device_model_name = models.CharField(max_length=100)
    device_model_version = models.CharField(max_length=50)
    
    # Certificate Details
    certificate_serial = models.CharField(max_length=100)
    certificate_path = models.CharField(max_length=500)
    private_key_path = models.CharField(max_length=500)
    
    # API Credentials
    api_url = models.URLField()
    api_username = models.CharField(max_length=100)
    api_password = models.CharField(max_length=255)  # Should be encrypted
    
    # Registration
    registration_date = models.DateField()
    expiry_date = models.DateField()
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING_REGISTRATION')
    
    # Counters
    daily_receipt_count = models.IntegerField(default=0)
    total_receipt_count = models.IntegerField(default=0)
    last_receipt_number = models.CharField(max_length=50, blank=True)
    
    # Sync
    last_sync_datetime = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_fiscal_devices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['device_id']),
        ]
    
    def __str__(self):
        return f"{self.device_id} - {self.store.name}"


class FiscalReceipt(models.Model):
    """ZIMRA Fiscal Receipts"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending Fiscalization'),
        ('SUBMITTED', 'Submitted to ZIMRA'),
        ('VERIFIED', 'Verified by ZIMRA'),
        ('FAILED', 'Fiscalization Failed'),
    ]
    
    fiscal_device = models.ForeignKey(ZIMRAVirtualFiscalDevice, on_delete=models.PROTECT, related_name='receipts')
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.PROTECT, null=True, blank=True, related_name='fiscal_receipts')
    
    # Receipt Details
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    fiscal_receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    qr_code_data = models.TextField()
    verification_url = models.URLField()
    
    # Financial
    receipt_date = models.DateTimeField()
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    vat_amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Customer
    customer_name = models.CharField(max_length=200, blank=True)
    customer_tin = models.CharField(max_length=50, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    
    # ZIMRA Response
    zimra_request_payload = models.TextField()
    zimra_response_payload = models.TextField(blank=True)
    zimra_verification_code = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Retry mechanism
    submission_attempts = models.IntegerField(default=0)
    last_attempt_datetime = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-receipt_date']
        indexes = [
            models.Index(fields=['fiscal_device', 'status']),
            models.Index(fields=['receipt_number']),
            models.Index(fields=['fiscal_receipt_number']),
            models.Index(fields=['receipt_date']),
        ]
    
    def __str__(self):
        return f"{self.fiscal_receipt_number} - {self.receipt_date}"


class FiscalDayEnd(models.Model):
    """Daily Fiscal Closing"""
    fiscal_device = models.ForeignKey(ZIMRAVirtualFiscalDevice, on_delete=models.CASCADE, related_name='day_ends')
    
    business_date = models.DateField(db_index=True)
    closing_datetime = models.DateTimeField()
    
    # Daily Totals
    total_receipts = models.IntegerField()
    total_sales = models.DecimalField(max_digits=15, decimal_places=2)
    total_vat = models.DecimalField(max_digits=15, decimal_places=2)
    
    # ZIMRA Submission
    zimra_request_payload = models.TextField()
    zimra_response_payload = models.TextField(blank=True)
    zimra_day_end_number = models.CharField(max_length=50, blank=True)
    
    is_submitted = models.BooleanField(default=False)
    submission_datetime = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='fiscal_day_ends')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-business_date']
        indexes = [
            models.Index(fields=['fiscal_device', 'business_date']),
        ]
        unique_together = ['fiscal_device', 'business_date']
    
    def __str__(self):
        return f"{self.fiscal_device.device_id} - {self.business_date}"


# ==================== BUDGETING & COST CENTERS ====================

class CostCenter(models.Model):
    """Cost Centers for departmental accounting"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='cost_centers')
    code = models.CharField(max_length=20, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='cost_centers')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_cost_centers')
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'code']),
        ]
        unique_together = ['business', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class BudgetPeriod(models.Model):
    """Budget Periods (Annual, Quarterly, etc.)"""
    PERIOD_TYPE_CHOICES = [
        ('ANNUAL', 'Annual'),
        ('QUARTERLY', 'Quarterly'),
        ('MONTHLY', 'Monthly'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='budget_periods')
    name = models.CharField(max_length=100)
    period_type = models.CharField(max_length=20, choices=PERIOD_TYPE_CHOICES)
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_budget_periods')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"


class Budget(models.Model):
    """Budget Master"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('ACTIVE', 'Active'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='budgets')
    budget_number = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    
    period = models.ForeignKey(BudgetPeriod, on_delete=models.CASCADE, related_name='budgets')
    cost_center = models.ForeignKey(CostCenter, on_delete=models.CASCADE, related_name='budgets')
    
    total_budget_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_actual_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    variance_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    variance_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_budgets')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_budgets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['budget_number']),
        ]
    
    def __str__(self):
        return f"{self.budget_number} - {self.name}"


class BudgetLine(models.Model):
    """Budget Line Items"""
    from .models import ChartOfAccounts
    
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT, related_name='budget_lines')
    
    budgeted_amount = models.DecimalField(max_digits=15, decimal_places=2)
    actual_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    variance_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    variance_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['budget', 'account']),
        ]
        unique_together = ['budget', 'account']
    
    def __str__(self):
        return f"{self.budget.budget_number} - {self.account.name}"

