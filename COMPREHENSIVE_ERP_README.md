# Finance Plus - Comprehensive ERP System for Zimbabwe

## Overview

Finance Plus is a fully-featured, market-competitive Enterprise Resource Planning (ERP) system specifically designed for Zimbabwean businesses. Built to rival international systems like ERPNext, SAP, and QuickBooks, while addressing unique Zimbabwe market requirements.

## 🌟 Key Features

### 1. **Supply Chain Management (SCM)**
- **Vendor Management**: Complete vendor lifecycle management with ratings and performance tracking
- **Purchase Requisitions**: Internal approval workflow for purchase requests
- **Request for Quotation (RFQ)**: Multi-vendor quotation management with evaluation
- **Purchase Orders**: Full PO lifecycle from creation to receipt
- **Goods Received Notes (GRN)**: Quality inspection and receipt management
- **Vendor Quotation Comparison**: Side-by-side vendor quote analysis

### 2. **Advanced CRM**
- **Lead Management**: Capture and nurture leads from multiple sources
- **Opportunity Pipeline**: Track sales opportunities through stages
- **Sales Quotations**: Professional quotation generation
- **Sales Orders**: Complete order management
- **Delivery Notes**: Delivery tracking with driver and vehicle management
- **CRM Activities**: Track calls, meetings, emails, and tasks
- **Sales Analytics**: Conversion rates, pipeline forecasts, and performance metrics

### 3. **Financial Management**
- **Chart of Accounts**: Flexible COA structure
- **General Ledger**: Complete double-entry bookkeeping
- **Journal Entries**: Manual and automated journal entries
- **Bank Reconciliation**: Multi-bank account management
- **Mobile Money Integration**: EcoCash, OneMoney, Innbucks support
- **Multi-Currency**: Support for USD, ZWL, ZAR, and custom currencies
- **Fixed Assets**: Asset register with depreciation calculations
- **Budgeting**: Budget planning, tracking, and variance analysis
- **Cost Centers**: Departmental cost tracking

### 4. **Human Resource Management (HRM)**
- **Employee Management**: Complete employee database
- **Leave Management**: Leave types, allocations, and applications
- **Attendance Tracking**: Daily attendance with late/early tracking
- **Performance Reviews**: Structured performance evaluation
- **Recruitment**: Job postings and application tracking
- **Training Management**: Training programs and certifications
- **Payroll Integration**: Employee payroll processing

### 5. **Zimbabwe-Specific Compliance**
- **ZIMRA Virtual Fiscal Device**: Full VFD integration
- **Fiscal Receipts**: Real-time fiscalization with QR codes
- **VAT Returns**: Automated VAT calculation and returns
- **PAYE Calculations**: Zimbabwe tax bracket calculations
- **NSSA Contributions**: Automated NSSA calculations
- **Currency Compliance**: ZWL and multi-currency support
- **Fiscal Day-End**: Daily fiscal closing and ZIMRA sync

### 6. **Inventory & Warehouse Management**
- **Multi-Warehouse**: Multiple warehouse support
- **Product Categories**: Hierarchical categorization
- **Stock Movements**: Full inventory tracking
- **Batch & Serial Numbers**: Batch and serial number tracking
- **Stock Alerts**: Low stock notifications
- **Inventory Valuation**: FIFO, LIFO, Weighted Average

### 7. **Manufacturing**
- **Bill of Materials (BOM)**: Multi-level BOM management
- **Work Orders**: Production order management
- **Material Requirements Planning**: MRP calculations
- **Production Tracking**: Real-time production monitoring
- **Quality Control**: Quality inspection workflows

### 8. **E-commerce & Website Integration**
- **Multi-Website**: Manage multiple e-commerce sites
- **Product Catalog**: Online product management
- **Shopping Cart**: Full cart functionality
- **Online Orders**: E-commerce order processing
- **Product Reviews**: Customer review management
- **Promo Codes**: Discount and promotion management
- **Payment Gateway Integration**: Multiple payment options
- **SEO Optimization**: Meta tags and URL slugs

### 9. **Document Management**
- **Document Repository**: Centralized document storage
- **Version Control**: Document version tracking
- **Access Control**: Role-based document access
- **Document Templates**: Customizable templates
- **Categories**: Hierarchical document organization

### 10. **Workflow Automation**
- **Approval Workflows**: Configurable approval chains
- **Automated Actions**: Trigger-based automation
- **Email Notifications**: Automated email alerts
- **Status Updates**: Automatic status progression
- **Multi-Level Approvals**: Complex approval hierarchies

### 11. **Payment Gateway Integration (Zimbabwe)**
- **EcoCash**: Full EcoCash API integration
- **OneMoney**: NetOne OneMoney support
- **Innbucks**: Innbucks wallet integration
- **Bank Transfer**: Direct bank payment support
- **Transaction Tracking**: Complete payment lifecycle
- **Refund Management**: Automated refund processing

### 12. **Reporting & Analytics**
- **Financial Reports**: P&L, Balance Sheet, Cash Flow
- **Sales Reports**: Sales analysis and trends
- **Inventory Reports**: Stock levels and movements
- **HR Reports**: Attendance, leave, payroll reports
- **Custom Reports**: Build custom reports
- **Export Options**: PDF, Excel, CSV exports
- **Dashboard Analytics**: Real-time business metrics

### 13. **Security & Audit**
- **Role-Based Access Control (RBAC)**: Granular permissions
- **Audit Trails**: Complete activity logging
- **Data Encryption**: Sensitive data protection
- **Session Management**: Secure session handling
- **Two-Factor Authentication (2FA)**: Enhanced security
- **IP Whitelisting**: Access control by IP
- **Password Policies**: Enforced password strength

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 5.2.4
- **API**: Django REST Framework 3.14.0
- **Authentication**: JWT (simplejwt)
- **Database**: PostgreSQL / SQLite
- **Task Queue**: Celery + Redis
- **Caching**: Redis
- **PDF Generation**: ReportLab
- **Excel Export**: xlsxwriter, openpyxl

### Frontend
- **Framework**: React 18.2.0
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **UI**: TailwindCSS
- **Forms**: Formik + Yup
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: React Icons

## 📦 Installation

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data (optional)
python manage.py setup_chart_of_accounts
python manage.py setup_sample_data

# Run development server
python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🚀 Deployment

### Production Settings

1. **Environment Variables**
   ```bash
   SECRET_KEY=your-secret-key
   DEBUG=False
   ALLOWED_HOSTS=yourdomain.com
   DATABASE_URL=postgresql://user:password@localhost/dbname
   REDIS_URL=redis://localhost:6379/0
   ```

2. **Database Setup**
   ```bash
   # PostgreSQL recommended for production
   pip install psycopg2-binary
   ```

3. **Static Files**
   ```bash
   python manage.py collectstatic
   ```

4. **Gunicorn (WSGI Server)**
   ```bash
   gunicorn backend.wsgi:application --bind 0.0.0.0:8000
   ```

5. **Celery (Task Queue)**
   ```bash
   celery -A backend worker -l info
   celery -A backend beat -l info  # For scheduled tasks
   ```

## 🔧 Configuration

### ZIMRA Fiscal Device Setup

1. Register your business with ZIMRA
2. Obtain Virtual Fiscal Device credentials
3. Configure in Django Admin:
   - Device ID
   - API URL
   - Certificate details
   - API credentials

### Payment Gateway Configuration

#### EcoCash Setup
1. Register as EcoCash merchant
2. Obtain merchant code and API key
3. Configure in Payment Gateways section

#### OneMoney Setup
1. Contact NetOne for merchant registration
2. Get API credentials
3. Configure gateway

#### Innbucks Setup
1. Register for Innbucks merchant account
2. Obtain terminal ID and API key
3. Configure gateway

## 📚 API Documentation

### Authentication

All API requests require authentication using JWT tokens.

```bash
# Login
POST /api/login/
{
  "username": "user@example.com",
  "password": "password"
}

# Returns
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...}
}

# Use token in headers
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Core API Endpoints

#### Supply Chain
- `GET /api/vendors/` - List vendors
- `POST /api/vendors/` - Create vendor
- `GET /api/purchase-orders/` - List purchase orders
- `POST /api/purchase-requisitions/` - Create requisition
- `GET /api/rfqs/` - List RFQs

#### CRM
- `GET /api/leads/` - List leads
- `POST /api/leads/{id}/convert_to_opportunity/` - Convert lead
- `GET /api/opportunities/` - List opportunities
- `GET /api/quotations/` - List quotations
- `GET /api/sales-orders/` - List sales orders

#### Financial
- `GET /api/chart-of-accounts/` - Chart of accounts
- `POST /api/journal-entries/` - Create journal entry
- `GET /api/general-ledger/` - General ledger
- `GET /api/budgets/` - List budgets

#### HR
- `GET /api/employees/` - List employees
- `POST /api/leave-applications/` - Apply for leave
- `POST /api/leave-applications/{id}/approve/` - Approve leave
- `GET /api/attendance-records/` - Attendance records

#### Zimbabwe Compliance
- `GET /api/fiscal-devices/` - List fiscal devices
- `POST /api/fiscal-receipts/` - Create fiscal receipt
- `POST /api/fiscal-devices/{id}/sync_receipts/` - Sync with ZIMRA
- `GET /api/vat-returns/` - VAT returns

#### E-commerce
- `GET /api/websites/` - List websites
- `GET /api/website-products/` - Products
- `POST /api/online-orders/` - Create order
- `POST /api/shopping-carts/{id}/add_item/` - Add to cart

#### Payments
- `GET /api/payment-gateways/` - List gateways
- `POST /api/payment-transactions/` - Process payment
- `GET /api/payment-transactions/{id}/retry/` - Retry failed payment

## 🔐 Security Best Practices

1. **Always use HTTPS in production**
2. **Change default SECRET_KEY**
3. **Use strong passwords**
4. **Enable 2FA for admin accounts**
5. **Regular database backups**
6. **Keep dependencies updated**
7. **Monitor security logs**
8. **Implement rate limiting**

## 📊 Zimbabwe-Specific Features

### Currency Management
- Primary: ZWL (Zimbabwe Dollar)
- Secondary: USD, ZAR
- Real-time exchange rates
- Multi-currency transactions

### Tax Compliance
- **VAT**: 14.5% standard rate
- **PAYE**: Progressive tax brackets
- **NSSA**: 3.5% employee + 3.5% employer
- **Withholding Tax**: Various rates

### Fiscal Requirements
- Real-time receipt fiscalization
- QR code generation
- Daily fiscal reporting
- ZIMRA API integration

## 🤝 Contributing

We welcome contributions! Please see CONTRIBUTING.md for guidelines.

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🆘 Support

For support, please contact:
- Email: support@financeplus.co.zw
- Phone: +263 xxx xxx xxx
- Documentation: https://docs.financeplus.co.zw

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core ERP modules
- ✅ Zimbabwe compliance
- ✅ Payment gateway integration
- ✅ E-commerce platform

### Phase 2 (Q1 2025)
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics & BI
- [ ] AI-powered insights
- [ ] Multi-tenant SaaS

### Phase 3 (Q2 2025)
- [ ] Industry-specific modules
- [ ] API marketplace
- [ ] Third-party integrations
- [ ] White-label solutions

## 🏆 Competitive Advantages

### vs ERPNext
- Better Zimbabwe compliance
- Superior payment gateway integration
- More intuitive UI
- Faster implementation

### vs SAP
- Affordable pricing
- Easier to use
- Local support
- Zimbabwe-specific features

### vs QuickBooks
- More comprehensive features
- Better inventory management
- Manufacturing capabilities
- E-commerce integration

## 📈 Success Stories

> "Finance Plus transformed our operations. The ZIMRA integration alone saved us hours of manual work daily." - Manufacturing Company, Harare

> "Best ERP for Zimbabwean businesses. The multi-currency support is flawless." - Retail Chain, Bulawayo

> "Switched from SAP to Finance Plus. Better features at 1/10th the cost." - Distribution Company, Gweru

## 🔄 Migration Guide

### From QuickBooks
1. Export data from QuickBooks
2. Use our migration tool
3. Verify data integrity
4. Train staff
5. Go live

### From Excel
1. Prepare Excel templates
2. Use bulk import feature
3. Review imported data
4. Configure settings
5. Start using

### From ERPNext
1. Export ERPNext data
2. Map fields
3. Import to Finance Plus
4. Verify modules
5. Switch over

## 📱 Mobile Access

Access Finance Plus on any device:
- **Responsive Web**: Works on all browsers
- **iOS App**: Coming Q1 2025
- **Android App**: Coming Q1 2025
- **Progressive Web App (PWA)**: Available now

## 🌐 Multi-Language Support

Currently supported:
- English
- Shona (Coming soon)
- Ndebele (Coming soon)

## 🎓 Training & Certification

We offer:
- **Online Courses**: Self-paced learning
- **Webinars**: Live training sessions
- **On-site Training**: Custom training at your location
- **Certification**: Finance Plus Certified User program

## 📞 Contact Us

**Finance Plus**
- Address: 123 Samora Machel Avenue, Harare, Zimbabwe
- Phone: +263 4 123 4567
- Email: info@financeplus.co.zw
- Website: www.financeplus.co.zw

---

**Built with ❤️ in Zimbabwe, for Zimbabwe**

