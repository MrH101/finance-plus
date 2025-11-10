# Finance Plus - Migration & Setup Guide

## Table of Contents
1. [Fresh Installation](#fresh-installation)
2. [Extending Existing Installation](#extending-existing-installation)
3. [Data Migration](#data-migration)
4. [Post-Migration Tasks](#post-migration-tasks)
5. [Troubleshooting](#troubleshooting)

## Fresh Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL 14+ (or SQLite for development)
- Redis (for Celery tasks)

### Step 1: Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd finance-plus

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Step 2: Database Configuration

#### Using PostgreSQL (Recommended)
```bash
# Create database
createdb financeplus

# Update backend/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'financeplus',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

#### Using SQLite (Development)
SQLite is configured by default. No changes needed.

### Step 3: Run Migrations

```bash
cd backend

# Create all migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Step 4: Setup Initial Data

```bash
# Setup chart of accounts
python manage.py setup_chart_of_accounts

# Setup extended ERP features
python manage.py setup_extended_erp

# Optional: Load sample data
python manage.py setup_sample_data
```

### Step 5: Start Services

```bash
# Terminal 1: Django
python manage.py runserver

# Terminal 2: Celery Worker (optional)
celery -A backend worker -l info

# Terminal 3: Celery Beat (optional)
celery -A backend beat -l info

# Terminal 4: Redis (if not running as service)
redis-server

# Terminal 5: Frontend
cd ../frontend
npm run dev
```

## Extending Existing Installation

If you have an existing Finance Plus installation, follow these steps to add the extended features:

### Step 1: Backup Existing Data

```bash
# Backup database
python manage.py dumpdata > backup_$(date +%Y%m%d).json

# Or for PostgreSQL
pg_dump financeplus > backup_$(date +%Y%m%d).sql
```

### Step 2: Update Code

```bash
# Pull latest changes
git pull origin main

# Update dependencies
pip install -r requirements.txt
cd frontend && npm install
```

### Step 3: Create and Run New Migrations

```bash
cd backend

# Create migrations for new models
python manage.py makemigrations erp

# Review migration files in erp/migrations/
# Ensure no conflicts with existing migrations

# Apply migrations
python manage.py migrate erp

# Verify
python manage.py showmigrations erp
```

### Step 4: Import Extended Models

The system is designed to be backward compatible. New models are in separate files:
- `models_extended.py` - Supply Chain, CRM, Fixed Assets
- `models_extended_part2.py` - HR, Documents, Fiscalization, Budgeting
- `models_ecommerce.py` - E-commerce, Workflows, Payments

These integrate seamlessly with existing models through foreign keys.

### Step 5: Setup Extended Features

```bash
# Setup extended ERP for all businesses
python manage.py setup_extended_erp

# Or for specific business
python manage.py setup_extended_erp --business-id 1
```

### Step 6: Update URLs

The extended URLs are automatically included in the main urls.py:

```python
# backend/erp/urls.py
from .urls_extended import urlpatterns as extended_urlpatterns
urlpatterns += extended_urlpatterns
```

### Step 7: Restart Services

```bash
# Restart Django
python manage.py runserver

# Restart Celery
celery -A backend worker -l info --beat
```

## Data Migration

### From Other Systems

#### From QuickBooks

1. **Export Data from QuickBooks**
   ```
   - Chart of Accounts → Export to Excel
   - Customer List → Export to Excel
   - Vendor List → Export to Excel
   - Item List → Export to Excel
   - Transaction History → Export to Excel
   ```

2. **Prepare Import Files**
   ```bash
   # Use our template format
   python manage.py generate_import_templates
   # This creates Excel templates in /imports/templates/
   ```

3. **Import Data**
   ```bash
   # Import chart of accounts
   python manage.py import_data --type accounts --file accounts.xlsx

   # Import customers
   python manage.py import_data --type customers --file customers.xlsx

   # Import vendors
   python manage.py import_data --type vendors --file vendors.xlsx

   # Import products
   python manage.py import_data --type products --file products.xlsx

   # Import transactions
   python manage.py import_data --type transactions --file transactions.xlsx
   ```

#### From ERPNext

1. **Export from ERPNext**
   ```bash
   # Using ERPNext CLI
   bench --site [sitename] backup
   
   # Or use Data Export Tool in ERPNext UI
   ```

2. **Convert Data**
   ```bash
   # Use our conversion script
   python manage.py convert_erpnext_data --input erpnext_backup.json --output finance_plus_data.json
   ```

3. **Import Converted Data**
   ```bash
   python manage.py loaddata finance_plus_data.json
   ```

#### From Excel/CSV

1. **Prepare CSV Files**
   - Use our templates: `python manage.py generate_import_templates`
   - Fill in your data
   - Ensure correct column headers

2. **Import**
   ```bash
   python manage.py import_csv --type [entity] --file [filename.csv]
   
   # Available types:
   # - accounts, customers, vendors, products, employees, transactions
   ```

### Bulk Data Import

For large datasets:

```bash
# Use bulk import (faster)
python manage.py bulk_import --type products --file products.csv --batch-size 1000

# With validation
python manage.py bulk_import --type products --file products.csv --validate

# Dry run (test without saving)
python manage.py bulk_import --type products --file products.csv --dry-run
```

## Post-Migration Tasks

### 1. Verify Data Integrity

```bash
# Check for missing required fields
python manage.py check_data_integrity

# Verify account balances
python manage.py verify_balances

# Check for orphaned records
python manage.py find_orphaned_records
```

### 2. Configure Zimbabwe-Specific Settings

#### ZIMRA Fiscal Device
1. Go to Django Admin: `/admin/`
2. Navigate to: ERP → ZIMRA Virtual Fiscal Devices
3. Add New Device:
   - Device ID: [Your ZIMRA device ID]
   - API URL: [ZIMRA API endpoint]
   - Certificate: Upload certificate
   - Status: Active

#### Payment Gateways

1. **EcoCash Configuration**
   - Navigate to: Payment Gateways
   - Add EcoCash
   - Enter Merchant Code
   - Enter API Key
   - Set API URL
   - Test Mode: Yes (for testing)

2. **OneMoney Configuration**
   - Add OneMoney gateway
   - Configure credentials
   - Test connection

3. **Innbucks Configuration**
   - Add Innbucks gateway
   - Configure terminal ID
   - Test connection

### 3. Setup Users and Permissions

```bash
# Create department managers
python manage.py shell
>>> from erp.models import User, Department
>>> dept = Department.objects.get(name='Sales')
>>> user = User.objects.create_user(
...     username='sales_manager',
...     email='sales@company.com',
...     role='employee',
...     department=dept
... )
```

### 4. Configure Email Settings

Update `settings.py`:

```python
# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'noreply@yourcompany.com'
```

### 5. Setup Scheduled Tasks

```bash
# Configure Celery Beat schedule
# In settings.py

CELERY_BEAT_SCHEDULE = {
    'sync-fiscal-receipts': {
        'task': 'erp.tasks.sync_fiscal_receipts',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    'send-leave-reminders': {
        'task': 'erp.tasks.send_leave_reminders',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
    'generate-reports': {
        'task': 'erp.tasks.generate_scheduled_reports',
        'schedule': crontab(hour=0, minute=0),  # Daily at midnight
    },
}
```

### 6. Initial System Health Check

```bash
# Run system checks
python manage.py check --deploy

# Check for security issues
python manage.py check --deploy --tag security

# Verify all services
python manage.py verify_services
```

## Troubleshooting

### Common Issues

#### Migration Errors

**Issue**: Duplicate migration dependencies
```bash
# Solution: Squash migrations
python manage.py squashmigrations erp 0001 0050
```

**Issue**: Foreign key constraint errors
```bash
# Solution: Migrate in order
python manage.py migrate erp 0001
python manage.py migrate erp  # Apply rest
```

#### Import Errors

**Issue**: Circular import errors
```python
# Solution: Use string references for ForeignKey
class MyModel(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE)
```

**Issue**: Missing dependencies
```bash
# Solution: Install missing packages
pip install -r requirements.txt
pip check  # Verify all dependencies
```

#### Performance Issues

**Issue**: Slow queries
```bash
# Solution: Create database indexes
python manage.py migrate  # Ensures all indexes are created

# Or manually in PostgreSQL:
CREATE INDEX idx_transaction_date ON erp_transaction(date);
```

**Issue**: High memory usage
```bash
# Solution: Optimize Celery
celery -A backend worker --max-memory-per-child=200000
```

### Getting Help

1. **Check Logs**
   ```bash
   # Django logs
   tail -f backend/logs/debug.log
   
   # Celery logs
   tail -f backend/logs/celery.log
   ```

2. **Debug Mode**
   ```python
   # In settings.py (DEVELOPMENT ONLY)
   DEBUG = True
   LOGGING['root']['level'] = 'DEBUG'
   ```

3. **Database Queries**
   ```bash
   # Enable query logging
   python manage.py runserver --settings=backend.settings_debug
   ```

4. **Contact Support**
   - Email: support@financeplus.co.zw
   - Phone: +263 4 123 4567
   - Documentation: https://docs.financeplus.co.zw

## Rollback Procedure

If something goes wrong:

### Step 1: Stop Services
```bash
# Stop Django
pkill -f runserver

# Stop Celery
pkill -f celery
```

### Step 2: Restore Database

#### PostgreSQL
```bash
dropdb financeplus
createdb financeplus
psql financeplus < backup_YYYYMMDD.sql
```

#### SQLite
```bash
cp db.sqlite3.backup db.sqlite3
```

#### Using Django dump
```bash
python manage.py flush  # Clear database
python manage.py loaddata backup_YYYYMMDD.json
```

### Step 3: Revert Code
```bash
git log  # Find previous commit
git checkout [commit-hash]
```

### Step 4: Restart Services
```bash
python manage.py runserver
celery -A backend worker -l info
```

## Best Practices

1. **Always Backup Before Migration**
2. **Test on Staging First**
3. **Run Migrations During Low Traffic**
4. **Monitor System After Migration**
5. **Keep Documentation Updated**
6. **Train Users on New Features**
7. **Have Rollback Plan Ready**

## Performance Optimization

### Database

```sql
-- PostgreSQL optimizations
ALTER DATABASE financeplus SET work_mem = '256MB';
ALTER DATABASE financeplus SET maintenance_work_mem = '512MB';
CREATE INDEX CONCURRENTLY idx_fiscal_receipt_date ON erp_fiscalreceipt(receipt_date);
```

### Django

```python
# settings.py
CONN_MAX_AGE = 600  # Keep database connections
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### Celery

```python
# Optimize Celery
CELERY_BROKER_POOL_LIMIT = 10
CELERY_RESULT_BACKEND = 'redis://localhost:6379/2'
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_ALWAYS_EAGER = False
```

---

**Need Help?** Contact our migration support team at migrations@financeplus.co.zw

