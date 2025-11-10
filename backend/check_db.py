#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from erp.models import Store, BankAccount, MobileMoneyAccount, Business
from django.contrib.auth import get_user_model

User = get_user_model()

def main():
    print("Checking database...")
    
    # Check existing data
    print(f"Businesses: {Business.objects.count()}")
    print(f"Users: {User.objects.count()}")
    print(f"Stores: {Store.objects.count()}")
    print(f"Bank Accounts: {BankAccount.objects.count()}")
    print(f"Mobile Money Accounts: {MobileMoneyAccount.objects.count()}")
    
    # Create sample data if none exists
    if BankAccount.objects.count() == 0:
        print("\nCreating sample data...")
        
        # Create business
        business, created = Business.objects.get_or_create(
            name='Sample Business',
            defaults={'address': '123 Main Street, Harare, Zimbabwe'}
        )
        if created:
            print(f"Created business: {business.name}")
        
        # Create user
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'role': 'superadmin',
                'business': business,
                'phone': '+263771234567',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            user.set_password('admin123')
            user.save()
            print(f"Created user: {user.username}")
        
        # Create store
        store, created = Store.objects.get_or_create(
            name='Main Store',
            defaults={
                'address': '456 Business Avenue, Harare, Zimbabwe',
                'manager': user,
                'contact_number': '+263771234567',
                'vat_number': 'VAT123456789'
            }
        )
        if created:
            print(f"Created store: {store.name}")
        
        # Create bank account
        bank_account, created = BankAccount.objects.get_or_create(
            account_number='1234567890',
            defaults={
                'store': store,
                'bank_name': 'CBZ',
                'account_name': 'Main Business Account',
                'account_type': 'CURRENT',
                'branch_code': 'HRE001',
                'swift_code': 'CBZAZWWH',
                'is_active': True,
                'opening_balance': 10000.00,
                'current_balance': 10000.00
            }
        )
        if created:
            print(f"Created bank account: {bank_account.account_name} (ID: {bank_account.id})")
        
        # Create mobile money account
        mobile_account, created = MobileMoneyAccount.objects.get_or_create(
            phone_number='+263771234567',
            defaults={
                'store': store,
                'provider': 'ECOCASH',
                'account_name': 'Business Mobile Money',
                'is_active': True,
                'opening_balance': 5000.00,
                'current_balance': 5000.00
            }
        )
        if created:
            print(f"Created mobile money account: {mobile_account.account_name} (ID: {mobile_account.id})")
        
        print("\nSample data created successfully!")
        print(f"Bank Account ID: {bank_account.id}")
        print(f"Mobile Money Account ID: {mobile_account.id}")
    else:
        print("\nSample data already exists:")
        for account in BankAccount.objects.all():
            print(f"Bank Account: {account.account_name} (ID: {account.id})")
        for account in MobileMoneyAccount.objects.all():
            print(f"Mobile Money Account: {account.account_name} (ID: {account.id})")

if __name__ == '__main__':
    main() 