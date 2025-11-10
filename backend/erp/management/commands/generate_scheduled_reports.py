from django.core.management.base import BaseCommand
from django.utils import timezone
from erp.models import ScheduledReport


class Command(BaseCommand):
    help = 'Generate scheduled reports'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be generated without actually generating',
        )
        parser.add_argument(
            '--report-id',
            type=int,
            help='Generate a specific scheduled report by ID',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        report_id = options['report_id']
        
        if report_id:
            # Generate specific report
            try:
                scheduled_report = ScheduledReport.objects.get(id=report_id)
                self.generate_single_report(scheduled_report, dry_run)
            except ScheduledReport.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Scheduled report with ID {report_id} not found')
                )
            return
        
        # Get all active scheduled reports that are due
        now = timezone.now()
        due_reports = ScheduledReport.objects.filter(
            is_active=True,
            next_generation__lte=now
        )
        
        if not due_reports:
            self.stdout.write(
                self.style.SUCCESS('No scheduled reports are due for generation')
            )
            return
        
        self.stdout.write(
            f"Found {due_reports.count()} scheduled report(s) due for generation"
        )
        
        generated_count = 0
        failed_count = 0
        
        for scheduled_report in due_reports:
            success = self.generate_single_report(scheduled_report, dry_run)
            if success:
                generated_count += 1
            else:
                failed_count += 1
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Scheduled report generation completed. Generated: {generated_count}, Failed: {failed_count}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Dry run completed. Would generate: {due_reports.count()} reports"
                )
            )
    
    def generate_single_report(self, scheduled_report, dry_run):
        """Generate a single scheduled report"""
        try:
            if dry_run:
                self.stdout.write(
                    f"Would generate {scheduled_report.get_report_type_display()} report: {scheduled_report.name}"
                )
                return True
            
            self.stdout.write(
                f"Generating {scheduled_report.get_report_type_display()} report: {scheduled_report.name}"
            )
            
            success = scheduled_report.generate_report()
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Successfully generated report: {scheduled_report.name}"
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"Failed to generate report: {scheduled_report.name}"
                    )
                )
            
            return success
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f"Error generating scheduled report {scheduled_report.id}: {str(e)}"
                )
            )
            return False 