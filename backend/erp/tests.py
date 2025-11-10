from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Department, Employee, Payroll

User = get_user_model()

class AuthTests(APITestCase):
    def test_signup_and_login(self):
        signup_url = reverse('signup')
        login_url = reverse('login')
        data = {
            'email': 'testuser@example.com',
            'password': 'testpass123',
            'role': 'ADMIN'
        }
        # Signup
        response = self.client.post(signup_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Login
        response = self.client.post(login_url, {'email': data['email'], 'password': data['password']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

class DepartmentTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email='admin@example.com', password='adminpass', role='ADMIN', is_staff=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.url = reverse('department-list')

    def test_create_department(self):
        response = self.client.post(self.url, {'name': 'HR'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_departments(self):
        Department.objects.create(name='Finance')
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

class EmployeeTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email='admin2@example.com', password='adminpass', role='ADMIN', is_staff=True)
        self.department = Department.objects.create(name='IT')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.url = reverse('employee-list')

    def test_create_employee(self):
        user = User.objects.create_user(email='emp@example.com', password='emppass', role='EMPLOYEE')
        data = {
            'user': user.id,
            'department': self.department.id,
            'position': 'Developer',
            'salary': 1000
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class PayrollTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email='admin3@example.com', password='adminpass', role='ADMIN', is_staff=True)
        self.department = Department.objects.create(name='Payroll')
        self.employee_user = User.objects.create_user(email='payemp@example.com', password='paypass', role='EMPLOYEE')
        self.employee = Employee.objects.create(user=self.employee_user, department=self.department, position='Clerk', salary=1200)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.url = reverse('payroll-list')

    def test_create_payroll(self):
        data = {
            'employee': self.employee.id,
            'gross_salary': 1200,
            'payment_date': '2023-01-01'
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

# Add more tests for other endpoints as needed
