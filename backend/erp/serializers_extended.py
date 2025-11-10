"""
Extended Serializers for ERP Models
"""
from rest_framework import serializers
from .models_extended import *
from .models_extended_part2 import *
from .models_ecommerce import *
from .serializers import UserSerializer

# ==================== SUPPLY CHAIN SERIALIZERS ====================

class VendorSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class PurchaseRequisitionItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = PurchaseRequisitionItem
        fields = '__all__'


class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    items = PurchaseRequisitionItemSerializer(many=True, read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = PurchaseRequisition
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'approved_by', 'approved_at')


class RFQItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = RFQItem
        fields = '__all__'


class RequestForQuotationSerializer(serializers.ModelSerializer):
    items = RFQItemSerializer(many=True, read_only=True)
    vendor_names = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = RequestForQuotation
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')
    
    def get_vendor_names(self, obj):
        return [v.name for v in obj.vendors.all()]


class VendorQuotationItemSerializer(serializers.ModelSerializer):
    rfq_item_description = serializers.CharField(source='rfq_item.description', read_only=True)
    
    class Meta:
        model = VendorQuotationItem
        fields = '__all__'


class VendorQuotationSerializer(serializers.ModelSerializer):
    items = VendorQuotationItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    rfq_number = serializers.CharField(source='rfq.rfq_number', read_only=True)
    
    class Meta:
        model = VendorQuotation
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    
    def get_product_name(self, obj):
        return obj.product.name if obj.product else obj.description
    
    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'
        extra_kwargs = {
            'product': {'required': False, 'allow_null': True},
        }


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at', 'approved_by', 'approved_at')
        extra_kwargs = {
            'po_number': {'required': False},
            'currency': {'required': False},
            'business': {'required': False},
            'exchange_rate': {'required': False},
            'subtotal': {'required': False},
            'tax_amount': {'required': False},
            'discount_amount': {'required': False},
            'shipping_cost': {'required': False},
            'total_amount': {'required': False},
            'notes': {'required': False, 'allow_blank': True},
            'terms_and_conditions': {'required': False, 'allow_blank': True},
            'requisition': {'required': False, 'allow_null': True},
            'quotation': {'required': False, 'allow_null': True},
            'actual_delivery_date': {'required': False, 'allow_null': True},
        }
    
    def create(self, validated_data):
        import random
        import string
        from datetime import datetime
        from decimal import Decimal
        from .models_extended import PurchaseOrder
        from .models import Currency, Business
        
        # Auto-assign business if not provided
        if 'business' not in validated_data or not validated_data.get('business'):
            request = self.context.get('request')
            if request and request.user:
                user = request.user
                business = getattr(user, 'business', None)
                if business:
                    validated_data['business'] = business
                else:
                    # If user has no business, try to get or create a default business
                    business = Business.objects.first()
                    if not business:
                        business = Business.objects.create(name=f"{user.username}'s Business")
                    validated_data['business'] = business
            else:
                # Fallback: get first business or create one
                business = Business.objects.first()
                if not business:
                    business = Business.objects.create(name="Default Business")
                validated_data['business'] = business
        
        # Set defaults for financial fields
        if 'subtotal' not in validated_data:
            validated_data['subtotal'] = Decimal('0')
        if 'tax_amount' not in validated_data:
            validated_data['tax_amount'] = Decimal('0')
        if 'discount_amount' not in validated_data:
            validated_data['discount_amount'] = Decimal('0')
        if 'shipping_cost' not in validated_data:
            validated_data['shipping_cost'] = Decimal('0')
        if 'total_amount' not in validated_data:
            validated_data['total_amount'] = Decimal('0')
        if 'exchange_rate' not in validated_data:
            validated_data['exchange_rate'] = Decimal('1')
        
        # Auto-generate po_number if not provided
        if 'po_number' not in validated_data or not validated_data.get('po_number'):
            # Generate PO number: PO-YYYYMMDD-XXXXXX
            date_str = datetime.now().strftime('%Y%m%d')
            random_suffix = ''.join(random.choices(string.digits, k=6))
            po_number = f"PO-{date_str}-{random_suffix}"
            
            # Ensure uniqueness
            while PurchaseOrder.objects.filter(po_number=po_number).exists():
                random_suffix = ''.join(random.choices(string.digits, k=6))
                po_number = f"PO-{date_str}-{random_suffix}"
            
            validated_data['po_number'] = po_number
        
        # Auto-assign currency if not provided
        if 'currency' not in validated_data or not validated_data.get('currency'):
            # Try to get default currency (USD or first available)
            currency = Currency.objects.filter(code='USD').first()
            if not currency:
                currency = Currency.objects.first()
            if not currency:
                # Create a default USD currency if none exists
                try:
                    currency = Currency.objects.create(
                        code='USD',
                        name='US Dollar',
                        symbol='$',
                        exchange_rate_to_usd=Decimal('1.0'),
                        is_base_currency=True,  # Make it the base currency
                        is_active=True,
                    )
                except Exception as e:
                    # If creation fails (e.g., duplicate), try to get it
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f'Failed to create default currency (may already exist): {e}')
                    currency = Currency.objects.filter(code='USD').first() or Currency.objects.first()
            if currency:
                validated_data['currency'] = currency
            else:
                # If still no currency, this is a critical error
                import logging
                logger = logging.getLogger(__name__)
                logger.error('No currency available and could not create default currency')
                raise serializers.ValidationError({
                    'currency': 'No currency found. Please create a currency in the system settings first.'
                })
        
        return super().create(validated_data)


class VendorBillItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = VendorBillItem
        fields = '__all__'
        read_only_fields = ('tax_amount', 'total_price',)


class VendorBillSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    purchase_order_number = serializers.CharField(source='purchase_order.po_number', read_only=True)
    grn_number = serializers.CharField(source='grn.grn_number', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    submitted_by_name = serializers.SerializerMethodField()
    rejected_by_name = serializers.SerializerMethodField()
    items = VendorBillItemSerializer(many=True, read_only=True)

    class Meta:
        model = VendorBill
        fields = '__all__'
        read_only_fields = (
            'business',
            'vendor',
            'approved_by',
            'approved_at',
            'submitted_by',
            'submitted_at',
            'rejected_by',
            'rejected_at',
            'created_by',
            'created_at',
            'updated_at',
            'balance',
            'payment_status',
        )
        extra_kwargs = {
            'bill_number': {'required': False, 'allow_blank': True},
            'reference': {'required': False, 'allow_blank': True},
            'bill_date': {'required': False},
            'due_date': {'required': False, 'allow_null': True},
            'subtotal': {'required': False},
            'tax_amount': {'required': False},
            'total_amount': {'required': False},
            'paid_amount': {'required': False},
            'notes': {'required': False, 'allow_blank': True},
            'internal_notes': {'required': False, 'allow_blank': True},
            'status': {'required': False},
        }
    
    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None
    
    def get_submitted_by_name(self, obj):
        return obj.submitted_by.get_full_name() if obj.submitted_by else None
    
    def get_rejected_by_name(self, obj):
        return obj.rejected_by.get_full_name() if obj.rejected_by else None


class PurchaseOrderApprovalSerializer(serializers.Serializer):
    approver_id = serializers.IntegerField(required=False)
    approval_notes = serializers.CharField(required=False, allow_blank=True)


class GoodsReceivedNoteItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='po_item.product.name', read_only=True)
    
    class Meta:
        model = GoodsReceivedNoteItem
        fields = '__all__'


class PurchaseOrderPaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = PurchaseOrderPayment
        fields = '__all__'
        read_only_fields = ('created_by', 'payment_date',)


class GoodsReceivedNoteSerializer(serializers.ModelSerializer):
    items = GoodsReceivedNoteItemSerializer(many=True, read_only=True)
    payments = PurchaseOrderPaymentSerializer(many=True, read_only=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True)
    received_by_name = serializers.CharField(source='received_by.get_full_name', read_only=True)
    
    class Meta:
        model = GoodsReceivedNote
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


# ==================== CRM SERIALIZERS ====================

class LeadSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class OpportunitySerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Opportunity
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at', 'weighted_revenue')


class QuotationItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = QuotationItem
        fields = '__all__'


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Quotation
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = SalesOrderItem
        fields = '__all__'


class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = SalesOrder
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class DeliveryNoteItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='sales_order_item.product.name', read_only=True)
    
    class Meta:
        model = DeliveryNoteItem
        fields = '__all__'


class DeliveryNoteSerializer(serializers.ModelSerializer):
    items = DeliveryNoteItemSerializer(many=True, read_only=True)
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    
    class Meta:
        model = DeliveryNote
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class CRMActivitySerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    class Meta:
        model = CRMActivity
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


# ==================== FIXED ASSETS SERIALIZERS ====================

class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class FixedAssetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    
    class Meta:
        model = FixedAsset
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class AssetDepreciationSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    
    class Meta:
        model = AssetDepreciation
        fields = '__all__'
        read_only_fields = ('created_at',)


class AssetMaintenanceSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    
    class Meta:
        model = AssetMaintenance
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


# ==================== HR SERIALIZERS ====================

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class LeaveAllocationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    
    class Meta:
        model = LeaveAllocation
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class LeaveApplicationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = LeaveApplication
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at', 'approved_by', 'approved_at')


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    
    class Meta:
        model = PerformanceReview
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class JobPostingSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = JobPosting
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class JobApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job_posting.title', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = '__all__'
        read_only_fields = ('application_date', 'created_at', 'updated_at')


class TrainingProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingProgram
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class TrainingAttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = TrainingAttendance
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


# ==================== DOCUMENT MANAGEMENT SERIALIZERS ====================

class DocumentCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent_category.name', read_only=True)
    
    class Meta:
        model = DocumentCategory
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class DocumentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


# ==================== ZIMBABWE FISCALIZATION SERIALIZERS ====================

class ZIMRAVirtualFiscalDeviceSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    
    class Meta:
        model = ZIMRAVirtualFiscalDevice
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class FiscalReceiptSerializer(serializers.ModelSerializer):
    device_id = serializers.CharField(source='fiscal_device.device_id', read_only=True)
    
    class Meta:
        model = FiscalReceipt
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class FiscalDayEndSerializer(serializers.ModelSerializer):
    device_id = serializers.CharField(source='fiscal_device.device_id', read_only=True)
    
    class Meta:
        model = FiscalDayEnd
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')


# ==================== BUDGETING SERIALIZERS ====================

class CostCenterSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    
    class Meta:
        model = CostCenter
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class BudgetPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetPeriod
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class BudgetLineSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = BudgetLine
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class BudgetSerializer(serializers.ModelSerializer):
    lines = BudgetLineSerializer(many=True, read_only=True)
    cost_center_name = serializers.CharField(source='cost_center.name', read_only=True)
    period_name = serializers.CharField(source='period.name', read_only=True)
    
    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at', 'approved_by', 'approved_at')


# ==================== E-COMMERCE SERIALIZERS ====================

class WebsiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Website
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'
        read_only_fields = ('created_at',)


class WebsiteProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = WebsiteProduct
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'views_count', 'orders_count')


class ProductReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'helpful_count', 'not_helpful_count')


class OnlineOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='website_product.web_title', read_only=True)
    
    class Meta:
        model = OnlineOrderItem
        fields = '__all__'


class OnlineOrderSerializer(serializers.ModelSerializer):
    items = OnlineOrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = OnlineOrder
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'paid_at')


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='website_product.web_title', read_only=True)
    product_price = serializers.DecimalField(source='website_product.online_price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = ShoppingCartItem
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class ShoppingCartSerializer(serializers.ModelSerializer):
    items = ShoppingCartItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = ShoppingCart
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at', 'current_usage')


# ==================== WORKFLOW SERIALIZERS ====================

class WorkflowStepSerializer(serializers.ModelSerializer):
    approver_names = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowStep
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
    
    def get_approver_names(self, obj):
        return [u.get_full_name() for u in obj.approvers.all()]


class WorkflowDefinitionSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkflowDefinition
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


class WorkflowStepExecutionSerializer(serializers.ModelSerializer):
    step_name = serializers.CharField(source='step.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    actioned_by_name = serializers.CharField(source='actioned_by.get_full_name', read_only=True)
    
    class Meta:
        model = WorkflowStepExecution
        fields = '__all__'
        read_only_fields = ('started_at', 'completed_at')


class WorkflowInstanceSerializer(serializers.ModelSerializer):
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    step_executions = WorkflowStepExecutionSerializer(many=True, read_only=True)
    current_step_name = serializers.CharField(source='current_step.name', read_only=True)
    
    class Meta:
        model = WorkflowInstance
        fields = '__all__'
        read_only_fields = ('created_by', 'started_at', 'completed_at')


# ==================== PAYMENT SERIALIZERS ====================

class PaymentGatewaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGateway
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')
        extra_kwargs = {
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True},
        }


class PaymentTransactionSerializer(serializers.ModelSerializer):
    gateway_name = serializers.CharField(source='gateway.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'initiated_at', 'completed_at')


class EcoCashTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcoCashTransaction
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class OneMoneyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OneMoneyTransaction
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class InnbucksTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InnbucksTransaction
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


# ==================== NOTIFICATION SERIALIZERS ====================

class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at', 'sent_at', 'read_at')

