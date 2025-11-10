# 🚀 Quick Start Guide - Finance Plus ERP

## System Overview
Finance Plus is a comprehensive ERP system built for Zimbabwean businesses with features comparable to ERPNext, SAP, and QuickBooks. It includes advanced modules for financial management, supply chain, CRM, HR, and Zimbabwe-specific compliance features.

## Prerequisites

### Backend Requirements
- Python 3.8+
- PostgreSQL 12+ (or SQLite for development)
- Redis (for Celery tasks)

### Frontend Requirements
- Node.js 16+
- npm or yarn

## 🎯 Quick Start (Development)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data (optional)
python manage.py setup_extended_erp

# Start development server
python manage.py runserver
```

The backend will be available at: **http://localhost:8000**

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: **http://localhost:5173**

## 🔐 Default Login

After creating a superuser, use those credentials to login:
- **URL**: http://localhost:5173/login
- **Username**: (your superuser username)
- **Password**: (your superuser password)

## 📋 Available Modules

### Finance Module
- ✅ Transactions Management
- ✅ Budget Management
- ✅ Fixed Asset Register
- ✅ General Ledger
- ✅ Accounts Payable
- ✅ Accounts Receivable
- ✅ Banking Integration
- ✅ Mobile Money Payments (EcoCash, OneMoney, Innbucks)
- ✅ Multi-currency Support

### Sales & CRM Module
- ✅ Lead Management
- ✅ Opportunity Pipeline
- ✅ Quotation Management
- ✅ Customer Relationship Management
- ✅ Sales Orders
- ✅ Fiscal Invoices (ZIMRA Compliant)

### Supply Chain Module
- ✅ Vendor Management
- ✅ Purchase Order Management
- ✅ Procurement Workflow
- ✅ Inventory Management
- ✅ Stock Tracking
- ✅ Warehouse Management

### HR Module
- ✅ Employee Management
- ✅ Leave Management
- ✅ Attendance Tracking
- ✅ Payroll Processing
- ✅ Performance Management
- ✅ Recruitment

### Operations Module
- ✅ Manufacturing Management
- ✅ Point of Sale (POS)
- ✅ Project Management
- ✅ Store Management

### Document Management
- ✅ Document Upload & Storage
- ✅ Document Templates
- ✅ Version Control
- ✅ Tag-based Organization
- ✅ Letter Generation

### Compliance & Reporting
- ✅ ZIMRA Compliance
- ✅ Fiscal Device Integration
- ✅ VAT Returns
- ✅ PAYE Calculations
- ✅ NSSA Contributions
- ✅ Audit Logs
- ✅ Comprehensive Reports
- ✅ Analytics Dashboard

## 🗺️ Navigation Guide

### Accessing Features

After login, use the sidebar navigation to access different modules:

#### Finance Section
- Transactions → `/transactions`
- Budget Management → `/finance/budget-management`
- Fixed Assets → `/finance/fixed-assets`
- Mobile Payments → `/finance/mobile-money-payments`

#### Sales & CRM Section
- Lead Management → `/crm/leads`
- Sales Pipeline → `/crm/opportunities`
- Quotations → `/sales/quotations`
- Fiscal Invoices → `/sales/fiscalisation-invoices`

#### Supply Chain Section
- Vendor Management → `/supply-chain/vendors`
- Purchase Orders → `/supply-chain/purchase-orders`
- Procurement → `/procurement`
- Inventory → `/inventory`

#### HR Section
- HRM Dashboard → `/hrm`
- Leave Management → `/hr/leave-management`
- Attendance Tracking → `/hr/attendance`
- Payroll → `/payroll`

#### Documents Section
- Document Management → `/documents`
- Document Templates → `/document-templates`
- Generated Documents → `/generated-documents`

#### Compliance Section
- ZIMRA Compliance → `/compliance/zimra`
- Audit Logs → `/audit-logs`

## 🔧 Configuration

### Backend Configuration

Edit `backend/backend/settings.py` for:

1. **Database Settings**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'finance_plus_db',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

2. **ZIMRA Configuration**
```python
ZIMRA_API_URL = 'https://fdms.zimra.co.zw/api'
ZIMRA_API_KEY = 'your_zimra_api_key'
ZIMRA_DEVICE_ID = 'your_device_id'
```

3. **Mobile Money Configuration**
```python
ECOCASH_API_KEY = 'your_ecocash_api_key'
ONEMONEY_API_KEY = 'your_onemoney_api_key'
INNBUCKS_API_KEY = 'your_innbucks_api_key'
```

### Frontend Configuration

Edit `frontend/src/services/api.ts` for:

1. **API Base URL**
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

2. **For Production**
```typescript
const API_BASE_URL = 'https://your-domain.com/api';
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📦 Production Deployment

### Backend Deployment

1. **Collect Static Files**
```bash
python manage.py collectstatic --no-input
```

2. **Set Production Settings**
```python
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']
```

3. **Use Gunicorn**
```bash
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
```

4. **Setup Celery Workers**
```bash
celery -A backend worker -l info
celery -A backend beat -l info
```

### Frontend Deployment

1. **Build for Production**
```bash
npm run build
```

2. **Deploy to Web Server**
```bash
# Copy dist folder to your web server
cp -r dist/* /var/www/html/
```

## 🔐 Security Checklist

- [ ] Change default SECRET_KEY in Django settings
- [ ] Set DEBUG = False in production
- [ ] Configure proper ALLOWED_HOSTS
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Setup secure database passwords
- [ ] Enable rate limiting
- [ ] Setup backup system
- [ ] Configure firewall rules
- [ ] Setup logging and monitoring

## 📱 Mobile Access

The system is fully responsive and works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktops

Access the same URL from any device!

## 🎯 Key Features

### Zimbabwe-Specific Features
✅ Multi-currency support (USD, ZWL, ZAR)
✅ Mobile money integration (EcoCash, OneMoney, Innbucks)
✅ ZIMRA fiscal device integration
✅ VAT returns generation
✅ PAYE calculations
✅ NSSA contribution tracking
✅ Exchange rate management

### Business Features
✅ Complete financial management
✅ Supply chain optimization
✅ Customer relationship management
✅ Human resource management
✅ Manufacturing & operations
✅ Document management system
✅ Workflow automation
✅ Real-time analytics
✅ Audit trail
✅ Role-based access control

## 🆘 Troubleshooting

### Backend Issues

**Database Connection Error**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
psql -l
```

**Migration Errors**
```bash
# Reset migrations (development only)
python manage.py migrate --fake
python manage.py migrate
```

**Port Already in Use**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**npm install Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**API Connection Error**
- Check backend is running on port 8000
- Check CORS configuration in backend
- Verify API_BASE_URL in frontend

**Build Errors**
```bash
# Clear build cache
rm -rf dist
npm run build
```

## 📚 Documentation

- **Backend API**: http://localhost:8000/api/swagger/
- **Frontend Guide**: `FRONTEND_IMPLEMENTATION_GUIDE.md`
- **Implementation Details**: `FRONTEND_IMPLEMENTATION_COMPLETE.md`
- **Backend Summary**: `IMPLEMENTATION_SUMMARY.md`

## 🎓 Learning Resources

1. **Django REST Framework**: https://www.django-rest-framework.org/
2. **React Documentation**: https://react.dev/
3. **TypeScript**: https://www.typescriptlang.org/
4. **Tailwind CSS**: https://tailwindcss.com/

## 💡 Tips for Success

1. **Start with Dashboard**: Familiarize yourself with the overview
2. **Setup Master Data First**: Add vendors, customers, employees
3. **Configure Settings**: Currency, cost centers, tax rates
4. **Test Workflows**: Try creating a quotation → sales order → invoice
5. **Use Filters**: Each page has powerful filtering options
6. **Search Navigation**: Use the search box in sidebar
7. **Check Stats**: Dashboard cards show real-time statistics
8. **Enable Notifications**: Toast notifications show operation results

## 🌟 Best Practices

### For Administrators
- Regularly backup the database
- Monitor audit logs for suspicious activity
- Review and update user permissions
- Keep the system updated
- Configure email notifications

### For Users
- Use filters to find data quickly
- Save frequently used reports
- Keep documents organized with tags
- Review pending approvals daily
- Use mobile app for on-the-go access

## 📞 Support & Help

### Getting Help
1. Check documentation in `/docs` folder
2. Review implementation guides
3. Check browser console for errors
4. Verify API endpoints are responding
5. Review Django logs

### Reporting Issues
When reporting issues, include:
- Browser/Device information
- Steps to reproduce
- Error messages
- Screenshots
- API response (if applicable)

## 🎉 You're Ready!

The Finance Plus ERP system is now ready to use. Start by:
1. ✅ Logging in
2. ✅ Exploring the dashboard
3. ✅ Setting up master data
4. ✅ Creating your first transaction
5. ✅ Inviting team members

---

**Welcome to Finance Plus ERP - Built for Zimbabwe, Built for Success!** 🇿🇼

For questions or support, refer to the comprehensive documentation provided in the project root.

