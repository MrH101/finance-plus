from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from erp.models import Business, Store, BankAccount, MobileMoneyAccount

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create businesses
        admin_business, created = Business.objects.get_or_create(
            name='Admin Business',
            defaults={'address': '123 Admin Street, Harare'}
        )
        if created:
            self.stdout.write(f'Created business: {admin_business.name}')
        
        hoko_business, created = Business.objects.get_or_create(
            name='Hoko Business',
            defaults={'address': '456 Hoko Avenue, Bulawayo'}
        )
        if created:
            self.stdout.write(f'Created business: {hoko_business.name}')
        
        # Create users
        admin_user, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'username': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'superadmin',
                'business': admin_business,
                'phone': '+263771234567',
                'is_verified': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(f'Created user: {admin_user.email}')
        
        hoko_user, created = User.objects.get_or_create(
            email='hoko1@gmail.com',
            defaults={
                'username': 'hoko',
                'first_name': 'Hoko',
                'last_name': 'User',
                'role': 'employer',
                'business': hoko_business,
                'phone': '+263771234568',
                'is_verified': True
            }
        )
        if created:
            hoko_user.set_password('admin123')
            hoko_user.save()
            self.stdout.write(f'Created user: {hoko_user.email}')
        
        # Create stores
        admin_store, created = Store.objects.get_or_create(
            name='Admin Store',
            defaults={
                'address': '123 Admin Street, Harare',
                'manager': admin_user,
                'business': admin_business,
                'contact_number': '+263771234567',
                'vat_number': 'VAT001'
            }
        )
        if created:
            self.stdout.write(f'Created store: {admin_store.name}')
        
        hoko_store, created = Store.objects.get_or_create(
            name='Hoko Store',
            defaults={
                'address': '456 Hoko Avenue, Bulawayo',
                'manager': hoko_user,
                'business': hoko_business,
                'contact_number': '+263771234568',
                'vat_number': 'VAT002'
            }
        )
        if created:
            self.stdout.write(f'Created store: {hoko_store.name}')
        
        # Create bank accounts
        admin_bank_account, created = BankAccount.objects.get_or_create(
            account_number='1234567890',
            defaults={
                'store': admin_store,
                'account_name': 'Admin Business Account',
                'bank_name': 'CBZ Bank',
                'branch_code': '001',
                'account_type': 'Current',
                'opening_balance': 10000.00,
                'current_balance': 10000.00,
                'created_by': admin_user
            }
        )
        if created:
            self.stdout.write(f'Created bank account: {admin_bank_account.account_name}')
        
        hoko_bank_account, created = BankAccount.objects.get_or_create(
            account_number='0987654321',
            defaults={
                'store': hoko_store,
                'account_name': 'Hoko Business Account',
                'bank_name': 'Stanbic Bank',
                'branch_code': '002',
                'account_type': 'Current',
                'opening_balance': 5000.00,
                'current_balance': 5000.00,
                'created_by': hoko_user
            }
        )
        if created:
            self.stdout.write(f'Created bank account: {hoko_bank_account.account_name}')
        
        # Create mobile money accounts
        admin_mobile_account, created = MobileMoneyAccount.objects.get_or_create(
            phone_number='+263771234567',
            defaults={
                'store': admin_store,
                'account_name': 'Admin Mobile Money',
                'provider': 'EcoCash',
                'account_type': 'Business',
                'opening_balance': 2000.00,
                'current_balance': 2000.00,
                'created_by': admin_user
            }
        )
        if created:
            self.stdout.write(f'Created mobile money account: {admin_mobile_account.account_name}')
        
        hoko_mobile_account, created = MobileMoneyAccount.objects.get_or_create(
            phone_number='+263771234568',
            defaults={
                'store': hoko_store,
                'account_name': 'Hoko Mobile Money',
                'provider': 'OneMoney',
                'account_type': 'Business',
                'opening_balance': 1000.00,
                'current_balance': 1000.00,
                'created_by': hoko_user
            }
        )
        if created:
            self.stdout.write(f'Created mobile money account: {hoko_mobile_account.account_name}')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )
