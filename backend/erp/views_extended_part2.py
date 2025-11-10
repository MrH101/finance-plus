"""
Extended API ViewSets - Part 2
Document Management, Fiscalization, E-commerce, Payments, Workflows
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from .models_extended_part2 import *
from .models_ecommerce import *
from .serializers_extended import *

# ==================== DOCUMENT MANAGEMENT VIEWSETS ====================

class DocumentCategoryViewSet(viewsets.ModelViewSet):
    queryset = DocumentCategory.objects.all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'is_active', 'parent_category']
    search_fields = ['name']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return DocumentCategory.objects.all()
        return DocumentCategory.objects.filter(business=user.business)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['business', 'category', 'status', 'is_public']
    search_fields = ['document_number', 'title', 'tags']
    ordering_fields = ['created_at', 'title']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Document.objects.all()
        
        # Return documents that user has access to
        queryset = Document.objects.filter(
            Q(business=user.business) & 
            (
                Q(is_public=True) |
                Q(allowed_users=user) |
                Q(allowed_departments__users=user)
            )
        ).distinct()
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)
    
    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        """Create a new version of document"""
        document = self.get_object()
        
        # Mark current as not latest
        document.is_latest_version = False
        document.save()
        
        # Create new version
        new_version = Document.objects.create(
            business=document.business,
            document_number=document.document_number,
            title=document.title,
            description=request.data.get('description', document.description),
            category=document.category,
            file=request.FILES['file'],
            file_size=request.FILES['file'].size,
            file_type=request.FILES['file'].content_type,
            version=request.data.get('version', '2.0'),
            previous_version=document,
            is_latest_version=True,
            is_public=document.is_public,
            created_by=request.user
        )
        
        return Response(DocumentSerializer(new_version).data)


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'template_type', 'is_active']
    search_fields = ['name']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return DocumentTemplate.objects.all()
        return DocumentTemplate.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


# ==================== ZIMBABWE FISCALIZATION VIEWSETS ====================

class ZIMRAVirtualFiscalDeviceViewSet(viewsets.ModelViewSet):
    queryset = ZIMRAVirtualFiscalDevice.objects.all()
    serializer_class = ZIMRAVirtualFiscalDeviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'store', 'status']
    search_fields = ['device_id']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return ZIMRAVirtualFiscalDevice.objects.all()
        return ZIMRAVirtualFiscalDevice.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """Register device with ZIMRA"""
        device = self.get_object()
        
        # TODO: Implement actual ZIMRA registration API call
        # This is a placeholder for the integration
        
        device.status = 'ACTIVE'
        device.registration_date = timezone.now().date()
        device.save()
        
        return Response({
            'status': 'success',
            'message': 'Device registered successfully',
            'device': ZIMRAVirtualFiscalDeviceSerializer(device).data
        })
    
    @action(detail=True, methods=['post'])
    def sync_receipts(self, request, pk=None):
        """Sync receipts with ZIMRA"""
        device = self.get_object()
        
        pending_receipts = FiscalReceipt.objects.filter(
            fiscal_device=device,
            status='PENDING'
        )
        
        synced_count = 0
        for receipt in pending_receipts:
            # TODO: Implement actual ZIMRA API submission
            receipt.status = 'SUBMITTED'
            receipt.last_attempt_datetime = timezone.now()
            receipt.save()
            synced_count += 1
        
        device.last_sync_datetime = timezone.now()
        device.save()
        
        return Response({
            'synced_count': synced_count,
            'last_sync': device.last_sync_datetime
        })


class FiscalReceiptViewSet(viewsets.ModelViewSet):
    queryset = FiscalReceipt.objects.all()
    serializer_class = FiscalReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fiscal_device', 'status']
    search_fields = ['receipt_number', 'fiscal_receipt_number']
    ordering_fields = ['receipt_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return FiscalReceipt.objects.all()
        return FiscalReceipt.objects.filter(fiscal_device__business=user.business)


class FiscalDayEndViewSet(viewsets.ModelViewSet):
    queryset = FiscalDayEnd.objects.all()
    serializer_class = FiscalDayEndSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['fiscal_device', 'is_submitted']
    ordering_fields = ['business_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return FiscalDayEnd.objects.all()
        return FiscalDayEnd.objects.filter(fiscal_device__business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ==================== BUDGETING VIEWSETS ====================

class CostCenterViewSet(viewsets.ModelViewSet):
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'department', 'is_active']
    search_fields = ['code', 'name']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return CostCenter.objects.all()
        return CostCenter.objects.filter(business=user.business)


class BudgetPeriodViewSet(viewsets.ModelViewSet):
    queryset = BudgetPeriod.objects.all()
    serializer_class = BudgetPeriodSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['business', 'period_type', 'is_active']
    search_fields = ['name']
    ordering_fields = ['start_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return BudgetPeriod.objects.all()
        return BudgetPeriod.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['business', 'status', 'period', 'cost_center']
    search_fields = ['budget_number', 'name']
    ordering_fields = ['created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Budget.objects.all()
        return Budget.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve budget"""
        budget = self.get_object()
        if budget.status != 'SUBMITTED':
            return Response(
                {'error': 'Only submitted budgets can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        budget.status = 'APPROVED'
        budget.approved_by = request.user
        budget.approved_at = timezone.now()
        budget.save()
        
        return Response(BudgetSerializer(budget).data)
    
    @action(detail=True, methods=['get'])
    def variance_analysis(self, request, pk=None):
        """Get budget variance analysis"""
        budget = self.get_object()
        lines = budget.lines.all()
        
        return Response({
            'budget_number': budget.budget_number,
            'total_budgeted': budget.total_budget_amount,
            'total_actual': budget.total_actual_amount,
            'total_variance': budget.variance_amount,
            'variance_percent': budget.variance_percent,
            'lines': BudgetLineSerializer(lines, many=True).data
        })


# ==================== E-COMMERCE VIEWSETS ====================

class WebsiteViewSet(viewsets.ModelViewSet):
    queryset = Website.objects.all()
    serializer_class = WebsiteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'status']
    search_fields = ['name', 'domain']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Website.objects.all()
        return Website.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class WebsiteProductViewSet(viewsets.ModelViewSet):
    queryset = WebsiteProduct.objects.all()
    serializer_class = WebsiteProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['website', 'is_published', 'is_featured']
    search_fields = ['web_title', 'web_description']
    ordering_fields = ['display_order', 'created_at', 'views_count']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return WebsiteProduct.objects.all()
        return WebsiteProduct.objects.filter(website__business=user.business)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Increment product views"""
        product = self.get_object()
        product.views_count += 1
        product.save()
        return Response({'views_count': product.views_count})


class ProductReviewViewSet(viewsets.ModelViewSet):
    queryset = ProductReview.objects.all()
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['website_product', 'status', 'rating']
    search_fields = ['title', 'review_text']
    ordering_fields = ['created_at', 'rating', 'helpful_count']
    
    @action(detail=True, methods=['post'])
    def mark_helpful(self, request, pk=None):
        """Mark review as helpful"""
        review = self.get_object()
        is_helpful = request.data.get('is_helpful', True)
        
        if is_helpful:
            review.helpful_count += 1
        else:
            review.not_helpful_count += 1
        review.save()
        
        return Response(ProductReviewSerializer(review).data)


class OnlineOrderViewSet(viewsets.ModelViewSet):
    queryset = OnlineOrder.objects.all()
    serializer_class = OnlineOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['website', 'status', 'payment_status', 'customer']
    search_fields = ['order_number', 'guest_email', 'guest_name']
    ordering_fields = ['created_at', 'total_amount']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return OnlineOrder.objects.all()
        return OnlineOrder.objects.filter(website__business=user.business)
    
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Process order payment"""
        order = self.get_object()
        
        if order.payment_status == 'COMPLETED':
            return Response(
                {'error': 'Order already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Implement actual payment processing
        order.payment_status = 'COMPLETED'
        order.paid_at = timezone.now()
        order.status = 'PROCESSING'
        order.save()
        
        return Response(OnlineOrderSerializer(order).data)


class ShoppingCartViewSet(viewsets.ModelViewSet):
    queryset = ShoppingCart.objects.all()
    serializer_class = ShoppingCartSerializer
    permission_classes = [permissions.AllowAny]  # Allow anonymous users
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['session_id', 'customer', 'is_active']
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add item to cart"""
        cart = self.get_object()
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        
        try:
            website_product = WebsiteProduct.objects.get(id=product_id)
        except WebsiteProduct.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cart_item, created = ShoppingCartItem.objects.get_or_create(
            cart=cart,
            website_product=website_product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        return Response(ShoppingCartSerializer(cart).data)
    
    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        """Remove item from cart"""
        cart = self.get_object()
        item_id = request.data.get('item_id')
        
        try:
            item = ShoppingCartItem.objects.get(id=item_id, cart=cart)
            item.delete()
        except ShoppingCartItem.DoesNotExist:
            return Response(
                {'error': 'Item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(ShoppingCartSerializer(cart).data)


class PromoCodeViewSet(viewsets.ModelViewSet):
    queryset = PromoCode.objects.all()
    serializer_class = PromoCodeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['website', 'is_active']
    search_fields = ['code', 'description']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return PromoCode.objects.all()
        return PromoCode.objects.filter(website__business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def validate_code(self, request):
        """Validate a promo code"""
        code = request.data.get('code')
        order_amount = request.data.get('order_amount', 0)
        
        try:
            promo = PromoCode.objects.get(code=code, is_active=True)
        except PromoCode.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Invalid promo code'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check validity period
        now = timezone.now()
        if now < promo.valid_from or now > promo.valid_until:
            return Response(
                {'valid': False, 'error': 'Promo code has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check minimum order amount
        if order_amount < promo.min_order_amount:
            return Response(
                {'valid': False, 'error': f'Minimum order amount is {promo.min_order_amount}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check usage limit
        if promo.usage_limit and promo.current_usage >= promo.usage_limit:
            return Response(
                {'valid': False, 'error': 'Promo code usage limit reached'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate discount
        if promo.discount_type == 'PERCENTAGE':
            discount = (order_amount * promo.discount_value) / 100
            if promo.max_discount_amount:
                discount = min(discount, promo.max_discount_amount)
        else:
            discount = promo.discount_value
        
        return Response({
            'valid': True,
            'discount_amount': discount,
            'discount_type': promo.discount_type,
            'discount_value': promo.discount_value
        })


# ==================== WORKFLOW VIEWSETS ====================

class WorkflowDefinitionViewSet(viewsets.ModelViewSet):
    queryset = WorkflowDefinition.objects.all()
    serializer_class = WorkflowDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'is_active', 'trigger_type']
    search_fields = ['name']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return WorkflowDefinition.objects.all()
        return WorkflowDefinition.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class WorkflowInstanceViewSet(viewsets.ModelViewSet):
    queryset = WorkflowInstance.objects.all()
    serializer_class = WorkflowInstanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['workflow', 'status']
    ordering_fields = ['started_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return WorkflowInstance.objects.all()
        return WorkflowInstance.objects.filter(workflow__business=user.business)


class WorkflowStepExecutionViewSet(viewsets.ModelViewSet):
    queryset = WorkflowStepExecution.objects.all()
    serializer_class = WorkflowStepExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['instance', 'status', 'assigned_to']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve workflow step"""
        execution = self.get_object()
        
        if execution.status != 'PENDING':
            return Response(
                {'error': 'Only pending steps can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        execution.status = 'APPROVED'
        execution.actioned_by = request.user
        execution.action_comments = request.data.get('comments', '')
        execution.completed_at = timezone.now()
        execution.save()
        
        # Move workflow to next step
        # TODO: Implement workflow progression logic
        
        return Response(WorkflowStepExecutionSerializer(execution).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject workflow step"""
        execution = self.get_object()
        
        execution.status = 'REJECTED'
        execution.actioned_by = request.user
        execution.action_comments = request.data.get('comments', '')
        execution.completed_at = timezone.now()
        execution.save()
        
        # Update workflow instance
        execution.instance.status = 'REJECTED'
        execution.instance.completed_at = timezone.now()
        execution.instance.save()
        
        return Response(WorkflowStepExecutionSerializer(execution).data)


# ==================== PAYMENT VIEWSETS ====================

class PaymentGatewayViewSet(viewsets.ModelViewSet):
    queryset = PaymentGateway.objects.all()
    serializer_class = PaymentGatewaySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['business', 'gateway_type', 'is_active']
    ordering_fields = ['display_order']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return PaymentGateway.objects.all()
        return PaymentGateway.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class PaymentTransactionViewSet(viewsets.ModelViewSet):
    queryset = PaymentTransaction.objects.all()
    serializer_class = PaymentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['gateway', 'status', 'transaction_type', 'customer']
    search_fields = ['transaction_number', 'gateway_transaction_id']
    ordering_fields = ['created_at', 'amount']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return PaymentTransaction.objects.all()
        return PaymentTransaction.objects.filter(gateway__business=user.business)
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retry failed transaction"""
        transaction = self.get_object()
        
        if transaction.status not in ['FAILED', 'PENDING']:
            return Response(
                {'error': 'Only failed or pending transactions can be retried'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if transaction.retry_count >= transaction.max_retries:
            return Response(
                {'error': 'Maximum retry attempts reached'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Implement actual payment gateway retry logic
        transaction.retry_count += 1
        transaction.status = 'PROCESSING'
        transaction.save()
        
        return Response(PaymentTransactionSerializer(transaction).data)


# ==================== NOTIFICATION VIEWSETS ====================

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'channel', 'is_active']
    search_fields = ['name', 'code']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return NotificationTemplate.objects.all()
        return NotificationTemplate.objects.filter(business=user.business)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['recipient', 'status', 'channel']
    ordering_fields = ['created_at']
    
    def get_queryset(self):
        user = self.request.user
        # Users can only see their own notifications
        return Notification.objects.filter(recipient=user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.status = 'READ'
        notification.read_at = timezone.now()
        notification.save()
        return Response(NotificationSerializer(notification).data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(
            recipient=request.user,
            status__in=['PENDING', 'SENT']
        ).update(status='READ', read_at=timezone.now())
        
        return Response({'status': 'success'})

