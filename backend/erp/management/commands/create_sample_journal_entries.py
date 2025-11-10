from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from erp.models import Store, JournalEntry, JournalEntryLine, ChartOfAccounts

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample journal entries for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample journal entries...')
        
        # Get users and stores
        admin_user = User.objects.get(email='admin@example.com')
        hoko_user = User.objects.get(email='hoko1@gmail.com')
        
        admin_store = Store.objects.get(name='Admin Store')
        hoko_store = Store.objects.get(name='Hoko Store')
        
        # Create journal entry for admin business
        admin_entry, created = JournalEntry.objects.get_or_create(
            entry_number='JE-001',
            defaults={
                'store': admin_store,
                'entry_type': 'GENERAL',
                'date': '2025-07-29',
                'description': 'Sample entry for admin business',
                'status': 'DRAFT',
                'total_debits': 0.00,
                'total_credits': 0.00,
                'created_by': admin_user
            }
        )
        if created:
            self.stdout.write(f'Created journal entry: {admin_entry.entry_number}')
        
        # Create another journal entry for admin business
        admin_entry2, created = JournalEntry.objects.get_or_create(
            entry_number='JE-002',
            defaults={
                'store': admin_store,
                'entry_type': 'GENERAL',
                'date': '2025-07-29',
                'description': 'Another entry for admin business',
                'status': 'DRAFT',
                'total_debits': 0.00,
                'total_credits': 0.00,
                'created_by': admin_user
            }
        )
        if created:
            self.stdout.write(f'Created journal entry: {admin_entry2.entry_number}')
        
        # Create journal entry for hoko business
        hoko_entry, created = JournalEntry.objects.get_or_create(
            entry_number='JE-003',
            defaults={
                'store': hoko_store,
                'entry_type': 'GENERAL',
                'date': '2025-07-29',
                'description': 'Sample entry for hoko business',
                'status': 'DRAFT',
                'total_debits': 0.00,
                'total_credits': 0.00,
                'created_by': hoko_user
            }
        )
        if created:
            self.stdout.write(f'Created journal entry: {hoko_entry.entry_number}')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample journal entries!')
        )
