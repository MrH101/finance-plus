# signals.py
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from django.db.models import F
from .models import *

@receiver(post_save, sender=Sale)
def handle_sale_inventory(sender, instance, created, **kwargs):
    if created:
        with transaction.atomic():
            # Update inventory
            Product.objects.filter(pk=instance.product.pk).update(
                current_stock=F('current_stock') - instance.quantity
            )
            # Create ledger entries
            GeneralLedger.objects.create(
                account=ChartOfAccounts.objects.get(code='REV001'),
                credit=instance.total_after_tax,
                description=f"Sale #{instance.invoice_number}"
            )
            GeneralLedger.objects.create(
                account=ChartOfAccounts.objects.get(code='BANK001'),
                debit=instance.total_after_tax,
                description=f"Sale #{instance.invoice_number}"
            )

@receiver(post_save, sender=Purchase)
def handle_purchase_inventory(sender, instance, created, **kwargs):
    if created:
        with transaction.atomic():
            # Update inventory
            Product.objects.filter(pk=instance.product.pk).update(
                current_stock=F('current_stock') + instance.quantity
            )
            # Create ledger entries
            GeneralLedger.objects.create(
                account=ChartOfAccounts.objects.get(code='INV001'),
                debit=instance.total_amount,
                description=f"Purchase #{instance.id}"
            )
            GeneralLedger.objects.create(
                account=ChartOfAccounts.objects.get(code='BANK001'),
                credit=instance.total_amount,
                description=f"Purchase #{instance.id}"
            )

@receiver(post_save)
def log_audit_trail(sender, instance, created, **kwargs):
    if sender.__name__ in ['Sale', 'Purchase', 'Tax']:
        action = 'CREATE' if created else 'UPDATE'
        AuditLog.objects.create(
            user=instance.user if hasattr(instance, 'user') else None,
            action=action,
            model_name=sender.__name__,
            record_id=instance.id,
            details=instance.__dict__
        )

@receiver(post_delete)
def log_deletion(sender, instance, **kwargs):
    if sender.__name__ in ['Sale', 'Purchase', 'Tax']:
        AuditLog.objects.create(
            user=getattr(instance, 'user', None),
            action='DELETE',
            model_name=sender.__name__,
            record_id=instance.id,
            details={'deleted_object': str(instance)}
        )