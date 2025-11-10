# Finance Plus

A modern financial management system built with Django and React.

## Features

- User authentication and authorization
- Financial transaction management
- Inventory tracking
- Sales and purchase management
- Payroll processing
- Tax management
- Reporting and analytics
- Document generation

## Tech Stack

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Celery (for async tasks)

### Frontend
- React 18
- TypeScript
- React Query
- React Router
- Tailwind CSS
- Vite

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis (for Celery)

## Installation

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Start the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

## Development

### Backend Development

- Run tests: `python manage.py test`
- Check code style: `flake8`
- Generate migrations: `python manage.py makemigrations`

### Frontend Development

- Run tests: `npm test`
- Check code style: `npm run lint`
- Build for production: `npm run build`

## Deployment

### Backend Deployment

1. Set up a production environment:
```bash
export DJANGO_SETTINGS_MODULE=backend.settings.production
```

2. Collect static files:
```bash
python manage.py collectstatic
```

3. Run migrations:
```bash
python manage.py migrate
```

### Frontend Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Serve the built files using a web server (e.g., Nginx)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@financeplus.com or create an issue in the repository. 