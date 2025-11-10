"""
Extended ERP Models - Part 3
E-commerce, Workflow Automation, Zimbabwe Payment Integrations
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from .models import Business, Store, User, Product, Customer, Currency
from .models_extended import SalesOrder

# ==================== E-COMMERCE ====================

class Website(models.Model):
    """Website Configuration"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('MAINTENANCE', 'Maintenance Mode'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='websites')
    name = models.CharField(max_length=200)
    domain = models.CharField(max_length=200, unique=True)
    
    # Theme Settings
    theme_name = models.CharField(max_length=100, default='default')
    primary_color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    secondary_color = models.CharField(max_length=7, default='#10B981')
    
    # Logo and Branding
    logo = models.FileField(upload_to='website/logos/', null=True, blank=True)
    favicon = models.FileField(upload_to='website/favicons/', null=True, blank=True)
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.CharField(max_length=500, blank=True)
    
    # Contact Information
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.TextField()
    
    # Social Media
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    
    # Features
    enable_online_ordering = models.BooleanField(default=True)
    enable_user_registration = models.BooleanField(default=True)
    enable_guest_checkout = models.BooleanField(default=True)
    enable_reviews = models.BooleanField(default=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_websites')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['domain']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.domain})"


class WebsiteProduct(models.Model):
    """Products available on website"""
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='website_listings')
    
    # Display Settings
    is_published = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Pricing
    online_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Override product price
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Content
    web_title = models.CharField(max_length=200)
    web_description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    
    # SEO
    slug = models.SlugField(max_length=200, unique=True)
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    
    # Display Order
    display_order = models.IntegerField(default=0)
    
    # Stats
    views_count = models.IntegerField(default=0)
    orders_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', '-created_at']
        indexes = [
            models.Index(fields=['website', 'is_published']),
            models.Index(fields=['slug']),
        ]
        unique_together = ['website', 'product']
    
    def __str__(self):
        return f"{self.website.name} - {self.web_title}"


class ProductImage(models.Model):
    """Product Images for E-commerce"""
    website_product = models.ForeignKey(WebsiteProduct, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/%Y/%m/')
    alt_text = models.CharField(max_length=200, blank=True)
    
    is_primary = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['display_order']
    
    def __str__(self):
        return f"{self.website_product.web_title} - Image {self.display_order}"


class ProductReview(models.Model):
    """Product Reviews"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending Moderation'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    website_product = models.ForeignKey(WebsiteProduct, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200)
    review_text = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Helpfulness voting
    helpful_count = models.IntegerField(default=0)
    not_helpful_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['website_product', 'status']),
        ]
    
    def __str__(self):
        return f"{self.customer} - {self.website_product.web_title} - {self.rating}★"


class OnlineOrder(models.Model):
    """E-commerce Orders"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending Payment'),
        ('PAID', 'Paid'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]
    
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='online_orders')
    order_number = models.CharField(max_length=20, unique=True, db_index=True)
    
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='online_orders', null=True, blank=True)
    
    # Guest Checkout
    guest_email = models.EmailField(blank=True)
    guest_name = models.CharField(max_length=200, blank=True)
    guest_phone = models.CharField(max_length=20, blank=True)
    
    # Financial
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    
    # Addresses
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_province = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20, blank=True)
    
    billing_address = models.TextField()
    billing_city = models.CharField(max_length=100)
    billing_province = models.CharField(max_length=100)
    billing_postal_code = models.CharField(max_length=20, blank=True)
    
    # Payment
    payment_method = models.CharField(max_length=50)
    payment_reference = models.CharField(max_length=100, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Delivery
    tracking_number = models.CharField(max_length=100, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # ERP Integration
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='online_orders')
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['website', 'status']),
            models.Index(fields=['order_number']),
            models.Index(fields=['customer']),
        ]
    
    def __str__(self):
        return f"{self.order_number} - {self.total_amount}"


class OnlineOrderItem(models.Model):
    """Items in Online Order"""
    order = models.ForeignKey(OnlineOrder, on_delete=models.CASCADE, related_name='items')
    website_product = models.ForeignKey(WebsiteProduct, on_delete=models.PROTECT)
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        self.total_price = (self.quantity * self.unit_price) - self.discount_amount + self.tax_amount
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.order.order_number} - {self.website_product.web_title}"


class ShoppingCart(models.Model):
    """Shopping Cart Session"""
    session_id = models.CharField(max_length=100, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='carts')
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='carts')
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['session_id', 'is_active']),
        ]
    
    def __str__(self):
        return f"Cart {self.session_id}"


class ShoppingCartItem(models.Model):
    """Items in Shopping Cart"""
    cart = models.ForeignKey(ShoppingCart, on_delete=models.CASCADE, related_name='items')
    website_product = models.ForeignKey(WebsiteProduct, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['cart', 'website_product']
    
    def __str__(self):
        return f"{self.cart.session_id} - {self.website_product.web_title}"


class PromoCode(models.Model):
    """Promotional Discount Codes"""
    DISCOUNT_TYPE_CHOICES = [
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
    ]
    
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='promo_codes')
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.CharField(max_length=200)
    
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    
    min_order_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    
    usage_limit = models.IntegerField(null=True, blank=True)  # Total uses allowed
    usage_per_customer = models.IntegerField(null=True, blank=True)  # Per customer limit
    current_usage = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_promo_codes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['website', 'is_active']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.discount_value}"


# ==================== WORKFLOW AUTOMATION ====================

class WorkflowDefinition(models.Model):
    """Workflow Automation Definition"""
    TRIGGER_TYPE_CHOICES = [
        ('DOCUMENT_CREATED', 'Document Created'),
        ('DOCUMENT_UPDATED', 'Document Updated'),
        ('AMOUNT_THRESHOLD', 'Amount Threshold Exceeded'),
        ('DATE_TRIGGER', 'Date/Time Trigger'),
        ('STATUS_CHANGE', 'Status Change'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='workflows')
    name = models.CharField(max_length=200)
    description = models.TextField()
    
    # What triggers this workflow
    trigger_type = models.CharField(max_length=30, choices=TRIGGER_TYPE_CHOICES)
    trigger_model = models.CharField(max_length=100)  # Model name (e.g., 'PurchaseOrder')
    trigger_condition = models.TextField()  # JSON conditions
    
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_workflows')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.trigger_type})"


class WorkflowStep(models.Model):
    """Steps in a Workflow"""
    ACTION_TYPE_CHOICES = [
        ('APPROVAL', 'Require Approval'),
        ('NOTIFICATION', 'Send Notification'),
        ('UPDATE_FIELD', 'Update Field'),
        ('CREATE_DOCUMENT', 'Create Document'),
        ('SEND_EMAIL', 'Send Email'),
        ('WEBHOOK', 'Call Webhook'),
    ]
    
    workflow = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='steps')
    step_number = models.IntegerField()
    name = models.CharField(max_length=200)
    
    action_type = models.CharField(max_length=30, choices=ACTION_TYPE_CHOICES)
    action_config = models.TextField()  # JSON configuration
    
    # Approvers (for approval steps)
    approvers = models.ManyToManyField(User, blank=True, related_name='workflow_approver_steps')
    require_all_approvers = models.BooleanField(default=False)
    
    # Conditions
    condition = models.TextField(blank=True)  # JSON conditions for this step
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['step_number']
        unique_together = ['workflow', 'step_number']
    
    def __str__(self):
        return f"{self.workflow.name} - Step {self.step_number}: {self.name}"


class WorkflowInstance(models.Model):
    """Running instance of a workflow"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
        ('ERROR', 'Error'),
    ]
    
    workflow = models.ForeignKey(WorkflowDefinition, on_delete=models.CASCADE, related_name='instances')
    
    # What triggered this instance
    trigger_model = models.CharField(max_length=100)
    trigger_object_id = models.IntegerField()
    trigger_data = models.TextField()  # JSON snapshot of triggering object
    
    current_step = models.ForeignKey(WorkflowStep, on_delete=models.SET_NULL, null=True, blank=True, related_name='current_instances')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='triggered_workflow_instances')
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['workflow', 'status']),
            models.Index(fields=['trigger_model', 'trigger_object_id']),
        ]
    
    def __str__(self):
        return f"{self.workflow.name} - {self.started_at}"


class WorkflowStepExecution(models.Model):
    """Execution log of workflow steps"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('ERROR', 'Error'),
    ]
    
    instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='step_executions')
    step = models.ForeignKey(WorkflowStep, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # For approval steps
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_workflow_steps')
    actioned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='actioned_workflow_steps')
    action_comments = models.TextField(blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    result_data = models.TextField(blank=True)  # JSON result of action
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['started_at']
        indexes = [
            models.Index(fields=['instance', 'status']),
            models.Index(fields=['assigned_to', 'status']),
        ]
    
    def __str__(self):
        return f"{self.instance} - {self.step.name} - {self.status}"


# ==================== ZIMBABWE PAYMENT INTEGRATIONS ====================

class PaymentGateway(models.Model):
    """Payment Gateway Configuration"""
    GATEWAY_TYPE_CHOICES = [
        ('ECOCASH', 'EcoCash'),
        ('ONEMONEY', 'OneMoney'),
        ('INNBUCKS', 'Innbucks'),
        ('PAYNOW', 'Paynow'),
        ('PAYPAL', 'PayPal'),
        ('STRIPE', 'Stripe'),
        ('BANK_TRANSFER', 'Bank Transfer'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='payment_gateways')
    gateway_type = models.CharField(max_length=20, choices=GATEWAY_TYPE_CHOICES)
    name = models.CharField(max_length=100)
    
    # API Configuration
    api_url = models.URLField()
    merchant_id = models.CharField(max_length=100)
    api_key = models.CharField(max_length=255)  # Should be encrypted
    api_secret = models.CharField(max_length=255, blank=True)  # Should be encrypted
    
    # Settings
    is_active = models.BooleanField(default=True)
    is_test_mode = models.BooleanField(default=False)
    
    # Fees
    transaction_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    transaction_fee_fixed = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Display
    display_name = models.CharField(max_length=100)
    display_order = models.IntegerField(default=0)
    logo = models.FileField(upload_to='payment_gateways/', null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_payment_gateways')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order']
        indexes = [
            models.Index(fields=['business', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.gateway_type} - {self.name}"


class PaymentTransaction(models.Model):
    """Payment Transactions"""
    STATUS_CHOICES = [
        ('INITIATED', 'Initiated'),
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    ]
    
    TRANSACTION_TYPE_CHOICES = [
        ('PAYMENT', 'Payment'),
        ('REFUND', 'Refund'),
        ('REVERSAL', 'Reversal'),
    ]
    
    transaction_number = models.CharField(max_length=50, unique=True, db_index=True)
    gateway = models.ForeignKey(PaymentGateway, on_delete=models.PROTECT, related_name='transactions')
    
    # Related Records
    online_order = models.ForeignKey(OnlineOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_transactions')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES, default='PAYMENT')
    
    # Financial
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    
    # Gateway Details
    gateway_transaction_id = models.CharField(max_length=100, blank=True)
    gateway_reference = models.CharField(max_length=100, blank=True)
    
    # Customer Payment Details
    customer_phone = models.CharField(max_length=20, blank=True)
    customer_email = models.EmailField(blank=True)
    
    # Request/Response
    request_payload = models.TextField()
    response_payload = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INITIATED')
    
    # Status Messages
    status_message = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Retry mechanism
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['gateway', 'status']),
            models.Index(fields=['transaction_number']),
            models.Index(fields=['gateway_transaction_id']),
        ]
    
    def __str__(self):
        return f"{self.transaction_number} - {self.amount} - {self.status}"


class EcoCashTransaction(models.Model):
    """EcoCash-specific transactions"""
    payment_transaction = models.OneToOneField(PaymentTransaction, on_delete=models.CASCADE, related_name='ecocash_details')
    
    # EcoCash Specific Fields
    subscriber_msisdn = models.CharField(max_length=20)  # Customer phone number
    merchant_code = models.CharField(max_length=50)
    
    # USSD Push
    ussd_string = models.CharField(max_length=100, blank=True)
    
    # Poll Token (for checking status)
    poll_token = models.CharField(max_length=100, blank=True)
    poll_url = models.URLField(blank=True)
    
    # EcoCash Response
    result_code = models.CharField(max_length=10, blank=True)
    result_description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"EcoCash - {self.subscriber_msisdn}"


class OneMoneyTransaction(models.Model):
    """OneMoney-specific transactions"""
    payment_transaction = models.OneToOneField(PaymentTransaction, on_delete=models.CASCADE, related_name='onemoney_details')
    
    # OneMoney Specific Fields
    customer_msisdn = models.CharField(max_length=20)
    reference_id = models.CharField(max_length=100, blank=True)
    
    # OneMoney Response
    transaction_status = models.CharField(max_length=50, blank=True)
    confirmation_code = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"OneMoney - {self.customer_msisdn}"


class InnbucksTransaction(models.Model):
    """Innbucks-specific transactions"""
    payment_transaction = models.OneToOneField(PaymentTransaction, on_delete=models.CASCADE, related_name='innbucks_details')
    
    # Innbucks Specific Fields
    wallet_number = models.CharField(max_length=20)
    terminal_id = models.CharField(max_length=50)
    
    # Innbucks Response
    auth_code = models.CharField(max_length=50, blank=True)
    receipt_number = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Innbucks - {self.wallet_number}"


# ==================== NOTIFICATION SYSTEM ====================

class NotificationTemplate(models.Model):
    """Notification Templates"""
    CHANNEL_CHOICES = [
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('IN_APP', 'In-App Notification'),
        ('PUSH', 'Push Notification'),
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='notification_templates')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    
    # Email specific
    subject_template = models.CharField(max_length=500, blank=True)
    body_template = models.TextField()
    
    # SMS specific (character limit)
    sms_template = models.CharField(max_length=160, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['business', 'code']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Notification(models.Model):
    """Notification Log"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('READ', 'Read'),
    ]
    
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    channel = models.CharField(max_length=20)
    subject = models.CharField(max_length=500, blank=True)
    message = models.TextField()
    
    # Recipient details
    email_address = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.recipient} - {self.subject} - {self.status}"

