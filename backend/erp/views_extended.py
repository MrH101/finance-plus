"""
Extended API ViewSets for ERP
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models_extended import *
from .models_extended_part2 import *
from .models_ecommerce import *
from .serializers_extended import *
from .models_extended import VendorBillItem
from .permissions import IsBusinessOwnerOrAdmin

# ==================== SUPPLY CHAIN VIEWSETS ====================

class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vendor_type', 'is_active', 'business']
    search_fields = ['name', 'vendor_code', 'email', 'phone']
    ordering_fields = ['created_at', 'name', 'rating']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Vendor.objects.all()
        return Vendor.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)
    
    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        """Get purchase history for a vendor"""
        vendor = self.get_object()
        pos = PurchaseOrder.objects.filter(vendor=vendor).order_by('-order_date')[:10]
        return Response({
            'total_orders': pos.count(),
            'recent_orders': PurchaseOrderSerializer(pos, many=True).data
        })


class PurchaseRequisitionViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisition.objects.all()
    serializer_class = PurchaseRequisitionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business', 'department', 'requested_by']
    search_fields = ['requisition_number', 'purpose']
    ordering_fields = ['created_at', 'date_required']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return PurchaseRequisition.objects.all()
        return PurchaseRequisition.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user, business=self.request.user.business)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a requisition"""
        requisition = self.get_object()
        if requisition.status != 'PENDING':
            return Response(
                {'error': 'Only pending requisitions can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        requisition.status = 'APPROVED'
        requisition.approved_by = request.user
        requisition.approved_at = timezone.now()
        requisition.save()
        
        return Response(PurchaseRequisitionSerializer(requisition).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a requisition"""
        requisition = self.get_object()
        reason = request.data.get('reason', '')
        
        requisition.status = 'REJECTED'
        requisition.rejection_reason = reason
        requisition.save()
        
        return Response(PurchaseRequisitionSerializer(requisition).data)


class RequestForQuotationViewSet(viewsets.ModelViewSet):
    queryset = RequestForQuotation.objects.all()
    serializer_class = RequestForQuotationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business']
    search_fields = ['rfq_number', 'title']
    ordering_fields = ['created_at', 'closing_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return RequestForQuotation.objects.all()
        return RequestForQuotation.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class VendorQuotationViewSet(viewsets.ModelViewSet):
    queryset = VendorQuotation.objects.all()
    serializer_class = VendorQuotationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'rfq', 'vendor']
    search_fields = ['quotation_number']
    ordering_fields = ['created_at', 'grand_total']


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business', 'vendor']
    search_fields = ['po_number']
    ordering_fields = ['created_at', 'order_date', 'total_amount']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return PurchaseOrder.objects.all()
        return PurchaseOrder.objects.filter(business=user.business)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        from .models_extended import PurchaseOrderItem
        from .models import Product
        import random
        import string
        
        # Business is already set in serializer.create(), just need to set created_by
        po = serializer.save(created_by=self.request.user)
        
        # Create purchase order items if provided
        items_data = self.request.data.get('items', [])
        if items_data:
            for item_data in items_data:
                product_id = item_data.get('product')
                description = item_data.get('description', '')
                is_inventory_item = item_data.get('is_inventory_item', True)
                
                # Product is optional - can be linked to existing product or left null for custom items
                # Products will be created automatically when receiving inventory items (in GRN)
                product = None
                if product_id:
                    try:
                        product = Product.objects.get(id=product_id)
                    except Product.DoesNotExist:
                        pass
                
                PurchaseOrderItem.objects.create(
                    purchase_order=po,
                    product=product,
                    description=description,
                    quantity_ordered=item_data.get('quantity_ordered', 0),
                    unit_price=item_data.get('unit_price', 0),
                    is_inventory_item=is_inventory_item,
                )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a purchase order"""
        po = self.get_object()
        po.status = 'SENT'
        po.approved_by = request.user
        po.approved_at = timezone.now()
        po.save()
        return Response(PurchaseOrderSerializer(po).data)


class VendorBillViewSet(viewsets.ModelViewSet):
    queryset = VendorBill.objects.select_related('business', 'purchase_order', 'vendor', 'currency', 'approved_by')
    serializer_class = VendorBillSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'business', 'vendor', 'purchase_order']
    search_fields = ['bill_number', 'reference']
    ordering_fields = ['bill_date', 'due_date', 'total_amount', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return self.queryset
        return self.queryset.filter(business=user.business)

    def perform_create(self, serializer):
        """Create vendor bill with proper audit trail"""
        from .models_extended import VendorBillItem
        from decimal import Decimal
        
        purchase_order = serializer.validated_data.get('purchase_order')
        if not purchase_order:
            raise ValidationError({'purchase_order': 'Purchase order is required.'})

        business = getattr(purchase_order, 'business', None)
        if not business:
            business = getattr(self.request.user, 'business', None)
        if not business:
            raise ValidationError('Unable to determine business for vendor bill')

        vendor = getattr(purchase_order, 'vendor', None)
        if not vendor:
            raise ValidationError('Purchase order is missing vendor information')

        if 'currency' not in serializer.validated_data or not serializer.validated_data.get('currency'):
            serializer.validated_data['currency'] = purchase_order.currency
        
        # Set created_by
        serializer.validated_data['created_by'] = self.request.user

        # Generate bill number if not provided
        if not serializer.validated_data.get('bill_number'):
            from django.utils import timezone
            import random
            import string
            year = timezone.now().year
            random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            serializer.validated_data['bill_number'] = f'VB-{year}-{random_suffix}'

        bill = serializer.save(business=business, vendor=vendor)
        
        # Create bill items from GRN items if GRN is provided
        grn = serializer.validated_data.get('grn')
        if grn:
            for grn_item in grn.items.all():
                po_item = grn_item.po_item
                if po_item:
                    VendorBillItem.objects.create(
                        vendor_bill=bill,
                        grn_item=grn_item,
                        po_item=po_item,
                        product=po_item.product,
                        description=po_item.description or grn_item.po_item.description,
                        quantity=grn_item.quantity_accepted or grn_item.quantity_received,
                        unit_price=po_item.unit_price,
                        tax_rate=po_item.tax_rate,
                        unit_of_measure=po_item.unit_of_measure,
                    )
        elif purchase_order:
            # Create bill items from PO items if no GRN
            for po_item in purchase_order.items.all():
                VendorBillItem.objects.create(
                    vendor_bill=bill,
                    po_item=po_item,
                    product=po_item.product,
                    description=po_item.description,
                    quantity=po_item.quantity_ordered,
                    unit_price=po_item.unit_price,
                    tax_rate=po_item.tax_rate,
                    unit_of_measure=po_item.unit_of_measure,
                )

    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        """Submit vendor bill for approval - industry standard workflow"""
        bill = self.get_object()
        if bill.status != 'DRAFT':
            return Response({'detail': 'Only draft bills can be submitted for approval.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate bill has items
        if not bill.items.exists():
            return Response({'detail': 'Cannot submit bill without items.'}, status=status.HTTP_400_BAD_REQUEST)
        
        bill.status = 'TO_APPROVE'
        bill.submitted_by = request.user
        bill.submitted_at = timezone.now()
        bill.save(update_fields=['status', 'submitted_by', 'submitted_at', 'updated_at'])
        return Response(self.get_serializer(bill).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve vendor bill - industry standard approval workflow"""
        bill = self.get_object()
        if bill.status not in ['DRAFT', 'TO_APPROVE']:
            return Response({'detail': 'Only draft or waiting approval bills can be approved.'}, status=status.HTTP_400_BAD_REQUEST)
        bill.status = 'APPROVED'
        bill.approved_by = request.user
        bill.approved_at = timezone.now()
        bill.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_at'])
        
        # Update purchase order status to BILLED if all items are billed
        if bill.purchase_order:
            po = bill.purchase_order
            # Check if all items are fully billed
            all_billed = all(
                item.quantity_billed >= item.quantity_ordered 
                for item in po.items.all()
            )
            if all_billed and po.status != 'COMPLETED':
                po.status = 'BILLED'
                po.save(update_fields=['status'])
        
        return Response(self.get_serializer(bill).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject vendor bill - industry standard rejection workflow"""
        bill = self.get_object()
        if bill.status not in ['DRAFT', 'TO_APPROVE']:
            return Response({'detail': 'Only draft or waiting approval bills can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)
        
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response({'detail': 'Rejection reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        bill.status = 'REJECTED'
        bill.rejected_by = request.user
        bill.rejected_at = timezone.now()
        bill.rejection_reason = rejection_reason
        bill.save(update_fields=['status', 'rejected_by', 'rejected_at', 'rejection_reason', 'updated_at'])
        
        return Response(self.get_serializer(bill).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel vendor bill"""
        bill = self.get_object()
        if bill.status in ['PAID']:
            return Response({'detail': 'Cannot cancel a paid bill.'}, status=status.HTTP_400_BAD_REQUEST)
        bill.status = 'CANCELLED'
        bill.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(bill).data)


class VendorBillItemViewSet(viewsets.ModelViewSet):
    """ViewSet for Vendor Bill Items"""
    queryset = VendorBillItem.objects.all()
    serializer_class = VendorBillItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vendor_bill', 'product', 'po_item']
    search_fields = ['description']
    ordering_fields = ['id']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return self.queryset
        return self.queryset.filter(vendor_bill__business=user.business)


class GoodsReceivedNoteViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceivedNote.objects.all()
    serializer_class = GoodsReceivedNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business', 'purchase_order']
    search_fields = ['grn_number']
    ordering_fields = ['created_at', 'receipt_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return GoodsReceivedNote.objects.all()
        return GoodsReceivedNote.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        """Create GRN and add items to inventory if they are inventory items"""
        from .models import Inventory, Product
        from django.db.models import F
        import random
        import string
        from decimal import Decimal
        
        grn = serializer.save(received_by=self.request.user, business=self.request.user.business)
        
        # Calculate total amount from PO
        total_amount = Decimal('0')
        for item in grn.items.all():
            po_item = item.po_item
            total_amount += po_item.unit_price * item.quantity_received
        
        grn.total_amount = total_amount
        grn.save(update_fields=['total_amount'])
        
        # Add items to inventory if they are inventory items
        for item in grn.items.all():
            po_item = item.po_item
            if po_item.is_inventory_item and item.quantity_received > 0:
                # If product doesn't exist but it's an inventory item, create it
                product = po_item.product
                if not product:
                    business = grn.business
                    description = po_item.description
                    
                    # Generate unique SKU
                    prefix = description[:3].upper().replace(' ', '')
                    if len(prefix) < 3:
                        prefix = 'PRO'
                    sku = f"{prefix}-{''.join(random.choices(string.digits, k=6))}"
                    while Product.objects.filter(sku=sku).exists():
                        sku = f"{prefix}-{''.join(random.choices(string.digits, k=6))}"
                    
                    product = Product.objects.create(
                        business=business,
                        name=description,
                        sku=sku,
                        description=description,
                        unit_price=po_item.unit_price,
                        cost_price=po_item.unit_price,
                        quantity_in_stock=0,
                        is_active=True,
                    )
                    # Update the PO item to link to the new product
                    po_item.product = product
                    po_item.save()
                
                # Add to inventory
                Inventory.objects.create(
                    product=product,
                    quantity=int(item.quantity_received),
                    unit_cost=po_item.unit_price,
                    total_cost=po_item.unit_price * item.quantity_received,
                    transaction_type='PURCHASE',
                    reference=f'GRN {grn.grn_number}',
                    notes=f'Received from Purchase Order {po_item.purchase_order.po_number}'
                )
                # Update product stock
                product.quantity_in_stock = F('quantity_in_stock') + int(item.quantity_received)
                product.save(update_fields=['quantity_in_stock'])
    
    @action(detail=True, methods=['post'])
    def create_bill(self, request, pk=None):
        """Create vendor bill from GRN - industry standard workflow"""
        from .models_extended import VendorBill, VendorBillItem
        from django.utils import timezone
        import random
        import string
        
        grn = self.get_object()
        
        # Check if bill already exists for this GRN
        existing_bill = VendorBill.objects.filter(grn=grn).first()
        if existing_bill:
            return Response({
                'detail': f'Bill already exists for this GRN: {existing_bill.bill_number}',
                'bill_id': existing_bill.id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate GRN is accepted
        if grn.status != 'ACCEPTED':
            return Response({
                'detail': 'GRN must be accepted before creating a bill.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get bill data from request
        bill_number = request.data.get('bill_number', '').strip()
        bill_date = request.data.get('bill_date')
        if bill_date:
            from datetime import datetime
            if isinstance(bill_date, str):
                bill_date = datetime.strptime(bill_date, '%Y-%m-%d').date()
        else:
            bill_date = timezone.now().date()
        
        due_date = request.data.get('due_date', None)
        if due_date:
            from datetime import datetime
            if isinstance(due_date, str):
                due_date = datetime.strptime(due_date, '%Y-%m-%d').date()
        
        reference = request.data.get('reference', '').strip()
        notes = request.data.get('notes', '').strip()
        
        # Generate bill number if not provided
        if not bill_number:
            year = timezone.now().year
            random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            bill_number = f'VB-{year}-{random_suffix}'
            # Ensure uniqueness
            while VendorBill.objects.filter(bill_number=bill_number).exists():
                random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                bill_number = f'VB-{year}-{random_suffix}'
        
        # Create vendor bill
        bill = VendorBill.objects.create(
            business=grn.business,
            purchase_order=grn.purchase_order,
            grn=grn,
            vendor=grn.purchase_order.vendor,
            currency=grn.purchase_order.currency,
            bill_number=bill_number,
            reference=reference,
            bill_date=bill_date,
            due_date=due_date,
            notes=notes,
            status='DRAFT',
            created_by=request.user,
        )
        
        # Create bill items from GRN items
        from decimal import Decimal
        subtotal = Decimal('0')
        tax_total = Decimal('0')
        for grn_item in grn.items.all():
            po_item = grn_item.po_item
            if not po_item:
                continue
                
            quantity = grn_item.quantity_accepted or grn_item.quantity_received
            unit_price = po_item.unit_price
            tax_rate = po_item.tax_rate or Decimal('0')
            total_price = quantity * unit_price
            tax_amount = total_price * (tax_rate / Decimal('100'))
            
            VendorBillItem.objects.create(
                vendor_bill=bill,
                grn_item=grn_item,
                po_item=po_item,
                product=po_item.product,
                description=po_item.description or '',
                quantity=quantity,
                unit_price=unit_price,
                tax_rate=tax_rate,
                unit_of_measure=po_item.unit_of_measure or 'Units',
            )
            
            subtotal += total_price
            tax_total += tax_amount
        
        # Update bill totals (the save method on VendorBillItem will also update these, but we set them here for consistency)
        bill.subtotal = subtotal
        bill.tax_amount = tax_total
        bill.total_amount = subtotal + tax_total
        bill.balance = bill.total_amount - bill.paid_amount
        bill.save()
        
        # Update GRN payment status
        grn.total_amount = bill.total_amount
        grn.save(update_fields=['total_amount'])
        
        return Response({
            'detail': 'Vendor bill created successfully',
            'bill': VendorBillSerializer(bill).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Process payment for GRN - supports multiple payment methods"""
        from .models_extended import PurchaseOrderPayment, VendorBill
        from .models import CashTill, MobileMoneyAccount, BankAccount, MobileMoneyTransaction, BankTransaction
        from django.db.models import F
        from django.db import transaction
        from decimal import Decimal
        import logging
        
        logger = logging.getLogger(__name__)
        
        grn = self.get_object()
        payments_data = request.data.get('payments', [])  # List of {method: 'CASH', amount: 100, account_id: 1}
        
        if not payments_data:
            return Response({'error': 'No payment methods provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        total_payment = Decimal('0')
        for payment_data in payments_data:
            amount = Decimal(str(payment_data.get('amount', 0)))
            if amount <= 0:
                continue
            total_payment += amount
        
        if total_payment <= 0:
            return Response({'error': 'Invalid payment amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if payment exceeds total amount
        if total_payment > grn.total_amount:
            return Response({'error': f'Payment amount (${total_payment}) exceeds total amount (${grn.total_amount})'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get store from purchase order (if available)
        store = None
        if hasattr(grn.purchase_order, 'store'):
            store = grn.purchase_order.store
        elif hasattr(grn.business, 'stores'):
            store = grn.business.stores.first()
        
        with transaction.atomic():
            # Process each payment method
            for payment_data in payments_data:
                payment_method = payment_data.get('method', '').upper()
                amount = Decimal(str(payment_data.get('amount', 0)))
                account_id = payment_data.get('account_id')
                
                if amount <= 0:
                    continue
                
                if payment_method == 'CASH':
                    # Deduct from cash till
                    if account_id:
                        cash_till = CashTill.objects.filter(id=account_id, is_active=True).first()
                    else:
                        cash_till = CashTill.objects.filter(store=store, is_active=True).first() if store else CashTill.objects.filter(business=grn.business, is_active=True).first()
                    
                    if not cash_till:
                        return Response({'error': 'No cash till found'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    if cash_till.current_balance < amount:
                        return Response({'error': f'Insufficient cash balance. Available: ${cash_till.current_balance}, Required: ${amount}'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Deduct from cash till
                    CashTill.objects.filter(id=cash_till.id).update(current_balance=F('current_balance') - amount)
                    
                    # Create payment record
                    PurchaseOrderPayment.objects.create(
                        grn=grn,
                        payment_method='CASH',
                        amount=amount,
                        cash_till=cash_till,
                        created_by=request.user,
                        notes=f'Payment for GRN {grn.grn_number}'
                    )
                    
                elif payment_method == 'MOBILE_MONEY':
                    # Deduct from mobile money account
                    if account_id:
                        mobile_account = MobileMoneyAccount.objects.filter(id=account_id, is_active=True).first()
                    else:
                        mobile_account = MobileMoneyAccount.objects.filter(store=store, is_active=True).first() if store else MobileMoneyAccount.objects.filter(business=grn.business, is_active=True).first()
                    
                    if not mobile_account:
                        return Response({'error': 'No mobile money account found'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    if mobile_account.current_balance < amount:
                        return Response({'error': f'Insufficient mobile money balance. Available: ${mobile_account.current_balance}, Required: ${amount}'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Create transaction and deduct
                    MobileMoneyTransaction.objects.create(
                        mobile_account=mobile_account,
                        transaction_type='PAYMENT',
                        amount=amount,
                        reference=f'GRN {grn.grn_number}',
                        description=f'Payment for Purchase Order {grn.purchase_order.po_number}',
                        transaction_date=timezone.now().date(),
                        value_date=timezone.now().date(),
                        status='COMPLETED',
                        created_by=request.user
                    )
                    MobileMoneyAccount.objects.filter(id=mobile_account.id).update(current_balance=F('current_balance') - amount)
                    
                    # Create payment record
                    PurchaseOrderPayment.objects.create(
                        grn=grn,
                        payment_method='MOBILE_MONEY',
                        amount=amount,
                        mobile_money_account=mobile_account,
                        created_by=request.user,
                        notes=f'Payment for GRN {grn.grn_number}'
                    )
                    
                elif payment_method == 'BANK':
                    # Deduct from bank account
                    if account_id:
                        bank_account = BankAccount.objects.filter(id=account_id, is_active=True).first()
                    else:
                        bank_account = BankAccount.objects.filter(store=store, is_active=True).first() if store else BankAccount.objects.filter(business=grn.business, is_active=True).first()
                    
                    if not bank_account:
                        return Response({'error': 'No bank account found'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    if bank_account.current_balance < amount:
                        return Response({'error': f'Insufficient bank balance. Available: ${bank_account.current_balance}, Required: ${amount}'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Create transaction and deduct
                    BankTransaction.objects.create(
                        bank_account=bank_account,
                        transaction_type='PAYMENT',
                        amount=amount,
                        reference=f'GRN {grn.grn_number}',
                        description=f'Payment for Purchase Order {grn.purchase_order.po_number}',
                        transaction_date=timezone.now().date(),
                        value_date=timezone.now().date(),
                        status='COMPLETED',
                        created_by=request.user
                    )
                    BankAccount.objects.filter(id=bank_account.id).update(current_balance=F('current_balance') - amount)
                    
                    # Create payment record
                    PurchaseOrderPayment.objects.create(
                        grn=grn,
                        payment_method='BANK',
                        amount=amount,
                        bank_account=bank_account,
                        created_by=request.user,
                        notes=f'Payment for GRN {grn.grn_number}'
                    )
            
            # Update GRN payment status
            grn.refresh_from_db()
            new_paid_amount = grn.paid_amount + total_payment
            grn.paid_amount = new_paid_amount
            grn.save(update_fields=['paid_amount'])
            grn.refresh_from_db()
            
            # Update payment status
            if grn.paid_amount >= grn.total_amount:
                grn.payment_status = 'PAID'
            elif grn.paid_amount > 0:
                grn.payment_status = 'PARTIAL'
            else:
                grn.payment_status = 'PENDING'
            grn.save(update_fields=['payment_status'])
            
            # Update vendor bill payment status if bill exists for this GRN
            vendor_bill = VendorBill.objects.filter(grn=grn).first()
            if vendor_bill:
                vendor_bill.paid_amount = grn.paid_amount
                vendor_bill.balance = vendor_bill.total_amount - vendor_bill.paid_amount
                
                # Update payment status
                if vendor_bill.balance <= 0 and vendor_bill.paid_amount > 0:
                    vendor_bill.payment_status = 'PAID'
                    vendor_bill.status = 'PAID'
                elif vendor_bill.paid_amount > 0:
                    vendor_bill.payment_status = 'PARTIAL'
                else:
                    vendor_bill.payment_status = 'UNPAID'
                
                vendor_bill.save(update_fields=['paid_amount', 'balance', 'payment_status', 'status', 'updated_at'])
            
            # Update purchase order status if fully paid
            if grn.payment_status == 'PAID':
                po = grn.purchase_order
                if po.status != 'COMPLETED':
                    po.status = 'BILLED'
                    po.save(update_fields=['status'])
        
        serializer = self.get_serializer(grn)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================== CRM VIEWSETS ====================

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'source', 'business', 'assigned_to']
    search_fields = ['first_name', 'last_name', 'company_name', 'email', 'phone']
    ordering_fields = ['created_at', 'expected_revenue']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Lead.objects.all()
        return Lead.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)
    
    @action(detail=True, methods=['post'])
    def convert_to_opportunity(self, request, pk=None):
        """Convert lead to opportunity"""
        lead = self.get_object()
        if lead.status != 'QUALIFIED':
            return Response(
                {'error': 'Only qualified leads can be converted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create opportunity
        opportunity = Opportunity.objects.create(
            business=lead.business,
            opportunity_number=f"OPP-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            lead=lead,
            title=f"Opportunity for {lead.company_name or lead.first_name + ' ' + lead.last_name}",
            description=lead.notes,
            expected_revenue=lead.expected_revenue,
            probability=lead.probability,
            expected_close_date=lead.expected_close_date,
            assigned_to=lead.assigned_to,
            created_by=request.user
        )
        
        lead.status = 'WON'
        lead.save()
        
        return Response(OpportunitySerializer(opportunity).data)


class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['stage', 'business', 'assigned_to']
    search_fields = ['opportunity_number', 'title']
    ordering_fields = ['created_at', 'expected_revenue', 'expected_close_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Opportunity.objects.all()
        return Opportunity.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business', 'customer']
    search_fields = ['quotation_number']
    ordering_fields = ['created_at', 'quotation_date', 'total_amount']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Quotation.objects.all()
        return Quotation.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.all()
    serializer_class = SalesOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business', 'customer']
    search_fields = ['order_number']
    ordering_fields = ['created_at', 'order_date', 'total_amount']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return SalesOrder.objects.all()
        return SalesOrder.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class DeliveryNoteViewSet(viewsets.ModelViewSet):
    queryset = DeliveryNote.objects.all()
    serializer_class = DeliveryNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business', 'sales_order']
    search_fields = ['delivery_note_number']
    ordering_fields = ['created_at', 'delivery_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return DeliveryNote.objects.all()
        return DeliveryNote.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class CRMActivityViewSet(viewsets.ModelViewSet):
    queryset = CRMActivity.objects.all()
    serializer_class = CRMActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activity_type', 'status', 'business', 'assigned_to']
    search_fields = ['subject']
    ordering_fields = ['created_at', 'scheduled_datetime']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return CRMActivity.objects.all()
        return CRMActivity.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


# ==================== FIXED ASSETS VIEWSETS ====================

class AssetCategoryViewSet(viewsets.ModelViewSet):
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'depreciation_method']
    search_fields = ['name']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return AssetCategory.objects.all()
        return AssetCategory.objects.filter(business=user.business)


class FixedAssetViewSet(viewsets.ModelViewSet):
    queryset = FixedAsset.objects.all()
    serializer_class = FixedAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business', 'category', 'department']
    search_fields = ['asset_number', 'name', 'serial_number']
    ordering_fields = ['created_at', 'purchase_date', 'current_book_value']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return FixedAsset.objects.all()
        return FixedAsset.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get asset summary"""
        queryset = self.get_queryset()
        return Response({
            'total_assets': queryset.count(),
            'total_value': queryset.aggregate(total=Sum('current_book_value'))['total'] or 0,
            'by_status': queryset.values('status').annotate(count=Count('id')),
            'by_category': queryset.values('category__name').annotate(count=Count('id'))
        })


class AssetDepreciationViewSet(viewsets.ModelViewSet):
    queryset = AssetDepreciation.objects.all()
    serializer_class = AssetDepreciationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['asset', 'is_posted']
    ordering_fields = ['period_start_date']


class AssetMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = AssetMaintenance.objects.all()
    serializer_class = AssetMaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'maintenance_type', 'asset']
    search_fields = ['maintenance_number']
    ordering_fields = ['created_at', 'scheduled_date']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ==================== HR VIEWSETS ====================

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['business', 'is_active', 'is_statutory']
    search_fields = ['name', 'code']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return LeaveType.objects.all()
        return LeaveType.objects.filter(business=user.business)


class LeaveApplicationViewSet(viewsets.ModelViewSet):
    queryset = LeaveApplication.objects.all()
    serializer_class = LeaveApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employee', 'leave_type']
    search_fields = ['application_number']
    ordering_fields = ['created_at', 'from_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return LeaveApplication.objects.all()
        # Employee can see their own applications
        if hasattr(user, 'employee_profile'):
            return LeaveApplication.objects.filter(
                Q(employee__business=user.business) |
                Q(employee__user=user)
            )
        return LeaveApplication.objects.filter(employee__business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve leave application"""
        application = self.get_object()
        if application.status != 'PENDING':
            return Response(
                {'error': 'Only pending applications can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = 'APPROVED'
        application.approved_by = request.user
        application.approved_at = timezone.now()
        application.save()
        
        # Update leave allocation
        allocation = LeaveAllocation.objects.get(
            employee=application.employee,
            leave_type=application.leave_type,
            year=application.from_date.year
        )
        allocation.used_days += application.number_of_days
        allocation.balance_days -= application.number_of_days
        allocation.save()
        
        return Response(LeaveApplicationSerializer(application).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject leave application"""
        application = self.get_object()
        reason = request.data.get('reason', '')
        
        application.status = 'REJECTED'
        application.rejection_reason = reason
        application.save()
        
        return Response(LeaveApplicationSerializer(application).data)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['employee', 'date', 'status']
    ordering_fields = ['date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return AttendanceRecord.objects.all()
        if hasattr(user, 'employee_profile'):
            return AttendanceRecord.objects.filter(
                Q(employee__business=user.business) |
                Q(employee__user=user)
            )
        return AttendanceRecord.objects.filter(employee__business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create attendance records"""
        records = request.data.get('records', [])
        created_records = []
        
        for record_data in records:
            serializer = self.get_serializer(data=record_data)
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                created_records.append(serializer.data)
        
        return Response(created_records)


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.all()
    serializer_class = PerformanceReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employee', 'cycle']
    search_fields = ['review_number']
    ordering_fields = ['created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return PerformanceReview.objects.all()
        return PerformanceReview.objects.filter(employee__business=user.business)


class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business', 'department']
    search_fields = ['job_number', 'title']
    ordering_fields = ['created_at', 'posted_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return JobPosting.objects.all()
        return JobPosting.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'job_posting']
    search_fields = ['application_number', 'first_name', 'last_name', 'email']
    ordering_fields = ['application_date']


class TrainingProgramViewSet(viewsets.ModelViewSet):
    queryset = TrainingProgram.objects.all()
    serializer_class = TrainingProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['business', 'is_mandatory']
    search_fields = ['program_code', 'name']
    ordering_fields = ['created_at', 'start_date']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return TrainingProgram.objects.all()
        return TrainingProgram.objects.filter(business=user.business)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, business=self.request.user.business)


# Continue in next message...

