"""
Zimbabwe Payment Gateway Integration Services
EcoCash, OneMoney, Innbucks Integration
"""
import requests
import json
import hashlib
import hmac
from decimal import Decimal
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class EcoCashService:
    """
    EcoCash Mobile Money Integration
    Zimbabwe's leading mobile money platform
    """
    
    def __init__(self, gateway_config):
        """
        Initialize EcoCash service
        Args:
            gateway_config: PaymentGateway instance
        """
        self.gateway = gateway_config
        self.merchant_code = gateway_config.merchant_id
        self.api_key = gateway_config.api_key
        self.api_url = gateway_config.api_url
        self.is_test = gateway_config.is_test_mode
    
    def _generate_signature(self, payload):
        """Generate signature for request authentication"""
        # EcoCash typically uses HMAC-SHA256
        message = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            self.api_key.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def _make_request(self, endpoint, payload):
        """Make authenticated request to EcoCash API"""
        headers = {
            'Content-Type': 'application/json',
            'X-Merchant-Code': self.merchant_code,
            'X-Signature': self._generate_signature(payload)
        }
        
        url = f"{self.api_url}/{endpoint}"
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"EcoCash API request failed: {str(e)}")
            raise
    
    def initiate_payment(self, transaction):
        """
        Initiate payment via EcoCash
        Args:
            transaction: PaymentTransaction instance
        Returns:
            dict: Response data
        """
        from ..models_ecommerce import EcoCashTransaction
        
        # Create EcoCash transaction record
        ecocash_txn = EcoCashTransaction.objects.create(
            payment_transaction=transaction,
            subscriber_msisdn=transaction.customer_phone,
            merchant_code=self.merchant_code
        )
        
        # Prepare payment request
        payload = {
            'merchant_code': self.merchant_code,
            'transaction_ref': transaction.transaction_number,
            'subscriber_msisdn': transaction.customer_phone,
            'amount': str(transaction.amount),
            'currency': transaction.currency.code,
            'reason': f"Payment for Order #{transaction.online_order.order_number if transaction.online_order else transaction.transaction_number}",
            'merchant_name': self.gateway.business.name
        }
        
        transaction.request_payload = json.dumps(payload)
        transaction.status = 'PROCESSING'
        transaction.save()
        
        try:
            response = self._make_request('payment/initiate', payload)
            
            transaction.response_payload = json.dumps(response)
            
            if response.get('status') == 'success':
                # Store poll token for checking status
                ecocash_txn.poll_token = response.get('poll_token')
                ecocash_txn.poll_url = response.get('poll_url')
                ecocash_txn.ussd_string = response.get('ussd_string')
                ecocash_txn.save()
                
                transaction.gateway_transaction_id = response.get('transaction_id')
                transaction.gateway_reference = response.get('reference')
                transaction.status = 'PENDING'
                transaction.status_message = 'USSD push sent to customer'
                transaction.save()
                
                logger.info(f"EcoCash payment initiated: {transaction.transaction_number}")
                return {
                    'success': True,
                    'message': 'Please check your phone for EcoCash prompt',
                    'ussd_string': ecocash_txn.ussd_string
                }
            else:
                transaction.status = 'FAILED'
                transaction.error_message = response.get('message', 'Unknown error')
                transaction.save()
                
                return {
                    'success': False,
                    'message': transaction.error_message
                }
                
        except Exception as e:
            transaction.status = 'FAILED'
            transaction.error_message = str(e)
            transaction.save()
            logger.exception(f"EcoCash payment initiation failed: {str(e)}")
            return {
                'success': False,
                'message': 'Payment initiation failed. Please try again.'
            }
    
    def check_payment_status(self, transaction):
        """
        Check payment status from EcoCash
        Args:
            transaction: PaymentTransaction instance
        Returns:
            dict: Status information
        """
        ecocash_txn = transaction.ecocash_details
        
        if not ecocash_txn.poll_token:
            return {'status': 'UNKNOWN', 'message': 'No poll token available'}
        
        payload = {
            'merchant_code': self.merchant_code,
            'poll_token': ecocash_txn.poll_token
        }
        
        try:
            response = self._make_request('payment/status', payload)
            
            ecocash_txn.result_code = response.get('result_code')
            ecocash_txn.result_description = response.get('result_description')
            ecocash_txn.save()
            
            if response.get('result_code') == '0':  # Success
                transaction.status = 'SUCCESS'
                transaction.completed_at = timezone.now()
                transaction.save()
                
                # Update order payment status
                if transaction.online_order:
                    transaction.online_order.payment_status = 'COMPLETED'
                    transaction.online_order.paid_at = timezone.now()
                    transaction.online_order.save()
                
                return {
                    'status': 'SUCCESS',
                    'message': 'Payment completed successfully'
                }
            elif response.get('result_code') == '1':  # Pending
                return {
                    'status': 'PENDING',
                    'message': 'Payment still pending'
                }
            else:  # Failed
                transaction.status = 'FAILED'
                transaction.error_message = ecocash_txn.result_description
                transaction.save()
                
                return {
                    'status': 'FAILED',
                    'message': ecocash_txn.result_description
                }
                
        except Exception as e:
            logger.exception(f"EcoCash status check failed: {str(e)}")
            return {
                'status': 'ERROR',
                'message': 'Status check failed'
            }
    
    def refund_payment(self, transaction, refund_amount):
        """
        Process refund via EcoCash
        Args:
            transaction: Original PaymentTransaction instance
            refund_amount: Amount to refund
        Returns:
            dict: Refund response
        """
        payload = {
            'merchant_code': self.merchant_code,
            'original_transaction_id': transaction.gateway_transaction_id,
            'refund_amount': str(refund_amount),
            'reason': 'Customer requested refund'
        }
        
        try:
            response = self._make_request('payment/refund', payload)
            
            if response.get('status') == 'success':
                logger.info(f"EcoCash refund successful: {transaction.transaction_number}")
                return {
                    'success': True,
                    'message': 'Refund processed successfully'
                }
            else:
                return {
                    'success': False,
                    'message': response.get('message', 'Refund failed')
                }
                
        except Exception as e:
            logger.exception(f"EcoCash refund failed: {str(e)}")
            return {
                'success': False,
                'message': 'Refund processing failed'
            }


class OneMoneyService:
    """
    OneMoney (NetOne) Mobile Money Integration
    """
    
    def __init__(self, gateway_config):
        self.gateway = gateway_config
        self.merchant_id = gateway_config.merchant_id
        self.api_key = gateway_config.api_key
        self.api_url = gateway_config.api_url
        self.is_test = gateway_config.is_test_mode
    
    def initiate_payment(self, transaction):
        """Initiate OneMoney payment"""
        from ..models_ecommerce import OneMoneyTransaction
        
        onemoney_txn = OneMoneyTransaction.objects.create(
            payment_transaction=transaction,
            customer_msisdn=transaction.customer_phone
        )
        
        # OneMoney API typically uses REST with API key authentication
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key,
            'X-Merchant-ID': self.merchant_id
        }
        
        payload = {
            'merchant_id': self.merchant_id,
            'reference': transaction.transaction_number,
            'customer_phone': transaction.customer_phone,
            'amount': str(transaction.amount),
            'currency': 'ZWL',
            'description': f"Payment for {transaction.transaction_number}"
        }
        
        transaction.request_payload = json.dumps(payload)
        transaction.status = 'PROCESSING'
        transaction.save()
        
        try:
            response = requests.post(
                f"{self.api_url}/payment/initiate",
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            transaction.response_payload = json.dumps(result)
            
            if result.get('status') == 'success':
                onemoney_txn.reference_id = result.get('reference_id')
                onemoney_txn.save()
                
                transaction.gateway_transaction_id = result.get('transaction_id')
                transaction.status = 'PENDING'
                transaction.save()
                
                return {
                    'success': True,
                    'message': 'Payment initiated. Please approve on your phone.'
                }
            else:
                transaction.status = 'FAILED'
                transaction.error_message = result.get('message')
                transaction.save()
                
                return {
                    'success': False,
                    'message': transaction.error_message
                }
                
        except Exception as e:
            transaction.status = 'FAILED'
            transaction.error_message = str(e)
            transaction.save()
            logger.exception(f"OneMoney payment failed: {str(e)}")
            return {
                'success': False,
                'message': 'Payment initiation failed'
            }
    
    def check_payment_status(self, transaction):
        """Check OneMoney payment status"""
        onemoney_txn = transaction.onemoney_details
        
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key,
            'X-Merchant-ID': self.merchant_id
        }
        
        try:
            response = requests.get(
                f"{self.api_url}/payment/status/{transaction.gateway_transaction_id}",
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            status = result.get('status')
            
            if status == 'COMPLETED':
                onemoney_txn.transaction_status = 'COMPLETED'
                onemoney_txn.confirmation_code = result.get('confirmation_code')
                onemoney_txn.save()
                
                transaction.status = 'SUCCESS'
                transaction.completed_at = timezone.now()
                transaction.save()
                
                return {'status': 'SUCCESS', 'message': 'Payment completed'}
            elif status == 'FAILED':
                transaction.status = 'FAILED'
                transaction.save()
                return {'status': 'FAILED', 'message': 'Payment failed'}
            else:
                return {'status': 'PENDING', 'message': 'Payment pending'}
                
        except Exception as e:
            logger.exception(f"OneMoney status check failed: {str(e)}")
            return {'status': 'ERROR', 'message': 'Status check failed'}


class InnbucksService:
    """
    Innbucks Mobile Money Integration
    """
    
    def __init__(self, gateway_config):
        self.gateway = gateway_config
        self.terminal_id = gateway_config.merchant_id
        self.api_key = gateway_config.api_key
        self.api_url = gateway_config.api_url
        self.is_test = gateway_config.is_test_mode
    
    def initiate_payment(self, transaction):
        """Initiate Innbucks payment"""
        from ..models_ecommerce import InnbucksTransaction
        
        innbucks_txn = InnbucksTransaction.objects.create(
            payment_transaction=transaction,
            wallet_number=transaction.customer_phone,
            terminal_id=self.terminal_id
        )
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        
        payload = {
            'terminal_id': self.terminal_id,
            'transaction_ref': transaction.transaction_number,
            'wallet_number': transaction.customer_phone,
            'amount': str(transaction.amount),
            'description': f"Payment {transaction.transaction_number}"
        }
        
        transaction.request_payload = json.dumps(payload)
        transaction.status = 'PROCESSING'
        transaction.save()
        
        try:
            response = requests.post(
                f"{self.api_url}/transactions/debit",
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            transaction.response_payload = json.dumps(result)
            
            if result.get('response_code') == '00':  # Success code
                innbucks_txn.auth_code = result.get('auth_code')
                innbucks_txn.receipt_number = result.get('receipt_number')
                innbucks_txn.save()
                
                transaction.gateway_transaction_id = result.get('transaction_id')
                transaction.status = 'SUCCESS'
                transaction.completed_at = timezone.now()
                transaction.save()
                
                return {
                    'success': True,
                    'message': 'Payment completed successfully',
                    'receipt_number': innbucks_txn.receipt_number
                }
            else:
                transaction.status = 'FAILED'
                transaction.error_message = result.get('response_message')
                transaction.save()
                
                return {
                    'success': False,
                    'message': transaction.error_message
                }
                
        except Exception as e:
            transaction.status = 'FAILED'
            transaction.error_message = str(e)
            transaction.save()
            logger.exception(f"Innbucks payment failed: {str(e)}")
            return {
                'success': False,
                'message': 'Payment processing failed'
            }


class PaymentGatewayFactory:
    """
    Factory to get appropriate payment gateway service
    """
    
    @staticmethod
    def get_service(gateway_config):
        """
        Get payment service based on gateway type
        Args:
            gateway_config: PaymentGateway instance
        Returns:
            Payment service instance
        """
        gateway_type = gateway_config.gateway_type
        
        if gateway_type == 'ECOCASH':
            return EcoCashService(gateway_config)
        elif gateway_type == 'ONEMONEY':
            return OneMoneyService(gateway_config)
        elif gateway_type == 'INNBUCKS':
            return InnbucksService(gateway_config)
        else:
            raise ValueError(f"Unsupported gateway type: {gateway_type}")
    
    @staticmethod
    def process_payment(transaction):
        """
        Process payment for a transaction
        Args:
            transaction: PaymentTransaction instance
        Returns:
            dict: Payment result
        """
        try:
            service = PaymentGatewayFactory.get_service(transaction.gateway)
            return service.initiate_payment(transaction)
        except Exception as e:
            logger.exception(f"Payment processing failed: {str(e)}")
            return {
                'success': False,
                'message': 'Payment gateway error. Please try again.'
            }
    
    @staticmethod
    def check_status(transaction):
        """
        Check payment status
        Args:
            transaction: PaymentTransaction instance
        Returns:
            dict: Status information
        """
        try:
            service = PaymentGatewayFactory.get_service(transaction.gateway)
            return service.check_payment_status(transaction)
        except Exception as e:
            logger.exception(f"Status check failed: {str(e)}")
            return {
                'status': 'ERROR',
                'message': 'Status check failed'
            }

