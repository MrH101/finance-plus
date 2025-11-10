"""
Extended ERP Models for Zimbabwe Market
Adds comprehensive modules to compete with ERPNext, SAP, QuickBooks
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from .models import (
    Business, Store, User, Product, Employee, Customer, 
    ChartOfAccounts, Currency, Department
)

# ==================== SUPPLY CHAIN MANAGEMENT ====================

class Vendor(models.Model):
    """Vendor/Supplier Management"""
    VENDOR_TYPE_CHOICES = [
        ('SUPPLIER', 'Supplier'),
        ('CONTRACTOR', 'Contractor'),
        ('SERVICE_PROVIDER', 'Service Provider'),
        ('MANUFACTURER', 'Manufacturer'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='vendors', null=True, blank=True)
    vendor_code = models.CharField(max_length=20, unique=True, db_index=True, blank=True)
    name = models.CharField(max_length=200)
    vendor_type = models.CharField(max_length=20, choices=VENDOR_TYPE_CHOICES, default='SUPPLIER')
    
    # Contact Information
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    mobile = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=200, blank=True, default='')
    address_line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True, default='')
    province = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, default='Zimbabwe')
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Tax and Registration
    tax_id = models.CharField(max_length=50, blank=True)
    vat_number = models.CharField(max_length=50, blank=True)
    registration_number = models.CharField(max_length=50, blank=True)
    
    # Financial Details
    credit_limit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    payment_terms_days = models.IntegerField(default=30)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT, null=True)
    
    # Banking Details
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)
    swift_code = models.CharField(max_length=20, blank=True)
    
    # Status and Rating
    is_active = models.BooleanField(default=True)
    rating = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    
    # Metadata
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_vendors', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'vendor_code']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
        # Note: unique_together removed since business can be null
        # vendor_code is already unique=True at field level
    
    def __str__(self):
        return f"{self.vendor_code} - {self.name}"


class PurchaseRequisition(models.Model):
    """Internal purchase request before PO"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CONVERTED', 'Converted to PO'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='purchase_requisitions')
    requisition_number = models.CharField(max_length=20, unique=True, db_index=True)
    requested_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='requisitions')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    date_required = models.DateField()
    
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Approval workflow
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_requisitions')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['requisition_number']),
        ]
    
    def __str__(self):
        return f"{self.requisition_number} - {self.requested_by}"


class PurchaseRequisitionItem(models.Model):
    """Items in a purchase requisition"""
    requisition = models.ForeignKey(PurchaseRequisition, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True)
    description = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_of_measure = models.CharField(max_length=50, default='Units')
    estimated_unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_total = models.DecimalField(max_digits=15, decimal_places=2)
    notes = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        self.estimated_total = self.quantity * self.estimated_unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.requisition.requisition_number} - {self.description}"


class RequestForQuotation(models.Model):
    """RFQ to multiple vendors"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent to Vendors'),
        ('RECEIVED', 'Quotes Received'),
        ('EVALUATED', 'Evaluated'),
        ('AWARDED', 'Awarded'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='rfqs')
    rfq_number = models.CharField(max_length=20, unique=True, db_index=True)
    requisition = models.ForeignKey(PurchaseRequisition, on_delete=models.SET_NULL, null=True, blank=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    vendors = models.ManyToManyField(Vendor, related_name='rfqs')
    
    issue_date = models.DateField()
    closing_date = models.DateField()
    delivery_required_by = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Terms and Conditions
    payment_terms = models.TextField()
    delivery_terms = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_rfqs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['rfq_number']),
        ]
    
    def __str__(self):
        return f"{self.rfq_number} - {self.title}"


class RFQItem(models.Model):
    """Items in RFQ"""
    rfq = models.ForeignKey(RequestForQuotation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True)
    description = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_of_measure = models.CharField(max_length=50, default='Units')
    specifications = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.rfq.rfq_number} - {self.description}"


class VendorQuotation(models.Model):
    """Vendor response to RFQ"""
    STATUS_CHOICES = [
        ('RECEIVED', 'Received'),
        ('UNDER_REVIEW', 'Under Review'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    ]
    
    rfq = models.ForeignKey(RequestForQuotation, on_delete=models.CASCADE, related_name='quotations')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='quotations')
    quotation_number = models.CharField(max_length=50)
    quotation_date = models.DateField()
    
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=15, decimal_places=2)
    
    validity_days = models.IntegerField(default=30)
    delivery_days = models.IntegerField()
    payment_terms = models.CharField(max_length=200)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='RECEIVED')
    notes = models.TextField(blank=True)
    
    # Evaluation
    technical_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    financial_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    overall_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    evaluation_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rfq', 'vendor']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.quotation_number} - {self.vendor.name}"


class VendorQuotationItem(models.Model):
    """Line items in vendor quotation"""
    quotation = models.ForeignKey(VendorQuotation, on_delete=models.CASCADE, related_name='items')
    rfq_item = models.ForeignKey(RFQItem, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    notes = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quotation.quotation_number} - {self.rfq_item.description}"


class PurchaseOrder(models.Model):
    """Purchase Order"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent to Vendor'),
        ('CONFIRMED', 'Confirmed by Vendor'),
        ('PARTIALLY_RECEIVED', 'Partially Received'),
        ('RECEIVED', 'Fully Received'),
        ('BILLED', 'Billed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='purchase_orders')
    po_number = models.CharField(max_length=20, unique=True, db_index=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name='purchase_orders')
    requisition = models.ForeignKey(PurchaseRequisition, on_delete=models.SET_NULL, null=True, blank=True)
    quotation = models.ForeignKey(VendorQuotation, on_delete=models.SET_NULL, null=True, blank=True)
    
    order_date = models.DateField()
    expected_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    # Financial
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, default=1)
    
    # Delivery Details
    delivery_address = models.TextField()
    delivery_contact_person = models.CharField(max_length=100)
    delivery_contact_phone = models.CharField(max_length=20)
    
    # Terms
    payment_terms = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    
    # Workflow
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_pos')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_pos')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['po_number']),
            models.Index(fields=['vendor']),
        ]
    
    def __str__(self):
        return f"{self.po_number} - {self.vendor.name}"


class PurchaseOrderItem(models.Model):
    """Items in Purchase Order"""
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True, help_text='Optional: Link to existing product, or leave blank for custom items')
    description = models.CharField(max_length=200)
    
    quantity_ordered = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_received = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_billed = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    unit_of_measure = models.CharField(max_length=50, default='Units')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Inventory flag
    is_inventory_item = models.BooleanField(default=True, help_text='If True, item will be added to inventory when received')
    
    # Additional charges
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity_ordered * self.unit_price
        self.tax_amount = self.total_price * (self.tax_rate / 100)
        super().save(*args, **kwargs)
    
    def __str__(self):
        product_name = self.product.name if self.product else self.description
        return f"{self.purchase_order.po_number} - {product_name}"


class GoodsReceivedNote(models.Model):
    """GRN - Goods Receipt"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('QUALITY_CHECK', 'Quality Check'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('RETURNED', 'Returned'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending Payment'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='goods_received_notes')
    grn_number = models.CharField(max_length=20, unique=True, db_index=True)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT, related_name='grns')
    
    receipt_date = models.DateField()
    delivery_note_number = models.CharField(max_length=50, blank=True)
    
    received_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='received_grns')
    inspected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inspected_grns')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Payment fields
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['grn_number']),
            models.Index(fields=['purchase_order']),
        ]
    
    def __str__(self):
        return f"{self.grn_number} - PO: {self.purchase_order.po_number}"


class PurchaseOrderPayment(models.Model):
    """Payment allocation for purchase orders - supports multiple payment methods"""
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('BANK', 'Bank Transfer'),
    ]
    
    grn = models.ForeignKey(GoodsReceivedNote, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Account references (optional - for tracking which account was used)
    cash_till = models.ForeignKey('erp.CashTill', on_delete=models.SET_NULL, null=True, blank=True)
    mobile_money_account = models.ForeignKey('erp.MobileMoneyAccount', on_delete=models.SET_NULL, null=True, blank=True)
    bank_account = models.ForeignKey('erp.BankAccount', on_delete=models.SET_NULL, null=True, blank=True)
    
    payment_date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['grn', 'payment_method']),
        ]
    
    def __str__(self):
        return f"{self.grn.grn_number} - {self.get_payment_method_display()} - ${self.amount}"


class VendorBill(models.Model):
    """Vendor Bill generated from Purchase Orders / GRNs - Industry standard audit trail"""

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('TO_APPROVE', 'To Approve'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled'),
        ('REJECTED', 'Rejected'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('UNPAID', 'Unpaid'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Paid'),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='vendor_bills')
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='vendor_bills')
    grn = models.ForeignKey('GoodsReceivedNote', on_delete=models.SET_NULL, null=True, blank=True, related_name='vendor_bills', help_text='GRN this bill is linked to')
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name='vendor_bills')
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)

    bill_number = models.CharField(max_length=50, unique=True, db_index=True, help_text='Vendor bill/invoice number')
    reference = models.CharField(max_length=100, blank=True, help_text='Internal reference')
    bill_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)

    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='UNPAID')

    # Approval workflow
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_vendor_bills')
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_vendor_bills')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='rejected_vendor_bills')
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True, help_text='Internal notes not visible to vendor')

    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_vendor_bills')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-bill_date', '-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['vendor']),
            models.Index(fields=['purchase_order']),
            models.Index(fields=['grn']),
            models.Index(fields=['bill_number']),
            models.Index(fields=['payment_status']),
        ]

    def save(self, *args, **kwargs):
        # Auto-calculate balance
        self.balance = self.total_amount - self.paid_amount
        
        # Update payment status
        if self.balance <= 0 and self.paid_amount > 0:
            self.payment_status = 'PAID'
        elif self.paid_amount > 0 and self.balance > 0:
            self.payment_status = 'PARTIAL'
        elif self.paid_amount == 0:
            self.payment_status = 'UNPAID'
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Vendor Bill {self.bill_number or self.id}"


class VendorBillItem(models.Model):
    """Line items in Vendor Bill - for detailed audit trail"""
    vendor_bill = models.ForeignKey(VendorBill, on_delete=models.CASCADE, related_name='items')
    po_item = models.ForeignKey(PurchaseOrderItem, on_delete=models.PROTECT, null=True, blank=True, help_text='Link to purchase order item')
    grn_item = models.ForeignKey('GoodsReceivedNoteItem', on_delete=models.SET_NULL, null=True, blank=True, help_text='Link to GRN item')
    
    description = models.CharField(max_length=200)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True)
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    
    unit_of_measure = models.CharField(max_length=50, default='Units')
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['id']
        indexes = [
            models.Index(fields=['vendor_bill']),
            models.Index(fields=['po_item']),
            models.Index(fields=['product']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-calculate totals
        from decimal import Decimal
        self.total_price = Decimal(str(self.quantity)) * Decimal(str(self.unit_price))
        tax_rate_decimal = Decimal(str(self.tax_rate or 0))
        self.tax_amount = self.total_price * (tax_rate_decimal / Decimal('100'))
        super().save(*args, **kwargs)
        
        # Update bill totals (only if vendor_bill exists and is saved)
        if self.vendor_bill and self.vendor_bill.pk:
            self.vendor_bill.subtotal = sum(Decimal(str(item.total_price)) for item in self.vendor_bill.items.all())
            self.vendor_bill.tax_amount = sum(Decimal(str(item.tax_amount)) for item in self.vendor_bill.items.all())
            discount = Decimal(str(self.vendor_bill.discount_amount or 0))
            self.vendor_bill.total_amount = self.vendor_bill.subtotal + self.vendor_bill.tax_amount - discount
            self.vendor_bill.balance = self.vendor_bill.total_amount - Decimal(str(self.vendor_bill.paid_amount or 0))
            self.vendor_bill.save(update_fields=['subtotal', 'tax_amount', 'total_amount', 'balance'])
    
    def __str__(self):
        return f"{self.vendor_bill.bill_number} - {self.description}" 


class GoodsReceivedNoteItem(models.Model):
    """Items in GRN"""
    QUALITY_STATUS_CHOICES = [
        ('PASSED', 'Passed'),
        ('FAILED', 'Failed'),
        ('PENDING', 'Pending Inspection'),
    ]
    
    grn = models.ForeignKey(GoodsReceivedNote, on_delete=models.CASCADE, related_name='items')
    po_item = models.ForeignKey(PurchaseOrderItem, on_delete=models.PROTECT)
    
    quantity_received = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_accepted = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_rejected = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    quality_status = models.CharField(max_length=20, choices=QUALITY_STATUS_CHOICES, default='PENDING')
    quality_notes = models.TextField(blank=True)
    
    batch_number = models.CharField(max_length=50, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.grn.grn_number} - {self.po_item.product.name}"


# ==================== ADVANCED CRM ====================

class Lead(models.Model):
    """Sales Lead Management"""
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('CONTACTED', 'Contacted'),
        ('QUALIFIED', 'Qualified'),
        ('PROPOSAL', 'Proposal Sent'),
        ('NEGOTIATION', 'In Negotiation'),
        ('WON', 'Won'),
        ('LOST', 'Lost'),
    ]
    
    SOURCE_CHOICES = [
        ('WEBSITE', 'Website'),
        ('REFERRAL', 'Referral'),
        ('COLD_CALL', 'Cold Call'),
        ('WALK_IN', 'Walk In'),
        ('SOCIAL_MEDIA', 'Social Media'),
        ('ADVERTISEMENT', 'Advertisement'),
        ('EXHIBITION', 'Exhibition/Event'),
        ('OTHER', 'Other'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='leads')
    lead_number = models.CharField(max_length=20, unique=True, db_index=True)
    
    # Contact Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    company_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    mobile = models.CharField(max_length=20, blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='Zimbabwe')
    
    # Lead Details
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    
    industry = models.CharField(max_length=100, blank=True)
    annual_revenue = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    employee_count = models.IntegerField(null=True, blank=True)
    
    # Sales Information
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_leads')
    expected_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    probability = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    expected_close_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_leads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['lead_number']),
            models.Index(fields=['assigned_to']),
        ]
    
    def __str__(self):
        return f"{self.lead_number} - {self.first_name} {self.last_name}"


class Opportunity(models.Model):
    """Sales Opportunity (Qualified Lead)"""
    STAGE_CHOICES = [
        ('QUALIFICATION', 'Qualification'),
        ('NEEDS_ANALYSIS', 'Needs Analysis'),
        ('PROPOSAL', 'Proposal/Quote'),
        ('NEGOTIATION', 'Negotiation'),
        ('CLOSED_WON', 'Closed Won'),
        ('CLOSED_LOST', 'Closed Lost'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='opportunities')
    opportunity_number = models.CharField(max_length=20, unique=True, db_index=True)
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='opportunities')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='opportunities')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='QUALIFICATION')
    probability = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Financial
    expected_revenue = models.DecimalField(max_digits=15, decimal_places=2)
    weighted_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    actual_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Dates
    expected_close_date = models.DateField()
    actual_close_date = models.DateField(null=True, blank=True)
    
    # Assignment
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_opportunities')
    
    # Competition
    competitors = models.TextField(blank=True)
    
    # Reason for won/lost
    win_loss_reason = models.TextField(blank=True)
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_opportunities')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'stage']),
            models.Index(fields=['opportunity_number']),
            models.Index(fields=['assigned_to']),
        ]
        verbose_name_plural = 'Opportunities'
    
    def save(self, *args, **kwargs):
        self.weighted_revenue = self.expected_revenue * (Decimal(self.probability) / 100)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.opportunity_number} - {self.title}"


class Quotation(models.Model):
    """Sales Quotation"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent to Customer'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('EXPIRED', 'Expired'),
        ('ORDERED', 'Converted to Order'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='quotations')
    quotation_number = models.CharField(max_length=20, unique=True, db_index=True)
    
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='quotations')
    opportunity = models.ForeignKey(Opportunity, on_delete=models.SET_NULL, null=True, blank=True)
    
    quotation_date = models.DateField()
    valid_until = models.DateField()
    
    # Financial
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    
    # Terms
    payment_terms = models.CharField(max_length=200)
    delivery_terms = models.TextField(blank=True)
    terms_and_conditions = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_quotations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['quotation_number']),
            models.Index(fields=['customer']),
        ]
    
    def __str__(self):
        return f"{self.quotation_number} - {self.customer.name}"


class QuotationItem(models.Model):
    """Items in Sales Quotation"""
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True)
    description = models.CharField(max_length=200)
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_of_measure = models.CharField(max_length=50, default='Units')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    notes = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        subtotal = self.quantity * self.unit_price
        self.discount_amount = subtotal * (self.discount_percent / 100)
        taxable_amount = subtotal - self.discount_amount
        self.tax_amount = taxable_amount * (self.tax_rate / 100)
        self.total_amount = taxable_amount + self.tax_amount
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quotation.quotation_number} - {self.description}"


class SalesOrder(models.Model):
    """Sales Order (from accepted quotation or direct)"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('CONFIRMED', 'Confirmed'),
        ('PARTIALLY_DELIVERED', 'Partially Delivered'),
        ('DELIVERED', 'Delivered'),
        ('BILLED', 'Billed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='sales_orders')
    order_number = models.CharField(max_length=20, unique=True, db_index=True)
    
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='sales_orders')
    quotation = models.ForeignKey(Quotation, on_delete=models.SET_NULL, null=True, blank=True)
    
    order_date = models.DateField()
    expected_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    # Financial
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    
    # Delivery
    delivery_address = models.TextField()
    delivery_contact_person = models.CharField(max_length=100)
    delivery_contact_phone = models.CharField(max_length=20)
    
    # Terms
    payment_terms = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_sales_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['order_number']),
            models.Index(fields=['customer']),
        ]
    
    def __str__(self):
        return f"{self.order_number} - {self.customer.name}"


class SalesOrderItem(models.Model):
    """Items in Sales Order"""
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    description = models.CharField(max_length=200)
    
    quantity_ordered = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_delivered = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_billed = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    unit_of_measure = models.CharField(max_length=50, default='Units')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    notes = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        subtotal = self.quantity_ordered * self.unit_price
        self.discount_amount = subtotal * (self.discount_percent / 100)
        taxable_amount = subtotal - self.discount_amount
        self.tax_amount = taxable_amount * (self.tax_rate / 100)
        self.total_amount = taxable_amount + self.tax_amount
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.sales_order.order_number} - {self.product.name}"


class DeliveryNote(models.Model):
    """Delivery Note for Sales Order"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('DISPATCHED', 'Dispatched'),
        ('IN_TRANSIT', 'In Transit'),
        ('DELIVERED', 'Delivered'),
        ('RETURNED', 'Returned'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='delivery_notes')
    delivery_note_number = models.CharField(max_length=20, unique=True, db_index=True)
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.PROTECT, related_name='delivery_notes')
    
    delivery_date = models.DateField()
    dispatch_time = models.DateTimeField(null=True, blank=True)
    delivered_time = models.DateTimeField(null=True, blank=True)
    
    # Delivery Personnel
    driver_name = models.CharField(max_length=100, blank=True)
    driver_phone = models.CharField(max_length=20, blank=True)
    vehicle_number = models.CharField(max_length=20, blank=True)
    
    # Recipient
    received_by_name = models.CharField(max_length=100, blank=True)
    received_by_signature = models.TextField(blank=True)  # Base64 encoded signature
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_delivery_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['delivery_note_number']),
            models.Index(fields=['sales_order']),
        ]
    
    def __str__(self):
        return f"{self.delivery_note_number} - SO: {self.sales_order.order_number}"


class DeliveryNoteItem(models.Model):
    """Items in Delivery Note"""
    delivery_note = models.ForeignKey(DeliveryNote, on_delete=models.CASCADE, related_name='items')
    sales_order_item = models.ForeignKey(SalesOrderItem, on_delete=models.PROTECT)
    
    quantity_delivered = models.DecimalField(max_digits=10, decimal_places=2)
    batch_number = models.CharField(max_length=50, blank=True)
    serial_numbers = models.TextField(blank=True)  # For serialized items
    
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.delivery_note.delivery_note_number} - {self.sales_order_item.product.name}"


class CRMActivity(models.Model):
    """Track all CRM activities (calls, meetings, emails)"""
    ACTIVITY_TYPE_CHOICES = [
        ('CALL', 'Phone Call'),
        ('MEETING', 'Meeting'),
        ('EMAIL', 'Email'),
        ('TASK', 'Task'),
        ('NOTE', 'Note'),
    ]
    
    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='crm_activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES)
    
    # Related Records
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, null=True, blank=True, related_name='activities')
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, null=True, blank=True, related_name='activities')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='activities')
    
    subject = models.CharField(max_length=200)
    description = models.TextField()
    
    scheduled_datetime = models.DateTimeField()
    completed_datetime = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=30)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_activities')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_activities')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_datetime']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['scheduled_datetime']),
        ]
        verbose_name_plural = 'CRM Activities'
    
    def __str__(self):
        return f"{self.activity_type} - {self.subject}"


# ==================== FIXED ASSETS ====================

class AssetCategory(models.Model):
    """Asset Categories"""
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='asset_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Depreciation Settings
    depreciation_method = models.CharField(max_length=20, choices=[
        ('STRAIGHT_LINE', 'Straight Line'),
        ('DECLINING_BALANCE', 'Declining Balance'),
        ('DOUBLE_DECLINING', 'Double Declining Balance'),
        ('UNITS_OF_PRODUCTION', 'Units of Production'),
    ], default='STRAIGHT_LINE')
    
    useful_life_years = models.IntegerField(default=5)
    salvage_value_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Accounting Accounts
    asset_account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT, related_name='asset_categories_asset')
    accumulated_depreciation_account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT, related_name='asset_categories_depreciation')
    depreciation_expense_account = models.ForeignKey(ChartOfAccounts, on_delete=models.PROTECT, related_name='asset_categories_expense')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business']),
        ]
        verbose_name_plural = 'Asset Categories'
    
    def __str__(self):
        return self.name


class FixedAsset(models.Model):
    """Fixed Asset Register"""
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('UNDER_MAINTENANCE', 'Under Maintenance'),
        ('DISPOSED', 'Disposed'),
        ('SCRAPPED', 'Scrapped'),
        ('SOLD', 'Sold'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='fixed_assets')
    asset_number = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    category = models.ForeignKey(AssetCategory, on_delete=models.PROTECT, related_name='assets')
    
    # Purchase Details
    purchase_date = models.DateField()
    purchase_price = models.DecimalField(max_digits=15, decimal_places=2)
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True)
    
    # Depreciation
    depreciation_start_date = models.DateField()
    useful_life_years = models.IntegerField()
    salvage_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    accumulated_depreciation = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_book_value = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Location and Assignment
    location = models.CharField(max_length=200)
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_assets')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Identification
    serial_number = models.CharField(max_length=100, blank=True)
    model_number = models.CharField(max_length=100, blank=True)
    manufacturer = models.CharField(max_length=100, blank=True)
    
    # Warranty and Insurance
    warranty_expiry_date = models.DateField(null=True, blank=True)
    insurance_policy_number = models.CharField(max_length=50, blank=True)
    insurance_expiry_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Disposal
    disposal_date = models.DateField(null=True, blank=True)
    disposal_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    disposal_notes = models.TextField(blank=True)
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_assets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['asset_number']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.asset_number} - {self.name}"


class AssetDepreciation(models.Model):
    """Depreciation Schedule and Records"""
    asset = models.ForeignKey(FixedAsset, on_delete=models.CASCADE, related_name='depreciation_records')
    period_start_date = models.DateField()
    period_end_date = models.DateField()
    
    opening_book_value = models.DecimalField(max_digits=15, decimal_places=2)
    depreciation_amount = models.DecimalField(max_digits=15, decimal_places=2)
    accumulated_depreciation = models.DecimalField(max_digits=15, decimal_places=2)
    closing_book_value = models.DecimalField(max_digits=15, decimal_places=2)
    
    journal_entry = models.ForeignKey('JournalEntry', on_delete=models.SET_NULL, null=True, blank=True)
    
    is_posted = models.BooleanField(default=False)
    posted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    posted_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-period_start_date']
        indexes = [
            models.Index(fields=['asset', 'period_start_date']),
        ]
    
    def __str__(self):
        return f"{self.asset.asset_number} - {self.period_start_date} to {self.period_end_date}"


class AssetMaintenance(models.Model):
    """Asset Maintenance Records"""
    MAINTENANCE_TYPE_CHOICES = [
        ('PREVENTIVE', 'Preventive'),
        ('CORRECTIVE', 'Corrective'),
        ('EMERGENCY', 'Emergency'),
        ('UPGRADE', 'Upgrade'),
    ]
    
    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    asset = models.ForeignKey(FixedAsset, on_delete=models.CASCADE, related_name='maintenance_records')
    maintenance_number = models.CharField(max_length=20, unique=True)
    maintenance_type = models.CharField(max_length=20, choices=MAINTENANCE_TYPE_CHOICES)
    
    scheduled_date = models.DateField()
    actual_date = models.DateField(null=True, blank=True)
    
    description = models.TextField()
    performed_by = models.CharField(max_length=200)  # Can be internal or external
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_maintenances')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['asset', 'status']),
            models.Index(fields=['maintenance_number']),
        ]
    
    def __str__(self):
        return f"{self.maintenance_number} - {self.asset.name}"


# Continue in next part...

