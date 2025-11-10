"""
ZIMRA Virtual Fiscal Device Integration Service
Handles communication with Zimbabwe Revenue Authority fiscal system
"""
import requests
import json
import hashlib
import hmac
from datetime import datetime
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class ZIMRAFiscalService:
    """
    Service for integrating with ZIMRA Virtual Fiscal Device API
    """
    
    def __init__(self, device):
        """
        Initialize with a fiscal device configuration
        Args:
            device: ZIMRAVirtualFiscalDevice instance
        """
        self.device = device
        self.api_url = device.api_url
        self.api_username = device.api_username
        self.api_password = device.api_password
        self.device_id = device.device_id
    
    def _generate_signature(self, payload):
        """Generate HMAC signature for request"""
        message = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            self.api_password.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _make_request(self, endpoint, payload):
        """Make authenticated request to ZIMRA API"""
        headers = {
            'Content-Type': 'application/json',
            'X-Device-ID': self.device_id,
            'X-Username': self.api_username,
            'X-Signature': self._generate_signature(payload)
        }
        
        url = f"{self.api_url}/{endpoint}"
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"ZIMRA API request failed: {str(e)}")
            raise
    
    def register_device(self):
        """Register virtual fiscal device with ZIMRA"""
        payload = {
            'device_id': self.device_id,
            'device_model': self.device.device_model_name,
            'device_version': self.device.device_model_version,
            'business_tin': self.device.store.vat_number,
            'business_name': self.device.business.name,
            'store_name': self.device.store.name,
            'registration_date': datetime.now().isoformat()
        }
        
        response = self._make_request('device/register', payload)
        
        if response.get('status') == 'success':
            self.device.status = 'ACTIVE'
            self.device.registration_date = timezone.now().date()
            self.device.certificate_serial = response.get('certificate_serial')
            self.device.save()
            
            logger.info(f"Device {self.device_id} registered successfully")
            return True
        
        logger.error(f"Device registration failed: {response.get('message')}")
        return False
    
    def submit_receipt(self, receipt):
        """
        Submit fiscal receipt to ZIMRA
        Args:
            receipt: FiscalReceipt instance
        """
        from ..models_extended_part2 import FiscalReceipt
        
        # Prepare receipt data
        items = []
        if receipt.sales_order:
            for item in receipt.sales_order.items.all():
                items.append({
                    'description': item.description,
                    'quantity': str(item.quantity_ordered),
                    'unit_price': str(item.unit_price),
                    'tax_rate': str(item.tax_rate),
                    'tax_amount': str(item.tax_amount),
                    'total': str(item.total_amount)
                })
        
        payload = {
            'device_id': self.device_id,
            'receipt_number': receipt.receipt_number,
            'receipt_date': receipt.receipt_date.isoformat(),
            'customer_tin': receipt.customer_tin or '',
            'customer_name': receipt.customer_name or '',
            'items': items,
            'subtotal': str(receipt.total_amount - receipt.vat_amount),
            'vat_amount': str(receipt.vat_amount),
            'total_amount': str(receipt.total_amount),
            'payment_method': 'CASH',  # TODO: Get from actual payment method
            'cashier_id': receipt.fiscal_device.created_by.username
        }
        
        receipt.zimra_request_payload = json.dumps(payload)
        receipt.submission_attempts += 1
        receipt.last_attempt_datetime = timezone.now()
        
        try:
            response = self._make_request('receipt/submit', payload)
            
            receipt.zimra_response_payload = json.dumps(response)
            
            if response.get('status') == 'success':
                receipt.status = 'VERIFIED'
                receipt.fiscal_receipt_number = response.get('fiscal_receipt_number')
                receipt.qr_code_data = response.get('qr_code_data')
                receipt.verification_url = response.get('verification_url')
                receipt.zimra_verification_code = response.get('verification_code')
                
                # Update device counters
                self.device.daily_receipt_count += 1
                self.device.total_receipt_count += 1
                self.device.last_receipt_number = receipt.fiscal_receipt_number
                self.device.save()
                
                logger.info(f"Receipt {receipt.receipt_number} submitted successfully")
                
            else:
                receipt.status = 'FAILED'
                receipt.error_message = response.get('message', 'Unknown error')
                logger.error(f"Receipt submission failed: {receipt.error_message}")
            
            receipt.save()
            return receipt.status == 'VERIFIED'
            
        except Exception as e:
            receipt.status = 'FAILED'
            receipt.error_message = str(e)
            receipt.save()
            logger.exception(f"Receipt submission exception: {str(e)}")
            return False
    
    def submit_day_end(self, day_end):
        """
        Submit fiscal day end to ZIMRA
        Args:
            day_end: FiscalDayEnd instance
        """
        payload = {
            'device_id': self.device_id,
            'business_date': day_end.business_date.isoformat(),
            'closing_datetime': day_end.closing_datetime.isoformat(),
            'total_receipts': day_end.total_receipts,
            'total_sales': str(day_end.total_sales),
            'total_vat': str(day_end.total_vat)
        }
        
        day_end.zimra_request_payload = json.dumps(payload)
        
        try:
            response = self._make_request('dayend/submit', payload)
            
            day_end.zimra_response_payload = json.dumps(response)
            
            if response.get('status') == 'success':
                day_end.is_submitted = True
                day_end.submission_datetime = timezone.now()
                day_end.zimra_day_end_number = response.get('day_end_number')
                
                # Reset daily counter
                self.device.daily_receipt_count = 0
                self.device.save()
                
                logger.info(f"Day end for {day_end.business_date} submitted successfully")
            
            day_end.save()
            return day_end.is_submitted
            
        except Exception as e:
            logger.exception(f"Day end submission exception: {str(e)}")
            return False
    
    def query_receipt_status(self, fiscal_receipt_number):
        """Query the status of a receipt from ZIMRA"""
        payload = {
            'device_id': self.device_id,
            'fiscal_receipt_number': fiscal_receipt_number
        }
        
        try:
            response = self._make_request('receipt/status', payload)
            return response
        except Exception as e:
            logger.exception(f"Receipt status query failed: {str(e)}")
            return None
    
    def sync_receipts(self):
        """Sync all pending receipts with ZIMRA"""
        from ..models_extended_part2 import FiscalReceipt
        
        pending_receipts = FiscalReceipt.objects.filter(
            fiscal_device=self.device,
            status__in=['PENDING', 'FAILED'],
            submission_attempts__lt=3
        ).order_by('receipt_date')
        
        synced_count = 0
        failed_count = 0
        
        for receipt in pending_receipts:
            if self.submit_receipt(receipt):
                synced_count += 1
            else:
                failed_count += 1
        
        self.device.last_sync_datetime = timezone.now()
        self.device.save()
        
        logger.info(f"Sync completed: {synced_count} synced, {failed_count} failed")
        
        return {
            'synced_count': synced_count,
            'failed_count': failed_count,
            'total_processed': synced_count + failed_count
        }


class ZIMRATaxService:
    """
    Service for ZIMRA tax calculations and submissions
    """
    
    # VAT rates in Zimbabwe
    VAT_STANDARD_RATE = Decimal('14.5')  # 14.5% standard VAT rate
    VAT_ZERO_RATE = Decimal('0.0')
    
    # PAYE tax brackets (2024) - Zimbabwe
    PAYE_BRACKETS = [
        {'min': 0, 'max': 50000, 'rate': 0, 'deduction': 0},
        {'min': 50001, 'max': 75000, 'rate': 20, 'deduction': 10000},
        {'min': 75001, 'max': 100000, 'rate': 25, 'deduction': 13750},
        {'min': 100001, 'max': 150000, 'rate': 30, 'deduction': 18750},
        {'min': 150001, 'max': 250000, 'rate': 35, 'deduction': 26250},
        {'min': 250001, 'max': float('inf'), 'rate': 40, 'deduction': 38750}
    ]
    
    # NSSA rates
    NSSA_EMPLOYEE_RATE = Decimal('3.5')  # 3.5%
    NSSA_EMPLOYER_RATE = Decimal('3.5')  # 3.5%
    NSSA_MAX_MONTHLY = Decimal('700')  # Maximum monthly contribution
    
    @classmethod
    def calculate_vat(cls, amount, rate=None):
        """
        Calculate VAT amount
        Args:
            amount: Base amount (exclusive of VAT)
            rate: VAT rate (defaults to standard rate)
        Returns:
            tuple: (vat_amount, total_including_vat)
        """
        if rate is None:
            rate = cls.VAT_STANDARD_RATE
        
        vat_amount = amount * (rate / 100)
        total = amount + vat_amount
        
        return vat_amount, total
    
    @classmethod
    def calculate_paye(cls, gross_salary):
        """
        Calculate PAYE (Pay As You Earn) tax
        Args:
            gross_salary: Monthly gross salary
        Returns:
            Decimal: PAYE amount
        """
        gross_salary = Decimal(str(gross_salary))
        
        for bracket in cls.PAYE_BRACKETS:
            if bracket['min'] <= gross_salary <= bracket['max']:
                paye = (gross_salary * Decimal(bracket['rate']) / 100) - Decimal(bracket['deduction'])
                return max(paye, Decimal('0'))
        
        return Decimal('0')
    
    @classmethod
    def calculate_nssa(cls, gross_salary):
        """
        Calculate NSSA contributions
        Args:
            gross_salary: Monthly gross salary
        Returns:
            dict: {'employee': amount, 'employer': amount}
        """
        gross_salary = Decimal(str(gross_salary))
        
        # Calculate contributions
        employee_contribution = min(
            gross_salary * (cls.NSSA_EMPLOYEE_RATE / 100),
            cls.NSSA_MAX_MONTHLY
        )
        employer_contribution = min(
            gross_salary * (cls.NSSA_EMPLOYER_RATE / 100),
            cls.NSSA_MAX_MONTHLY
        )
        
        return {
            'employee': employee_contribution,
            'employer': employer_contribution,
            'total': employee_contribution + employer_contribution
        }
    
    @classmethod
    def calculate_net_salary(cls, gross_salary, allowances=0, other_deductions=0):
        """
        Calculate net salary after all deductions
        Args:
            gross_salary: Monthly gross salary
            allowances: Total allowances
            other_deductions: Other deductions
        Returns:
            dict: Breakdown of salary calculation
        """
        gross_salary = Decimal(str(gross_salary))
        allowances = Decimal(str(allowances))
        other_deductions = Decimal(str(other_deductions))
        
        # Calculate total gross
        total_gross = gross_salary + allowances
        
        # Calculate PAYE on gross salary only (not allowances in Zimbabwe)
        paye = cls.calculate_paye(gross_salary)
        
        # Calculate NSSA
        nssa = cls.calculate_nssa(gross_salary)
        
        # Calculate net
        total_deductions = paye + nssa['employee'] + other_deductions
        net_salary = total_gross - total_deductions
        
        return {
            'basic_salary': gross_salary,
            'allowances': allowances,
            'gross_salary': total_gross,
            'paye': paye,
            'nssa_employee': nssa['employee'],
            'nssa_employer': nssa['employer'],
            'other_deductions': other_deductions,
            'total_deductions': total_deductions,
            'net_salary': net_salary
        }
    
    @classmethod
    def generate_vat_return(cls, business, period_start, period_end):
        """
        Generate VAT return for a period
        Args:
            business: Business instance
            period_start: Start date
            period_end: End date
        Returns:
            dict: VAT return data
        """
        from django.db.models import Sum
        from ..models import GeneralLedger
        
        # Get all sales (output VAT)
        sales_accounts = GeneralLedger.objects.filter(
            account__account_type='REVENUE',
            date__range=[period_start, period_end]
        )
        
        output_vat = sales_accounts.aggregate(
            total=Sum('credit')
        )['total'] or Decimal('0')
        
        # Get all purchases (input VAT)
        purchase_accounts = GeneralLedger.objects.filter(
            account__account_type='EXPENSE',
            date__range=[period_start, period_end]
        )
        
        input_vat = purchase_accounts.aggregate(
            total=Sum('debit')
        )['total'] or Decimal('0')
        
        # Calculate VAT
        output_vat_amount = output_vat * (cls.VAT_STANDARD_RATE / (100 + cls.VAT_STANDARD_RATE))
        input_vat_amount = input_vat * (cls.VAT_STANDARD_RATE / (100 + cls.VAT_STANDARD_RATE))
        
        vat_payable = output_vat_amount - input_vat_amount
        
        return {
            'period_start': period_start,
            'period_end': period_end,
            'total_sales': output_vat,
            'output_vat': output_vat_amount,
            'total_purchases': input_vat,
            'input_vat': input_vat_amount,
            'vat_payable': vat_payable if vat_payable > 0 else Decimal('0'),
            'vat_refund': abs(vat_payable) if vat_payable < 0 else Decimal('0')
        }

