# Finance Plus - Development Guide

This guide will help you set up and run the Finance Plus application for development.

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
- npm (Node.js package manager)

## Project Structure

```
finance-plus/
├── frontend/          # React TypeScript frontend
├── backend/           # Django Python backend
├── start-dev.sh       # Development startup script
└── DEVELOPMENT.md     # This file
```

## Quick Start

### 1. Install Dependencies

**Backend (Django):**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend (React):**
```bash
cd frontend
npm install
```

### 2. Environment Setup

**Backend Environment:**
Create a `.env` file in the `backend` directory:
```bash
cd backend
cp .env.example .env  # if available
```

**Frontend Environment:**
Create a `.env` file in the `frontend` directory:
```bash
cd frontend
echo "VITE_API_URL=http://localhost:8000/api" > .env
```

### 3. Database Setup

**Backend Database:**
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser  # Create admin user
```

### 4. Start Development Servers

**Option 1: Use the startup script (Recommended)**
```bash
./start-dev.sh
```

**Option 2: Start servers manually**

Terminal 1 (Backend):
```bash
cd backend
python manage.py runserver
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/docs (if available)

## API Endpoints

The backend provides the following main API endpoints:

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile

### Transactions
- `GET /api/transactions/` - List transactions
- `POST /api/transactions/` - Create transaction
- `GET /api/transactions/{id}/` - Get transaction details
- `PUT /api/transactions/{id}/` - Update transaction
- `DELETE /api/transactions/{id}/` - Delete transaction

### Users
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

## Development Workflow

### Frontend Development

1. **Component Development**: Create new components in `frontend/src/components/`
2. **Page Development**: Create new pages in `frontend/src/pages/`
3. **Service Integration**: Use services in `frontend/src/services/` for API calls
4. **State Management**: Use Redux store in `frontend/src/store/`

### Backend Development

1. **Model Changes**: Update models in `backend/erp/models.py`
2. **API Views**: Update views in `backend/erp/views.py`
3. **URLs**: Update URL patterns in `backend/erp/urls.py`
4. **Migrations**: Run `python manage.py makemigrations` and `python manage.py migrate`

## Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
python manage.py test
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Frontend: Change port in `vite.config.ts`
   - Backend: Use `python manage.py runserver 8001`

2. **CORS Issues**
   - Ensure Django CORS settings are configured properly
   - Check that frontend is making requests to the correct backend URL

3. **Database Issues**
   - Run `python manage.py migrate` to apply pending migrations
   - Check database connection settings in `settings.py`

4. **Authentication Issues**
   - Clear browser localStorage
   - Check that JWT tokens are being sent correctly
   - Verify backend authentication endpoints are working

### Debug Mode

**Frontend Debug:**
- Open browser DevTools
- Check Network tab for API requests
- Check Console for JavaScript errors

**Backend Debug:**
- Check Django logs in terminal
- Use Django Debug Toolbar (if installed)
- Check database queries in Django shell

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Finance Plus
VITE_DEV_MODE=true
```

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues and questions:
1. Check this documentation
2. Review the code comments
3. Check the API documentation
4. Create an issue in the repository 