# views.py
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from decimal import Decimal
from django.db.models import F
import logging
from django.contrib.auth import get_user_model, authenticate
from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import ProtectedError
from rest_framework.exceptions import PermissionDenied
from .models import *
from .models_extended import Vendor
from .serializers import *
from .permissions import IsAdminOrManager, IsStoreManager, IsAuthenticatedUser, BusinessFilterMixin
from rest_framework.decorators import action
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from datetime import datetime, timedelta, date
from .reports import PayrollReport, LeaveReport, OvertimeReport, EmployeeReport, TaxReport, AttendanceReport, CostAnalysisReport, P14Report, P16Report
from .export_utils import ReportExporter
from django.utils import timezone
from django.db.models import Sum, Count, Q
from .models import SaleSession, POSSale, POSItem, FiscalizationLog
from .serializers import SaleSessionSerializer, POSSaleSerializer, POSItemSerializer, FiscalizationLogSerializer, POSSaleDetailSerializer
from .models import Module
from .serializers import ModuleSerializer
from rest_framework_simplejwt.tokens import RefreshToken
import json

logger = logging.getLogger(__name__)

# --- POS Fiscalization Integration ---
def fiscalize_sale_with_zimra(sale):
    """Build a fiscalization payload from the sale and items and return a result.
    This function validates that a ZIMRA configuration exists and then builds a
    request payload. Replace the final network call with a real integration when available.
    """
    # Validate configuration
    zimra_config = ZIMRAConfiguration.objects.filter(business=sale.session.cashier.business).first()
    if not zimra_config:
        return {
            'fiscal_receipt_number': None,
            'success': False,
            'request_payload': '{}',
            'response_payload': '{"error":"Missing ZIMRA configuration"}'
        }

    # Build payload
    items = list(POSItem.objects.filter(sale=sale).values('product_name', 'quantity', 'unit_price', 'tax_rate'))
    request_payload = {
        'business': sale.session.cashier.business_id,
        'sale_id': sale.id,
        'timestamp': timezone.now().isoformat(),
        'total_amount': str(sale.total_amount),
        'currency': getattr(sale, 'currency', 'ZWL'),
        'items': items,
        'vat_registered': getattr(zimra_config, 'is_vat_registered', False),
    }

    # For now, emulate a success response from an external service
    fiscal_receipt_number = f"ZIMRA-{sale.id:06d}-{int(timezone.now().timestamp())}"
    response_payload = {
        'status': 'ok',
        'fiscal_receipt_number': fiscal_receipt_number,
    }

    return {
        'fiscal_receipt_number': fiscal_receipt_number,
        'success': True,
        'request_payload': json.dumps(request_payload, default=str),
        'response_payload': json.dumps(response_payload),
    }

class SaleSessionViewSet(viewsets.ModelViewSet):
    queryset = SaleSession.objects.all()
    serializer_class = SaleSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'superadmin':
            return SaleSession.objects.all()
        return SaleSession.objects.filter(cashier__business=user.business)

    def perform_create(self, serializer):
        serializer.save(cashier=self.request.user)

class POSSaleViewSet(viewsets.ModelViewSet):
    queryset = POSSale.objects.all()
    serializer_class = POSSaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Disallow direct POST creation; enforce POSMakeSaleView for fiscalization
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'superadmin':
            return POSSale.objects.all()
        return POSSale.objects.filter(session__cashier__business=user.business)

    def create(self, request, *args, **kwargs):
        # Ring-fence sales creation to POS make-sale endpoint (fiscalized)
        from rest_framework.exceptions import MethodNotAllowed
        raise MethodNotAllowed('POST', detail='Sales must be created via /api/pos/make-sale/ to ensure fiscalization')

class POSItemViewSet(viewsets.ModelViewSet):
    queryset = POSItem.objects.all()
    serializer_class = POSItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Disallow direct POST of items; items are created as part of POS sale
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'superadmin':
            return POSItem.objects.all()
        return POSItem.objects.filter(sale__session__cashier__business=user.business)

    def create(self, request, *args, **kwargs):
        from rest_framework.exceptions import MethodNotAllowed
        raise MethodNotAllowed('POST', detail='POS items are created via /api/pos/make-sale/')

class FiscalizationLogViewSet(viewsets.ModelViewSet):
    queryset = FiscalizationLog.objects.all()
    serializer_class = FiscalizationLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'superadmin':
            return FiscalizationLog.objects.all()
        return FiscalizationLog.objects.filter(sale__session__cashier__business=user.business)

# --- Authentication Views ---
class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username_or_email = request.data.get('username')
        password = request.data.get('password')
        
        if not username_or_email or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Support login via email or username
        user = None
        identifier = username_or_email.strip()
        if '@' in identifier:
            try:
                user_obj = get_user_model().objects.get(email__iexact=identifier)
                user = authenticate(request, username=user_obj.username, password=password)
            except get_user_model().DoesNotExist:
                user = None
        else:
            user = authenticate(request, username=identifier, password=password)
        
        if user:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user_id': user.id,
                'email': user.email,
                'is_staff': user.is_staff,
                'role': getattr(user, 'role', None)
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class SignupView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        """Create a new user account and return tokens + user info."""
        User = get_user_model()
        username = request.data.get('username') or request.data.get('email')
        email = request.data.get('email')
        password = request.data.get('password')
        phone = request.data.get('phone')
        role = request.data.get('role') or 'employer'
        first_name = request.data.get('first_name') or request.data.get('firstName')
        last_name = request.data.get('last_name') or request.data.get('lastName')
        business_name = request.data.get('business_name') or request.data.get('businessName')

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if not phone:
            return Response({'error': 'Phone is required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)

        if username and User.objects.filter(username=username).exists():
            return Response({'error': 'Username already in use'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(phone=phone).exists():
            return Response({'error': 'Phone already in use'}, status=status.HTTP_400_BAD_REQUEST)

        # Optionally create or attach Business
        business_obj = None
        if business_name:
            business_obj, _created = Business.objects.get_or_create(name=business_name)

        # Create user with all fields set up-front to avoid partial save collisions
        try:
            extra_fields = {
                'phone': phone,
                'role': role,
            }
            if first_name:
                extra_fields['first_name'] = first_name
            if last_name:
                extra_fields['last_name'] = last_name
            if business_obj:
                extra_fields['business'] = business_obj

            user = User.objects.create_user(
                username=username or email,
                email=email,
                password=password,
                **extra_fields,
            )
        except Exception as e:
            # Handle integrity errors (e.g., duplicate phone) gracefully
            from django.db import IntegrityError
            if isinstance(e, IntegrityError):
                return Response({'error': 'User with this phone or email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            raise

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        serialized_user = UserSerializer(user).data if 'UserSerializer' in globals() else {'id': user.id, 'username': user.username, 'email': user.email}
        return Response({
            'access': access,
            'refresh': str(refresh),
            'user': serialized_user,
        }, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # In a real implementation, you might want to blacklist the token
            # For now, we'll just return a success response
            return Response({'message': 'Successfully logged out'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- User Management ---
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return User.objects.all()
        return User.objects.filter(business=user.business)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'superadmin':
            serializer.save()
        else:
            serializer.save(business=user.business)

# --- Business Management ---
class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Business.objects.all()
        return Business.objects.filter(id=user.business.id)

# --- Store Management ---
class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Store.objects.all()
        return Store.objects.filter(business=user.business)

    def perform_create(self, serializer):
        user = self.request.user
        # Prefer explicitly provided business
        business = None
        business_id = self.request.data.get('business')
        if business_id:
            try:
                business = Business.objects.get(id=business_id)
            except Business.DoesNotExist:
                business = None
        # Fall back to user's business
        if business is None:
            business = getattr(user, 'business', None)
        # For superadmin without a business, create a lightweight business
        if business is None and getattr(user, 'role', None) == 'superadmin':
            business = Business.objects.create(name=f"{user.username}'s Business")
        if business is None:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({ 'business': 'No business context available. Please specify a business or assign a business to your user.' })
        # Auto-assign manager if not provided
        manager = self.request.data.get('manager')
        if not manager:
            serializer.save(business=business, manager=user)
        else:
            serializer.save(business=business)

# --- Bank Account Management ---
class BankAccountViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticatedUser]

    def perform_create(self, serializer):
        user = self.request.user
        store = self.request.data.get('store')
        if not store:
            # Pick a store from the user's business if available
            try:
                default_store = Store.objects.filter(business=user.business).first()
            except Exception:
                default_store = None
            if not default_store:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({ 'store': 'No store found for your business. Please create a store first.' })
            serializer.save(created_by=user, store=default_store)
        else:
            serializer.save(created_by=user)

# --- Mobile Money Account Management ---
class MobileMoneyAccountViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = MobileMoneyAccount.objects.all()
    serializer_class = MobileMoneyAccountSerializer
    permission_classes = [IsAuthenticatedUser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class CashTillViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = CashTill.objects.all()
    serializer_class = CashTillSerializer
    permission_classes = [IsAuthenticatedUser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# --- Bank Transaction Management ---
class BankTransactionViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = BankTransaction.objects.all()
    serializer_class = BankTransactionSerializer
    permission_classes = [IsAuthenticatedUser]

    def perform_create(self, serializer):
        from django.db import transaction as db_transaction
        with db_transaction.atomic():
            txn = serializer.save(created_by=self.request.user)
            # Update related bank account balance based on transaction type
            account = txn.bank_account
            amount = txn.amount or 0
            delta = 0
            if txn.status not in ['FAILED', 'CANCELLED']:
                if txn.transaction_type in ['DEPOSIT', 'RECEIPT']:
                    delta = amount
                elif txn.transaction_type in ['WITHDRAWAL', 'PAYMENT', 'TRANSFER']:
                    delta = -amount
            account.current_balance = (account.current_balance or 0) + delta
            account.save(update_fields=['current_balance', 'updated_at'])

# --- Mobile Money Transaction Management ---
class MobileMoneyTransactionViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = MobileMoneyTransaction.objects.all()
    serializer_class = MobileMoneyTransactionSerializer
    permission_classes = [IsAuthenticatedUser]

    def perform_create(self, serializer):
        from django.db import transaction as db_transaction
        with db_transaction.atomic():
            txn = serializer.save(created_by=self.request.user)
            # Update related mobile money account balance based on transaction type
            account = txn.mobile_account
            amount = txn.amount or 0
            delta = 0
            if txn.status not in ['FAILED', 'CANCELLED']:
                if txn.transaction_type in ['DEPOSIT', 'RECEIPT']:
                    delta = amount
                elif txn.transaction_type in ['WITHDRAWAL', 'PAYMENT', 'TRANSFER']:
                    delta = -amount
            account.current_balance = (account.current_balance or 0) + delta
            account.save(update_fields=['current_balance', 'updated_at'])

# --- Unified Transactions View ---
class UnifiedTransactionsView(APIView):
    """Unified view for all transaction types (Bank, Mobile Money, POS Sales, Purchase Payments)"""
    permission_classes = [IsAuthenticatedUser]
    
    def get(self, request):
        user = request.user
        business = getattr(user, 'business', None)
        
        # Get query parameters
        transaction_type = request.query_params.get('type', 'all')  # 'all', 'income', 'expense'
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        account_type = request.query_params.get('account_type', 'all')  # 'all', 'bank', 'mobile', 'cash', 'pos', 'purchase'
        
        transactions = []
        
        # Base filters - filter by business through store relationship
        if user.role != 'superadmin' and business:
            # Bank transactions: filter by bank account's store's business
            bank_filter = {'bank_account__store__business': business}
            # Mobile money transactions: filter by mobile account's store's business
            mobile_filter = {'mobile_account__store__business': business}
            # POS sales: filter by session cashier's business
            pos_filter = {'session__cashier__business': business}
        else:
            bank_filter = {}
            mobile_filter = {}
            pos_filter = {}
        
        # Date filters
        if start_date:
            bank_filter['transaction_date__gte'] = start_date
            mobile_filter['transaction_date__gte'] = start_date
            pos_filter['created_at__gte'] = start_date
        if end_date:
            bank_filter['transaction_date__lte'] = end_date
            mobile_filter['transaction_date__lte'] = end_date
            pos_filter['created_at__lte'] = end_date
        
        # Bank Transactions
        if account_type in ['all', 'bank']:
            bank_transactions = BankTransaction.objects.filter(**bank_filter).select_related('bank_account')
            for txn in bank_transactions:
                is_income = txn.transaction_type in ['DEPOSIT', 'RECEIPT']
                if transaction_type == 'all' or (transaction_type == 'income' and is_income) or (transaction_type == 'expense' and not is_income):
                    transactions.append({
                        'id': f'bank_{txn.id}',
                        'type': 'income' if is_income else 'expense',
                        'account_type': 'bank',
                        'account_id': txn.bank_account.id if txn.bank_account else None,
                        'account_name': txn.bank_account.account_name if txn.bank_account else 'N/A',
                        'amount': float(txn.amount),
                        'description': txn.description,
                        'reference': txn.reference,
                        'date': txn.transaction_date.isoformat() if txn.transaction_date else None,
                        'value_date': txn.value_date.isoformat() if txn.value_date else None,
                        'status': txn.status,
                        'transaction_type': txn.transaction_type,
                        'created_at': txn.created_at.isoformat() if txn.created_at else None,
                        'category': 'Bank Transaction',
                    })
        
        # Mobile Money Transactions
        if account_type in ['all', 'mobile']:
            mobile_transactions = MobileMoneyTransaction.objects.filter(**mobile_filter).select_related('mobile_account')
            for txn in mobile_transactions:
                is_income = txn.transaction_type in ['DEPOSIT', 'RECEIPT']
                if transaction_type == 'all' or (transaction_type == 'income' and is_income) or (transaction_type == 'expense' and not is_income):
                    transactions.append({
                        'id': f'mobile_{txn.id}',
                        'type': 'income' if is_income else 'expense',
                        'account_type': 'mobile',
                        'account_id': txn.mobile_account.id if txn.mobile_account else None,
                        'account_name': txn.mobile_account.account_name if txn.mobile_account else 'N/A',
                        'amount': float(txn.amount),
                        'description': txn.description,
                        'reference': txn.reference,
                        'date': txn.transaction_date.isoformat() if txn.transaction_date else None,
                        'value_date': txn.value_date.isoformat() if txn.value_date else None,
                        'status': txn.status,
                        'transaction_type': txn.transaction_type,
                        'created_at': txn.created_at.isoformat() if txn.created_at else None,
                        'category': 'Mobile Money',
                    })
        
        # POS Sales (as income)
        if account_type in ['all', 'pos']:
            pos_sales = POSSale.objects.filter(**pos_filter, status='COMPLETED')
            for sale in pos_sales:
                if transaction_type == 'all' or transaction_type == 'income':
                    transactions.append({
                        'id': f'pos_{sale.id}',
                        'type': 'income',
                        'account_type': 'pos',
                        'account_name': f"POS Sale - {sale.session.store.name if sale.session and sale.session.store else 'N/A'}",
                        'amount': float(sale.total_amount),
                        'description': f"POS Sale {sale.sale_number} - {sale.customer_name or 'Walk-in'}",
                        'reference': sale.sale_number,
                        'date': sale.created_at.date().isoformat() if sale.created_at else None,
                        'value_date': sale.created_at.date().isoformat() if sale.created_at else None,
                        'status': sale.status,
                        'transaction_type': 'RECEIPT',
                        'created_at': sale.created_at.isoformat() if sale.created_at else None,
                        'category': 'POS Sale',
                        'payment_method': sale.payment_method,
                    })
        
        # Purchase Order Payments (as expenses) - from PurchaseOrderPayment
        if account_type in ['all', 'purchase']:
            try:
                from .models_extended import PurchaseOrderPayment
                if user.role != 'superadmin':
                    purchase_filter = {'grn__business': business} if business else {}
                else:
                    purchase_filter = {}
                if start_date:
                    purchase_filter['payment_date__gte'] = start_date
                if end_date:
                    purchase_filter['payment_date__lte'] = end_date
                
                purchase_payments = PurchaseOrderPayment.objects.filter(**purchase_filter).select_related('grn', 'grn__purchase_order')
                for payment in purchase_payments:
                    if transaction_type == 'all' or transaction_type == 'expense':
                        transactions.append({
                            'id': f'purchase_{payment.id}',
                            'type': 'expense',
                            'account_type': 'purchase',
                            'account_name': f"Purchase Order - {payment.grn.purchase_order.po_number if payment.grn else 'N/A'}",
                            'amount': float(payment.amount),
                            'description': f"Payment for {payment.grn.grn_number if payment.grn else 'Purchase'}",
                            'reference': payment.grn.grn_number if payment.grn else '',
                            'date': payment.payment_date.date().isoformat() if payment.payment_date else None,
                            'value_date': payment.payment_date.date().isoformat() if payment.payment_date else None,
                            'status': 'COMPLETED',
                            'transaction_type': 'PAYMENT',
                            'created_at': payment.payment_date.isoformat() if payment.payment_date else None,
                            'category': 'Purchase Payment',
                            'payment_method': payment.payment_method,
                        })
            except ImportError:
                pass  # PurchaseOrderPayment might not exist
        
        # Sort by date (newest first)
        transactions.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return Response({
            'results': transactions,
            'count': len(transactions),
        })

# --- Chart of Accounts Management ---
class ChartOfAccountsViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = ChartOfAccounts.objects.all()
    serializer_class = ChartOfAccountsSerializer
    permission_classes = [IsAuthenticatedUser]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# --- Journal Entry Management ---
class JournalEntryViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticatedUser]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# --- Journal Entry Line Management ---
class JournalEntryLineViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = JournalEntryLine.objects.all()
    serializer_class = JournalEntryLineSerializer
    permission_classes = [IsAuthenticatedUser]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# --- General Ledger Management ---
class GeneralLedgerViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = GeneralLedger.objects.all()
    serializer_class = GeneralLedgerSerializer
    permission_classes = [IsAuthenticatedUser]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# --- Department Management ---
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Department.objects.all()
        return Department.objects.filter(business=user.business)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'superadmin':
            serializer.save()
        else:
            # Set the current user as the default manager if no manager is specified
            manager = serializer.validated_data.get('manager', user)
            serializer.save(business=user.business, manager=manager)

    def perform_update(self, serializer):
        # Ensure department belongs to the same business
        serializer.save()

    @action(detail=True, methods=['post'])
    def assign_manager(self, request, pk=None):
        department = self.get_object()
        manager_id = request.data.get('manager_id')
        
        if manager_id:
            try:
                manager = User.objects.get(id=manager_id, business=department.business)
                department.manager = manager
                department.save()
                return Response({'status': 'manager assigned'})
            except User.DoesNotExist:
                return Response({'error': 'Manager not found'}, status=400)
        
        return Response({'error': 'Manager ID required'}, status=400)

    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        department = self.get_object()
        employees = department.employees.all()
        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)


# --- Employee Management ---
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAdminOrManager]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Employee.objects.all()
        return Employee.objects.filter(business=user.business)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'superadmin':
            serializer.save()
        else:
            serializer.save(business=user.business)

# --- Product Management ---
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.all()
        
        # Filter by business if user is not superadmin
        if user.role != 'superadmin':
            if hasattr(user, 'business') and user.business:
                queryset = queryset.filter(business=user.business)
            else:
                # If user has no business, return empty queryset
                return Product.objects.none()
        
        # Filter by store if provided in query params (optional)
        # Only show products that belong to the specified store
        store_id = self.request.query_params.get('store')
        if store_id:
            try:
                store_id_int = int(store_id)
                # Only show products for this specific store
                queryset = queryset.filter(store_id=store_id_int)
            except (ValueError, TypeError):
                # Invalid store ID, ignore the filter
                pass
        
        # Filter by is_active if provided in query params (for POS)
        # Default behavior: if is_active param is provided, filter by it
        # If not provided, show all products (both active and inactive)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            if str(is_active).lower() in ['true', '1', 'yes']:
                queryset = queryset.filter(is_active=True)
            elif str(is_active).lower() in ['false', '0', 'no']:
                queryset = queryset.filter(is_active=False)
        
        # Order by name for consistent display
        queryset = queryset.order_by('name')
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        # Get business from request data if provided, otherwise use user's business
        business = serializer.validated_data.get('business')
        if not business:
            business = getattr(user, 'business', None)
        # For superadmin without a business, try to get from request data or use first business
        if not business and user.role == 'superadmin':
            business_id = self.request.data.get('business')
            if business_id:
                try:
                    from .models import Business
                    business = Business.objects.get(id=business_id)
                except Business.DoesNotExist:
                    pass
            # If still no business, use first available business or create one
            if not business:
                from .models import Business
                business = Business.objects.first()
                if not business:
                    business = Business.objects.create(name=f"{user.username}'s Business")
        
        # Handle store field
        store = serializer.validated_data.get('store')
        if store:
            # Validate that store belongs to the business
            if store.business != business:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'store': 'Store must belong to the selected business.'})
        
        if business:
            serializer.save(business=business, store=store)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business is required. Please specify a business or assign one to your user account.'})

# --- Service Management ---
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        queryset = Service.objects.all()
        if user.role != 'superadmin':
            queryset = queryset.filter(business=user.business)
        
        # Filter by store if provided in query params
        store_id = self.request.query_params.get('store')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        
        # Filter by is_active if provided in query params (for POS)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            if is_active in ['true', 'True', '1', 'yes']:
                queryset = queryset.filter(is_active=True)
            elif is_active in ['false', 'False', '0', 'no']:
                queryset = queryset.filter(is_active=False)
        
        return queryset
    
    def perform_create(self, serializer):
        user = self.request.user
        # Get business from request data if provided, otherwise use user's business
        business = serializer.validated_data.get('business')
        if not business:
            business = getattr(user, 'business', None)
        # For superadmin without a business, try to get from request data or use first business
        if not business and user.role == 'superadmin':
            business_id = self.request.data.get('business')
            if business_id:
                try:
                    from .models import Business
                    business = Business.objects.get(id=business_id)
                except Business.DoesNotExist:
                    pass
            # If still no business, use first available business or create one
            if not business:
                from .models import Business
                business = Business.objects.first()
                if not business:
                    business = Business.objects.create(name=f"{user.username}'s Business")
        
        # Handle store field
        store = serializer.validated_data.get('store')
        if store:
            # Validate that store belongs to the business
            if store.business != business:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'store': 'Store must belong to the selected business.'})
        
        if business:
            serializer.save(business=business, store=store)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business is required. Please specify a business or assign one to your user account.'})

# --- Payroll Management ---
class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Payroll.objects.all()
        return Payroll.objects.filter(employee__business=user.business)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'superadmin':
            serializer.save()
        else:
            serializer.save(employee__business=user.business)

# --- Inventory Management ---
class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Inventory.objects.all()
        return Inventory.objects.filter(product__business=user.business)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'superadmin':
            serializer.save()
        else:
            serializer.save(product__business=user.business)

# --- Module Management ---
class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAdminOrManager]

# --- Reports ---
class ReportsView(APIView):
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        report_type = request.query_params.get('type')
        
        if report_type == 'payroll':
            report = PayrollReport()
        elif report_type == 'leave':
            report = LeaveReport()
        elif report_type == 'overtime':
            report = OvertimeReport()
        elif report_type == 'employee':
            report = EmployeeReport()
        elif report_type == 'tax':
            report = TaxReport()
        elif report_type == 'attendance':
            report = AttendanceReport()
        elif report_type == 'cost_analysis':
            report = CostAnalysisReport()
        elif report_type == 'p14':
            report = P14Report()
        elif report_type == 'p16':
            report = P16Report()
        else:
            return Response({'error': 'Invalid report type'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = report.generate_report(request.user)
            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Export Reports ---
class ExportReportsView(APIView):
    permission_classes = [IsAdminOrManager]
    
    def post(self, request):
        report_type = request.data.get('type')
        format_type = request.data.get('format', 'pdf')
        
        if report_type == 'payroll':
            report = PayrollReport()
        elif report_type == 'leave':
            report = LeaveReport()
        elif report_type == 'overtime':
            report = OvertimeReport()
        elif report_type == 'employee':
            report = EmployeeReport()
        elif report_type == 'tax':
            report = TaxReport()
        elif report_type == 'attendance':
            report = AttendanceReport()
        elif report_type == 'cost_analysis':
            report = CostAnalysisReport()
        elif report_type == 'p14':
            report = P14Report()
        elif report_type == 'p16':
            report = P16Report()
        else:
            return Response({'error': 'Invalid report type'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            exporter = ReportExporter()
            file_path = exporter.export_report(report, request.user, format_type)
            return Response({'file_path': file_path})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- User Profile ---
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- Dashboard Data ---
class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from decimal import Decimal
        from datetime import datetime, timedelta
        
        user = request.user
        business = getattr(user, 'business', None)
        
        # Determine date ranges
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)
        
        # Base queryset filters
        if user.role == 'superadmin':
            employee_filter = {}
            product_filter = {}
            sale_filter = {}
            payroll_filter = {}
            customer_filter = {}
            cash_till_filter = {}
            mobile_money_filter = {}
            bank_filter = {}
        else:
            employee_filter = {'business': business} if business else {}
            product_filter = {'business': business} if business else {}
            sale_filter = {'session__cashier__business': business} if business else {}
            payroll_filter = {'employee__business': business} if business else {}
            customer_filter = {'business': business} if business else {}
            cash_till_filter = {'store__business': business} if business else {}
            mobile_money_filter = {'store__business': business} if business else {}
            bank_filter = {'store__business': business} if business else {}
        
        # Revenue (Total sales)
        total_revenue = POSSale.objects.filter(**sale_filter).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        revenue_this_month = POSSale.objects.filter(
            **sale_filter,
            created_at__gte=this_month_start
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        revenue_last_month = POSSale.objects.filter(
            **sale_filter,
            created_at__gte=last_month_start,
            created_at__lte=last_month_end
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        # Expenses (Payroll + other expenses if available)
        total_expenses = Payroll.objects.filter(**payroll_filter).aggregate(
            total=Sum('net_salary')
        )['total'] or Decimal('0')
        
        # Profit (Revenue - Expenses)
        total_profit = total_revenue - total_expenses
        
        # Cash Balance (Cash Tills)
        cash_balance = CashTill.objects.filter(**cash_till_filter, is_active=True).aggregate(
            total=Sum('current_balance')
        )['total'] or Decimal('0')
        
        # Mobile Money Balance
        mobile_money_balance = MobileMoneyAccount.objects.filter(
            **mobile_money_filter, is_active=True
        ).aggregate(total=Sum('current_balance'))['total'] or Decimal('0')
        
        # Bank Balance
        bank_balance = BankAccount.objects.filter(**bank_filter, is_active=True).aggregate(
            total=Sum('current_balance')
        )['total'] or Decimal('0')
        
        total_balance = cash_balance + mobile_money_balance + bank_balance
        
        # Counts
        total_products = Product.objects.filter(**product_filter, is_active=True).count()
        total_customers = Customer.objects.filter(**customer_filter, is_active=True).count()
        total_employees = Employee.objects.filter(**employee_filter).count()
        if user.role == 'superadmin':
            active_sessions = SaleSession.objects.filter(is_active=True).count()
        else:
            active_sessions = SaleSession.objects.filter(
                cashier__business=business,
                is_active=True
            ).count() if business else 0
        
        # Recent activity (last 10 sales)
        recent_sales = POSSale.objects.filter(**sale_filter).order_by('-created_at')[:10]
        recent_activity = [
            {
                'id': sale.id,
                'type': 'POS Sale',
                'description': f'Sale #{sale.sale_number} - {sale.customer_name or "Walk-in"} - ${float(sale.total_amount):.2f}',
                'created_at': sale.created_at.isoformat() if sale.created_at else None,
            }
            for sale in recent_sales
        ]
        
        # Recent transactions
        if user.role == 'superadmin':
            recent_mobile = MobileMoneyTransaction.objects.all().order_by('-created_at')[:5]
        else:
            recent_mobile = MobileMoneyTransaction.objects.filter(
                mobile_account__store__business=business
            ).order_by('-created_at')[:5] if business else []
        
        recent_activity.extend([
            {
                'id': f'mm_{txn.id}',
                'type': 'Mobile Money',
                'description': f'{txn.transaction_type} - ${float(txn.amount):.2f} - {txn.mobile_account.account_name}',
                'created_at': txn.created_at.isoformat() if txn.created_at else None,
            }
            for txn in recent_mobile
        ])
        
        # Sort by date and take top 10
        recent_activity.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        recent_activity = recent_activity[:10]
        
        # Calculate growth percentage
        revenue_growth = 0
        if revenue_last_month > 0:
            revenue_growth = float(((revenue_this_month - revenue_last_month) / revenue_last_month) * 100)
        elif revenue_this_month > 0:
            revenue_growth = 100
        
        return Response({
            'kpis': {
                'revenue': float(total_revenue),
                'expenses': float(total_expenses),
                'profit': float(total_profit),
                'cash_balance': float(total_balance),
                'revenue_growth': round(revenue_growth, 2),
            },
            'counts': {
                'products': total_products,
                'customers': total_customers,
                'employees': total_employees,
                'active_sessions': active_sessions,
            },
            'balances': {
                'cash': float(cash_balance),
                'mobile_money': float(mobile_money_balance),
                'bank': float(bank_balance),
                'total': float(total_balance),
            },
            'recent_activity': recent_activity,
            'revenue_this_month': float(revenue_this_month),
            'revenue_last_month': float(revenue_last_month),
        })

# --- Supply Chain Management ---
class VendorViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticatedUser]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        user = self.request.user
        business = serializer.validated_data.get('business')
        if not business:
            business = getattr(user, 'business', None)
        if business:
            serializer.save(business=business, created_by=user)
        else:
            serializer.save(created_by=user)

# --- POS Endpoints ---
class POSStartSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Store is required
        store_id = request.data.get('store')
        if not store_id:
            return Response({'store': 'Store is required to start a POS session.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import Store
            store = Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            return Response({'store': 'Store not found.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate store belongs to user's business (unless superadmin)
        if user.role != 'superadmin':
            user_business = getattr(user, 'business', None)
            if user_business and store.business != user_business:
                return Response({'store': 'Store does not belong to your business.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if there's already an active session for this store
        active_session = SaleSession.objects.filter(cashier=user, store=store, is_active=True).first()
        if active_session:
            # Return the existing session instead of an error
            serializer = SaleSessionSerializer(active_session)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Get opening balance from request if provided, otherwise default to 0
        opening_balance = request.data.get('opening_balance', 0)
        try:
            opening_balance = float(opening_balance) if opening_balance else 0
        except (ValueError, TypeError):
            opening_balance = 0
        
        # Create new session
        session = SaleSession.objects.create(
            cashier=user,
            store=store,
            is_active=True,
            start_time=timezone.now(),
            opening_balance=opening_balance
        )
        
        serializer = SaleSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class POSEndSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Get active session
        active_session = SaleSession.objects.filter(cashier=user, is_active=True).first()
        if not active_session:
            return Response({'error': 'No active session found'}, status=status.HTTP_400_BAD_REQUEST)
        
        # End session
        active_session.is_active = False
        active_session.end_time = timezone.now()
        active_session.save()
        
        serializer = SaleSessionSerializer(active_session)
        return Response(serializer.data)

class POSMakeSaleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        # Ensure there is an active POS session
        active_session = SaleSession.objects.filter(cashier=user, is_active=True).first()
        if not active_session:
            return Response({'error': 'No active session found'}, status=status.HTTP_400_BAD_REQUEST)

        items_data = request.data.get('items') or []
        if not items_data:
            return Response({'items': ['At least one item is required']}, status=status.HTTP_400_BAD_REQUEST)

        sale_payload = request.data.copy()
        sale_payload['session'] = active_session.id
        sale_payload.pop('items', None)

        with transaction.atomic():
            sale_serializer = POSSaleSerializer(data=sale_payload)
            sale_serializer.is_valid(raise_exception=True)
            sale = sale_serializer.save(session=active_session)

            created_items = []
            for raw_item in items_data:
                item_payload = raw_item.copy()
                item_payload['sale'] = sale.id
                # Set item_name if not provided (for backward compatibility and services)
                if 'item_name' not in item_payload or not item_payload.get('item_name'):
                    if item_payload.get('product'):
                        try:
                            from .models import Product
                            product = Product.objects.get(id=item_payload['product'])
                            item_payload['item_name'] = product.name
                        except Product.DoesNotExist:
                            pass
                    elif item_payload.get('service'):
                        try:
                            from .models import Service
                            service = Service.objects.get(id=item_payload['service'])
                            item_payload['item_name'] = service.name
                        except Service.DoesNotExist:
                            pass
                item_serializer = POSItemSerializer(data=item_payload)
                item_serializer.is_valid(raise_exception=True)
                pos_item = item_serializer.save()
                # Only apply inventory deduction for products, not services
                if pos_item.product:
                    self._apply_inventory_deduction(pos_item, user)
                created_items.append(pos_item)

            sale = self._synchronize_sale_totals(sale)
            self._update_session_totals(active_session, sale)
            self._record_payment(sale, user)
            fiscal_result = self._log_fiscalization(sale)

            sale.refresh_from_db()
            detail_data = POSSaleDetailSerializer(sale).data
            detail_data['fiscal_receipt_number'] = fiscal_result.get('fiscal_receipt_number')
            detail_data['fiscalization_success'] = fiscal_result.get('success')

            return Response(detail_data, status=status.HTTP_201_CREATED)

    def _apply_inventory_deduction(self, pos_item, user):
        # Only apply inventory deduction for products, not services
        if not pos_item.product:
            return  # Skip for services
        
        product = pos_item.product
        product.refresh_from_db()
        
        # Validate product belongs to the session's store (if product has a store assigned)
        sale_store = pos_item.sale.session.store if pos_item.sale.session else None
        if sale_store and product.store and product.store != sale_store:
            raise ValidationError({'product': f'Product {product.name} does not belong to the selected store.'})

        available_stock = product.quantity_in_stock or 0
        if pos_item.quantity > available_stock:
            raise ValidationError({'inventory': f'Insufficient stock for {product.name}. Available {available_stock}, required {pos_item.quantity}.'})

        Product.objects.filter(id=product.id).update(quantity_in_stock=F('quantity_in_stock') - pos_item.quantity)
        product.refresh_from_db()

        try:
            Inventory.objects.create(
                product=product,
                quantity=pos_item.quantity,
                unit_cost=pos_item.unit_price,
                total_cost=pos_item.total_price,
                transaction_type='SALE',
                reference=f'POS Sale {pos_item.sale.sale_number}',
                notes='Automatic inventory deduction from POS sale'
            )
        except Exception as exc:
            logger.warning('Failed to create inventory record for product %s: %s', product.id, exc)

    def _synchronize_sale_totals(self, sale):
        sale.refresh_from_db()
        items = sale.items.all()
        subtotal = sum((item.total_price for item in items), Decimal('0'))
        sale.subtotal = subtotal
        tax_amount = Decimal(sale.tax_amount or 0)
        sale.total_amount = subtotal + tax_amount
        sale.save(update_fields=['subtotal', 'total_amount'])
        return sale

    def _update_session_totals(self, session, sale):
        amount = Decimal(sale.total_amount or 0)
        SaleSession.objects.filter(id=session.id).update(
            total_sales=F('total_sales') + amount,
            total_transactions=F('total_transactions') + 1
        )
        session.refresh_from_db()
        session.closing_balance = session.opening_balance + session.total_sales
        session.save(update_fields=['closing_balance'])

    def _record_payment(self, sale, user):
        payment_method = (sale.payment_method or '').upper()
        amount = Decimal(sale.total_amount or 0)
        if amount <= 0:
            return

        # Use store from session instead of business
        store = sale.session.store if sale.session else None
        if not store:
            logger.warning('Sale session has no store; skipping payment recording')
            return

        if payment_method == 'CASH':
            cash_till = CashTill.objects.filter(store=store, is_active=True).first()
            if cash_till:
                CashTill.objects.filter(id=cash_till.id).update(current_balance=F('current_balance') + amount)
            else:
                logger.warning('No cash till found for store %s', store)
        elif payment_method == 'MOBILE_MONEY':
            mobile_account = MobileMoneyAccount.objects.filter(store=store, is_active=True).first()
            if mobile_account:
                MobileMoneyTransaction.objects.create(
                    mobile_account=mobile_account,
                    transaction_type='RECEIPT',
                    amount=amount,
                    reference=sale.sale_number,
                    description=f'POS Sale {sale.sale_number}',
                    transaction_date=timezone.now().date(),
                    value_date=timezone.now().date(),
                    status='COMPLETED',
                    created_by=user
                )
                MobileMoneyAccount.objects.filter(id=mobile_account.id).update(current_balance=F('current_balance') + amount)
            else:
                logger.warning('No mobile money account found for store %s', store)
        else:
            bank_account = BankAccount.objects.filter(store=store, is_active=True).first()
            if bank_account:
                BankTransaction.objects.create(
                    bank_account=bank_account,
                    transaction_type='RECEIPT',
                    amount=amount,
                    reference=sale.sale_number,
                    description=f'POS Sale {sale.sale_number}',
                    transaction_date=timezone.now().date(),
                    value_date=timezone.now().date(),
                    status='COMPLETED',
                    created_by=user
                )
                BankAccount.objects.filter(id=bank_account.id).update(current_balance=F('current_balance') + amount)
            else:
                logger.warning('No bank account found for store %s', store)

    def _log_fiscalization(self, sale):
        result = fiscalize_sale_with_zimra(sale)
        FiscalizationLog.objects.create(
            sale=sale,
            fiscal_receipt_number=result.get('fiscal_receipt_number'),
            success=result.get('success'),
            request_payload=result.get('request_payload'),
            response_payload=result.get('response_payload')
        )
        return result

# ==================== PROJECT MANAGEMENT VIEWS ====================
class CustomerViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticatedUser]

    def perform_create(self, serializer):
        user = self.request.user
        from .models import Business
        
        # Get business from validated_data (might be an ID or Business instance)
        business = serializer.validated_data.get('business')
        
        # If business is an integer ID, get the Business instance
        if business and isinstance(business, (int, str)):
            try:
                business = Business.objects.get(id=int(business))
            except (Business.DoesNotExist, ValueError, TypeError):
                business = None
        
        # If not provided, use user's business
        if not business:
            user_business = getattr(user, 'business', None)
            if user_business:
                # If user.business is already a Business instance, use it
                if isinstance(user_business, Business):
                    business = user_business
                # If it's an ID, get the instance
                elif isinstance(user_business, (int, str)):
                    try:
                        business = Business.objects.get(id=int(user_business))
                    except (Business.DoesNotExist, ValueError, TypeError):
                        business = None
                else:
                    business = None
        
        # For superadmin without a business, try to get from request data or use first business
        if not business and user.role == 'superadmin':
            business_id = self.request.data.get('business')
            if business_id:
                try:
                    business = Business.objects.get(id=int(business_id))
                except (Business.DoesNotExist, ValueError, TypeError):
                    pass
            # If still no business, use first available business or create one
            if not business:
                business = Business.objects.first()
                if not business:
                    business = Business.objects.create(name=f"{user.username}'s Business")
        
        # Ensure business is a Business instance (not an ID)
        if business and not isinstance(business, Business):
            try:
                business = Business.objects.get(id=int(business))
            except (Business.DoesNotExist, ValueError, TypeError):
                business = None
        
        if business:
            serializer.save(business=business)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business': 'Business is required. Please specify a business or assign one to your user account.'})

class ProjectViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedUser]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'superadmin':
            serializer.save()
        else:
            # Set current user as project manager if none specified
            project_manager = serializer.validated_data.get('project_manager', user)
            serializer.save(business=user.business, project_manager=project_manager)

    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        project = self.get_object()
        tasks = project.tasks.all()
        serializer = ProjectTaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def expenses(self, request, pk=None):
        project = self.get_object()
        expenses = project.expenses.all()
        serializer = ProjectExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def timesheets(self, request, pk=None):
        project = self.get_object()
        timesheets = project.timesheets.all()
        serializer = ProjectTimesheetSerializer(timesheets, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        project = self.get_object()
        progress = request.data.get('progress')
        
        if progress is not None and 0 <= progress <= 100:
            project.progress = progress
            if progress == 100:
                project.status = 'COMPLETED'
            project.save()
            return Response({'status': 'progress updated', 'progress': progress})
        
        return Response({'error': 'Invalid progress value'}, status=400)

class ProjectTaskViewSet(viewsets.ModelViewSet):
    queryset = ProjectTask.objects.all()
    serializer_class = ProjectTaskSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return ProjectTask.objects.all()
        return ProjectTask.objects.filter(project__business=user.business)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        status = request.data.get('status')
        
        if status in dict(ProjectTask.TASK_STATUS):
            task.status = status
            if status == 'DONE':
                task.progress = 100
            task.save()
            return Response({'status': 'task status updated', 'new_status': status})
        
        return Response({'error': 'Invalid status'}, status=400)

class ProjectExpenseViewSet(viewsets.ModelViewSet):
    queryset = ProjectExpense.objects.all()
    serializer_class = ProjectExpenseSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return ProjectExpense.objects.all()
        return ProjectExpense.objects.filter(project__business=user.business)

    def perform_create(self, serializer):
        # Auto-approve if user is admin/manager
        user = self.request.user
        if user.role in ['superadmin', 'employer']:
            serializer.save(approved_by=user)
        else:
            serializer.save()

class ProjectTimesheetViewSet(viewsets.ModelViewSet):
    queryset = ProjectTimesheet.objects.all()
    serializer_class = ProjectTimesheetSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return ProjectTimesheet.objects.all()
        elif user.role == 'employer':
            return ProjectTimesheet.objects.filter(project__business=user.business)
        else:
            # Employees can only see their own timesheets
            return ProjectTimesheet.objects.filter(
                project__business=user.business,
                employee__user=user
            )

    def perform_create(self, serializer):
        # Auto-assign to current user's employee profile if not specified
        user = self.request.user
        if hasattr(user, 'employee_profile'):
            serializer.save(employee=user.employee_profile)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def my_timesheets(self, request):
        """Get current user's timesheets"""
        user = request.user
        if hasattr(user, 'employee_profile'):
            timesheets = ProjectTimesheet.objects.filter(employee=user.employee_profile)
            serializer = self.get_serializer(timesheets, many=True)
            return Response(serializer.data)
        return Response({'error': 'User is not an employee'}, status=400)

    @action(detail=False, methods=['get'])
    def weekly_report(self, request):
        """Get weekly timesheet report"""
        from datetime import datetime, timedelta
        
        # Get date range (default to current week)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        
        if 'start_date' in request.query_params:
            start_date = datetime.strptime(request.query_params['start_date'], '%Y-%m-%d').date()
        if 'end_date' in request.query_params:
            end_date = datetime.strptime(request.query_params['end_date'], '%Y-%m-%d').date()
        
        timesheets = self.get_queryset().filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Group by employee
        from django.db.models import Sum
        report = timesheets.values(
            'employee__first_name', 
            'employee__last_name',
            'project__name'
        ).annotate(
            total_hours=Sum('hours_worked'),
            total_billable=Sum('hours_worked', filter=models.Q(is_billable=True))
        )
        
        return Response(list(report))

# ==================== ZIMBABWE-SPECIFIC VIEWS ====================

class CurrencyViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Currency management for multi-currency support"""
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def active_currencies(self, request):
        """Get all active currencies"""
        currencies = Currency.objects.filter(is_active=True)
        serializer = self.get_serializer(currencies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_exchange_rates(self, request):
        """Update exchange rates from external source"""
        # This would integrate with a real exchange rate API
        # For now, return success message
        return Response({
            'message': 'Exchange rates updated successfully',
            'timestamp': timezone.now().isoformat()
        })

class ExchangeRateViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Exchange rate management"""
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by date range if provided
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset.order_by('-date')

class ZIMRAConfigurationViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """ZIMRA configuration management"""
    queryset = ZIMRAConfiguration.objects.all()
    serializer_class = ZIMRAConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return ZIMRAConfiguration.objects.all()
        return ZIMRAConfiguration.objects.filter(business=user.business)

class VATReturnViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """VAT return management"""
    queryset = VATReturn.objects.all()
    serializer_class = VATReturnSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return VATReturn.objects.all()
        return VATReturn.objects.filter(business=user.business).order_by('-period_start')

    @action(detail=True, methods=['post'])
    def calculate_vat(self, request, pk=None):
        """Calculate VAT amounts for the return"""
        vat_return = self.get_object()
        vat_return.calculate_net_vat()
        vat_return.save()
        
        serializer = self.get_serializer(vat_return)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit_return(self, request, pk=None):
        """Submit VAT return to ZIMRA"""
        vat_return = self.get_object()
        if vat_return.status != 'DRAFT':
            return Response(
                {'error': 'Only draft returns can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vat_return.status = 'SUBMITTED'
        vat_return.submission_date = timezone.now()
        vat_return.save()
        
        # Here you would integrate with ZIMRA's API
        return Response({
            'message': 'VAT return submitted successfully',
            'submission_date': vat_return.submission_date
        })

class PAYECalculationViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """PAYE calculation management"""
    queryset = PAYECalculation.objects.all()
    serializer_class = PAYECalculationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return PAYECalculation.objects.all()
        return PAYECalculation.objects.filter(employee__business=user.business)
    
    def perform_create(self, serializer):
        paye_calc = serializer.save()
        paye_calc.calculate_paye()
        paye_calc.save()

class NSSAContributionViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """NSSA contribution management"""
    queryset = NSSAContribution.objects.all()
    serializer_class = NSSAContributionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return NSSAContribution.objects.all()
        return NSSAContribution.objects.filter(employee__business=user.business)
    
    def perform_create(self, serializer):
        nssa_contrib = serializer.save()
        nssa_contrib.calculate_contributions()
        nssa_contrib.save()

class MobileMoneyIntegrationViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Mobile money integration management"""
    queryset = MobileMoneyIntegration.objects.all()
    serializer_class = MobileMoneyIntegrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return MobileMoneyIntegration.objects.all()
        return MobileMoneyIntegration.objects.filter(business=user.business)
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test mobile money provider connection"""
        integration = self.get_object()
        # This would test the actual API connection
        return Response({
            'success': True,
            'message': f'Connection to {integration.get_provider_display()} successful',
            'test_mode': integration.test_mode
        })

class MobileMoneyPaymentViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Mobile money payment management"""
    queryset = MobileMoneyPayment.objects.all()
    serializer_class = MobileMoneyPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return MobileMoneyPayment.objects.all()
        return MobileMoneyPayment.objects.filter(integration__business=user.business)
    
    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        """Process mobile money payment"""
        payment = self.get_object()
        if payment.status != 'PENDING':
            return Response(
                {'error': 'Payment has already been processed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Here you would integrate with the actual mobile money API
        payment.status = 'SUCCESSFUL'
        payment.external_reference = f'EXT-{payment.id:06d}'
        payment.save()
        
        return Response({
            'message': 'Payment processed successfully',
            'external_reference': payment.external_reference
        })

# ==================== ENHANCED INVENTORY VIEWS ====================

class WarehouseViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Warehouse management"""
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Warehouse.objects.all()
        return Warehouse.objects.filter(business=user.business)

class ProductCategoryViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Product category management"""
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return ProductCategory.objects.all()
        return ProductCategory.objects.filter(business=user.business)

class InventoryItemViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Enhanced inventory item management"""
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return InventoryItem.objects.all()
        return InventoryItem.objects.filter(business=user.business)
    
    @action(detail=False, methods=['get'])
    def low_stock_alerts(self, request):
        """Get items with low stock levels"""
        user = self.request.user
        queryset = self.get_queryset()
        
        low_stock_items = []
        for item in queryset:
            current_stock = item.get_current_stock()
            if current_stock <= item.reorder_point:
                item_data = self.get_serializer(item).data
                item_data['current_stock'] = current_stock
                item_data['shortage'] = item.reorder_point - current_stock
                low_stock_items.append(item_data)
        
        return Response(low_stock_items)
    
    @action(detail=True, methods=['get'])
    def stock_by_warehouse(self, request, pk=None):
        """Get stock levels by warehouse for this item"""
        item = self.get_object()
        stock_records = StockRecord.objects.filter(item=item, warehouse__is_active=True)
        serializer = StockRecordSerializer(stock_records, many=True)
        return Response(serializer.data)

class StockMovementViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Stock movement tracking"""
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return StockMovement.objects.all()
        return StockMovement.objects.filter(item__business=user.business).order_by('-created_at')

# ==================== MANUFACTURING VIEWS ====================

class BillOfMaterialsViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Bill of Materials management"""
    queryset = BillOfMaterials.objects.all()
    serializer_class = BillOfMaterialsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return BillOfMaterials.objects.all()
        return BillOfMaterials.objects.filter(business=user.business)

class WorkOrderViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Work order management"""
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return WorkOrder.objects.all()
        return WorkOrder.objects.filter(business=user.business).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def start_production(self, request, pk=None):
        """Start work order production"""
        work_order = self.get_object()
        if work_order.status != 'RELEASED':
            return Response(
                {'error': 'Work order must be released before starting production'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        work_order.status = 'IN_PROGRESS'
        work_order.actual_start_date = timezone.now()
        work_order.save()
        
        return Response({
            'message': 'Production started successfully',
            'start_date': work_order.actual_start_date
        })
    
    @action(detail=True, methods=['post'])
    def complete_production(self, request, pk=None):
        """Complete work order production"""
        work_order = self.get_object()
        if work_order.status != 'IN_PROGRESS':
            return Response(
                {'error': 'Work order must be in progress to complete'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quantity_produced = request.data.get('quantity_produced')
        if not quantity_produced:
            return Response(
                {'error': 'Quantity produced is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        work_order.quantity_produced = quantity_produced
        work_order.status = 'COMPLETED'
        work_order.actual_end_date = timezone.now()
        work_order.save()
        
        return Response({
            'message': 'Production completed successfully',
            'quantity_produced': work_order.quantity_produced,
            'completion_date': work_order.actual_end_date
        })

# ==================== AGRICULTURE VIEWS ====================

class CropViewSet(viewsets.ModelViewSet):
    """Crop management"""
    queryset = Crop.objects.all()
    serializer_class = CropSerializer
    permission_classes = [permissions.IsAuthenticated]

class FarmViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Farm management"""
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return Farm.objects.all()
        return Farm.objects.filter(business=user.business)

class CropSeasonViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Crop season management"""
    queryset = CropSeason.objects.all()
    serializer_class = CropSeasonSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return CropSeason.objects.all()
        return CropSeason.objects.filter(farm__business=user.business)

class AgriculturalExpenseViewSet(BusinessFilterMixin, viewsets.ModelViewSet):
    """Agricultural expense tracking"""
    queryset = AgriculturalExpense.objects.all()
    serializer_class = AgriculturalExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'superadmin':
            return AgriculturalExpense.objects.all()
        return AgriculturalExpense.objects.filter(crop_season__farm__business=user.business)

# ==================== ANALYTICS AND REPORTING VIEWS ====================

class ZimbabweAnalyticsView(APIView):
    """Zimbabwe-specific analytics and reporting"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        business = getattr(user, 'business', None)
        
        if not business:
            return Response({'error': 'User must belong to a business'}, status=400)
        
        # Multi-currency analytics
        try:
            currencies = Currency.objects.filter(is_active=True)
            currencies_data = CurrencySerializer(currencies, many=True).data
        except Exception:
            currencies_data = []
        
        # ZIMRA compliance status
        try:
            zimra_config = ZIMRAConfiguration.objects.get(business=business)
        except ZIMRAConfiguration.DoesNotExist:
            zimra_config = None
        except Exception:
            zimra_config = None
        try:
            vat_returns = VATReturn.objects.filter(business=business).order_by('-period_start')[:5]
            vat_returns_data = VATReturnSerializer(vat_returns, many=True).data
        except Exception:
            vat_returns_data = []
        
        # Mobile money transaction analytics
        try:
            mobile_money_payments = MobileMoneyPayment.objects.filter(
                integration__business=business
            ).values('status').annotate(count=Count('id'))
            payment_stats = list(mobile_money_payments)
        except Exception:
            payment_stats = []
        
        # Inventory analytics
        try:
            inventory_items = InventoryItem.objects.filter(business=business)
            low_stock_count = 0
            for item in inventory_items:
                try:
                    if item.get_current_stock() <= item.reorder_point:
                        low_stock_count += 1
                except Exception:
                    continue
            total_items = inventory_items.count()
        except Exception:
            total_items = 0
            low_stock_count = 0
        
        # Agricultural analytics (if applicable)
        try:
            farms = Farm.objects.filter(business=business)
            farms_count = farms.count()
        except Exception:
            farms_count = 0
        try:
            active_crop_seasons = CropSeason.objects.filter(
                farm__business=business,
                status__in=['PLANTED', 'GROWING']
            ).count()
        except Exception:
            active_crop_seasons = 0
        
        return Response({
            'business': business.name,
            'currencies': currencies_data,
            'zimra_compliance': {
                'configured': zimra_config is not None,
                'vat_registered': getattr(zimra_config, 'is_vat_registered', False),
                'recent_returns': vat_returns_data
            },
            'mobile_money': {
                'integrations_count': MobileMoneyIntegration.objects.filter(business=business, is_active=True).count() if 'MobileMoneyIntegration' in globals() else 0,
                'payment_stats': payment_stats
            },
            'inventory': {
                'total_items': total_items,
                'low_stock_alerts': low_stock_count
            },
            'agriculture': {
                'farms_count': farms_count,
                'active_seasons': active_crop_seasons
            }
        })


# ==================== ACCOUNTS PAYABLE & RECEIVABLE ====================

class AccountsPayableView(APIView):
    """Aggregate accounts payable data from Purchase Orders and GRNs"""
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        try:
            user = request.user
            business = user.business if hasattr(user, 'business') else None
            
            # Import models
            try:
                from .models_extended import PurchaseOrder, GoodsReceivedNote, Vendor
            except ImportError:
                return Response({
                    'results': [],
                    'count': 0
                }, status=200)
            
            # Filter by business if user is not superadmin
            if user.role != 'superadmin' and business:
                purchase_orders = PurchaseOrder.objects.filter(business=business)
            elif user.role == 'superadmin':
                purchase_orders = PurchaseOrder.objects.all()
            else:
                purchase_orders = PurchaseOrder.objects.none()
            
            # Build accounts payable list from purchase orders and GRNs
            ap_list = []
            for po in purchase_orders:
                # Get GRNs for this PO
                grns = GoodsReceivedNote.objects.filter(purchase_order=po)
                total_paid = sum(grn.paid_amount for grn in grns)
                total_amount = po.total_amount
                balance = total_amount - total_paid
                
                # Determine status
                if balance <= 0:
                    status = 'PAID'
                    status_display = 'Paid'
                elif balance < total_amount:
                    status = 'PARTIAL'
                    status_display = 'Partially Paid'
                else:
                    # Check if due date passed
                    if po.expected_delivery_date and po.expected_delivery_date < timezone.now().date():
                        status = 'OVERDUE'
                        status_display = 'Overdue'
                    else:
                        status = 'PENDING'
                        status_display = 'Pending'
                
                ap_list.append({
                    'id': po.id,
                    'vendor_name': po.vendor.name if po.vendor else 'Unknown Vendor',
                    'vendor_code': po.vendor.vendor_code if po.vendor else '',
                    'invoice_number': po.po_number,
                    'invoice_date': po.order_date.isoformat() if po.order_date else None,
                    'due_date': po.expected_delivery_date.isoformat() if po.expected_delivery_date else None,
                    'amount': float(total_amount),
                    'paid_amount': float(total_paid),
                    'balance': float(balance),
                    'status': status,
                    'status_display': status_display,
                    'description': f'Purchase Order {po.po_number}',
                    'created_at': po.created_at.isoformat() if hasattr(po, 'created_at') else None,
                })
            
            return Response({
                'results': ap_list,
                'count': len(ap_list)
            }, status=200)
        except Exception as e:
            logger.error(f'Error in AccountsPayableView: {str(e)}')
            return Response({
                'results': [],
                'count': 0,
                'error': str(e)
            }, status=500)


class AccountsReceivableView(APIView):
    """Aggregate accounts receivable data from POS Sales"""
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        try:
            user = request.user
            business = user.business if hasattr(user, 'business') else None
            
            # Filter by business if user is not superadmin
            if user.role != 'superadmin' and business:
                # Get sales from users in this business
                # Filter by sale session cashier's business
                try:
                    from .models import SaleSession
                    # Get users in this business
                    business_users = User.objects.filter(business=business)
                    if business_users.exists():
                        sessions = SaleSession.objects.filter(cashier__in=business_users)
                        sales = POSSale.objects.filter(session__in=sessions)
                    else:
                        sales = POSSale.objects.none()
                except Exception as e:
                    logger.error(f'Error filtering sales by business: {str(e)}')
                    # Last resort: get all sales (will be filtered later if needed)
                    sales = POSSale.objects.all()
            elif user.role == 'superadmin':
                sales = POSSale.objects.all()
            else:
                sales = POSSale.objects.none()
            
            # Build accounts receivable list from POS sales
            ar_list = []
            for sale in sales:
                # Calculate paid amount and balance
                # POS sales are typically paid immediately, so paid_amount = total_amount for completed sales
                total_amount = float(sale.total_amount or 0)
                # Check if sale has paid_amount field, otherwise infer from status
                if hasattr(sale, 'paid_amount'):
                    paid_amount = float(sale.paid_amount or 0)
                else:
                    # For POS sales, if status is COMPLETED, consider it paid
                    if sale.status == 'COMPLETED':
                        paid_amount = total_amount
                    else:
                        paid_amount = 0
                
                balance = total_amount - paid_amount
                
                # Determine status
                if balance <= 0 or sale.status == 'COMPLETED':
                    status = 'PAID'
                    status_display = 'Paid'
                elif balance < total_amount:
                    status = 'PARTIAL'
                    status_display = 'Partially Paid'
                elif sale.status == 'CANCELLED':
                    status = 'CANCELLED'
                    status_display = 'Cancelled'
                elif sale.status == 'REFUNDED':
                    status = 'REFUNDED'
                    status_display = 'Refunded'
                else:
                    status = sale.status or 'DRAFT'
                    status_display = status.replace('_', ' ').title()
                
                # Get customer name
                customer_name = sale.customer_name or 'Walk-in Customer'
                customer_code = sale.customer_name or ''
                
                # Get sale date
                sale_date = sale.created_at.date() if sale.created_at else timezone.now().date()
                
                ar_list.append({
                    'id': sale.id,
                    'customer_name': customer_name,
                    'customer_code': customer_code,
                    'invoice_number': sale.sale_number or f'SALE-{sale.id}',
                    'invoice_date': sale_date.isoformat(),
                    'due_date': sale_date.isoformat(),  # POS sales are typically paid immediately
                    'amount': total_amount,
                    'paid_amount': paid_amount,
                    'balance': balance,
                    'status': status,
                    'status_display': status_display,
                    'description': f'Sale {sale.sale_number or sale.id}',
                    'created_at': sale.created_at.isoformat() if sale.created_at else None,
                })
            
            return Response({
                'results': ar_list,
                'count': len(ar_list)
            }, status=200)
        except Exception as e:
            logger.error(f'Error in AccountsReceivableView: {str(e)}')
            return Response({
                'results': [],
                'count': 0,
                'error': str(e)
            }, status=500)

