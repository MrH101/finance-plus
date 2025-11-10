from django.core.management.base import BaseCommand
from erp.models import Store, ChartOfAccounts

class Command(BaseCommand):
    help = 'Setup chart of accounts for stores'

    def handle(self, *args, **options):
        self.stdout.write('Setting up chart of accounts...')
        
        stores = Store.objects.all()
        
        for store in stores:
            self.stdout.write(f'Setting up accounts for {store.name}...')
            
            # Asset Accounts
            cash_account, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='1000',
                defaults={
                    'name': 'Cash',
                    'account_type': 'ASSET',
                    'description': 'Cash on hand',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {cash_account.name}')
            
            bank_account, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='1100',
                defaults={
                    'name': 'Bank Account',
                    'account_type': 'ASSET',
                    'description': 'Bank account balance',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {bank_account.name}')
            
            inventory_account, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='1200',
                defaults={
                    'name': 'Inventory',
                    'account_type': 'ASSET',
                    'description': 'Inventory on hand',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {inventory_account.name}')
            
            # Liability Accounts
            accounts_payable, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='2000',
                defaults={
                    'name': 'Accounts Payable',
                    'account_type': 'LIABILITY',
                    'description': 'Amounts owed to suppliers',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {accounts_payable.name}')
            
            # Equity Accounts
            owner_equity, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='3000',
                defaults={
                    'name': 'Owner Equity',
                    'account_type': 'EQUITY',
                    'description': 'Owner investment in business',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {owner_equity.name}')
            
            # Revenue Accounts
            sales_revenue, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='4000',
                defaults={
                    'name': 'Sales Revenue',
                    'account_type': 'REVENUE',
                    'description': 'Revenue from sales',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {sales_revenue.name}')
            
            # Expense Accounts
            cost_of_goods_sold, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='5000',
                defaults={
                    'name': 'Cost of Goods Sold',
                    'account_type': 'EXPENSE',
                    'description': 'Cost of products sold',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {cost_of_goods_sold.name}')
            
            operating_expenses, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='5100',
                defaults={
                    'name': 'Operating Expenses',
                    'account_type': 'EXPENSE',
                    'description': 'General operating expenses',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {operating_expenses.name}')
            
            salary_expenses, created = ChartOfAccounts.objects.get_or_create(
                store=store,
                code='5200',
                defaults={
                    'name': 'Salary Expenses',
                    'account_type': 'EXPENSE',
                    'description': 'Employee salary expenses',
                    'opening_balance': 0.00,
                    'current_balance': 0.00
                }
            )
            if created:
                self.stdout.write(f'  Created account: {salary_expenses.name}')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully setup chart of accounts!')
        )
