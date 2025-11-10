from django.core.management.base import BaseCommand
from django.utils import timezone
from erp.models import TaxReminder
from datetime import date


class Command(BaseCommand):
    help = 'Send tax payment reminders'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending',
        )

    def handle(self, *args, **options):
        today = date.today()
        dry_run = options['dry_run']
        
        # Get pending reminders for today
        pending_reminders = TaxReminder.objects.filter(
            reminder_date=today,
            sent=False
        ).select_related('tax')
        
        if not pending_reminders:
            self.stdout.write(
                self.style.SUCCESS('No tax reminders to send today')
            )
            return
        
        self.stdout.write(
            f"Found {pending_reminders.count()} reminder(s) to send"
        )
        
        sent_count = 0
        failed_count = 0
        
        for reminder in pending_reminders:
            try:
                if dry_run:
                    self.stdout.write(
                        f"Would send {reminder.reminder_type} reminder for "
                        f"{reminder.tax.get_type_display()} tax"
                    )
                else:
                    success = reminder.send_reminder()
                    if success:
                        sent_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Sent {reminder.reminder_type} reminder for "
                                f"{reminder.tax.get_type_display()} tax"
                            )
                        )
                    else:
                        failed_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f"Failed to send {reminder.reminder_type} reminder for "
                                f"{reminder.tax.get_type_display()} tax"
                            )
                        )
            except Exception as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"Error sending reminder {reminder.id}: {str(e)}"
                    )
                )
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Reminder sending completed. Sent: {sent_count}, Failed: {failed_count}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry run completed. Would send: {pending_reminders.count()} reminders"
                )
            ) 