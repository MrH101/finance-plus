# Finance Plus - Testing Guide

This guide provides step-by-step instructions for testing the Finance Plus application, including the routing flow and backend integration.

## Prerequisites

Before testing, ensure you have:
1. ✅ Backend server running on `http://localhost:8000`
2. ✅ Frontend server running on `http://localhost:5173`
3. ✅ Database migrated and superuser created
4. ✅ Environment variables configured

## Quick Setup Verification

### 1. Check Server Status

**Backend:**
```bash
curl http://localhost:8000/api/
# Should return API information or 404 (both are OK)
```

**Frontend:**
```bash
curl http://localhost:5173/
# Should return HTML content
```

### 2. Test API Endpoints

Run the API test script:
```bash
./test-api.sh
```

## Routing Flow Testing

### Test Scenario 1: New User Registration Flow

**Steps:**
1. **Navigate to Frontend**: Open `http://localhost:5173` in browser
2. **Redirect Check**: Should automatically redirect to `/login`
3. **Click Register**: Click "Register" link in login page
4. **Signup Form**: Fill out the registration form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Phone: `1234567890`
   - Password: `testpass123`
   - Confirm Password: `testpass123`
5. **Submit Form**: Click "Create Account"
6. **Success Check**: Should redirect to dashboard with success message
7. **Token Verification**: Check browser DevTools → Application → Local Storage for `token`

**Expected Results:**
- ✅ Form validation works
- ✅ API call to `/api/auth/signup/` succeeds
- ✅ JWT token stored in localStorage
- ✅ Redirect to dashboard
- ✅ Success toast message displayed

### Test Scenario 2: Existing User Login Flow

**Steps:**
1. **Navigate to Login**: Go to `http://localhost:5173/login`
2. **Login Form**: Fill out login form:
   - Email: `test@example.com`
   - Password: `testpass123`
3. **Submit Form**: Click "Login"
4. **Success Check**: Should redirect to dashboard
5. **Token Verification**: Check localStorage for `token`

**Expected Results:**
- ✅ Form validation works
- ✅ API call to `/api/auth/login/` succeeds
- ✅ JWT token stored in localStorage
- ✅ Redirect to dashboard
- ✅ Success toast message displayed

### Test Scenario 3: Protected Route Access

**Steps:**
1. **Login First**: Complete login flow from Scenario 2
2. **Direct URL Access**: Try accessing `http://localhost:5173/settings` directly
3. **Navigation Test**: Use sidebar to navigate between pages:
   - Dashboard (`/`)
   - Users (`/users`)
   - Transactions (`/transactions`)
   - Reports (`/reports`)
   - Settings (`/settings`)

**Expected Results:**
- ✅ All protected routes accessible when authenticated
- ✅ Sidebar navigation works correctly
- ✅ Active page highlighted in sidebar
- ✅ Layout consistent across all pages

### Test Scenario 4: Logout Flow

**Steps:**
1. **Login First**: Complete login flow
2. **Navigate**: Go to any protected page
3. **Logout**: Click logout button in header
4. **Redirect Check**: Should redirect to login page
5. **Token Cleanup**: Check that tokens are removed from localStorage

**Expected Results:**
- ✅ Logout button visible in header
- ✅ API call to `/api/auth/logout/` (optional)
- ✅ Tokens removed from localStorage
- ✅ Redirect to login page
- ✅ Success toast message displayed

### Test Scenario 5: Unauthenticated Access

**Steps:**
1. **Clear Storage**: Clear browser localStorage
2. **Direct Access**: Try accessing `http://localhost:5173/settings` directly
3. **Redirect Check**: Should redirect to login page

**Expected Results:**
- ✅ Automatic redirect to login page
- ✅ No access to protected routes without authentication

## Feature Testing

### Dashboard Testing

**Steps:**
1. **Login**: Complete login flow
2. **Dashboard Access**: Navigate to dashboard
3. **Content Check**: Verify dashboard shows:
   - Welcome message with user name/email
   - Quick stats cards (Revenue, Users, Growth, Transactions)
   - Proper layout with sidebar

**Expected Results:**
- ✅ Dashboard loads without errors
- ✅ Stats cards display correctly
- ✅ Layout responsive on different screen sizes

### Users Management Testing

**Steps:**
1. **Navigate**: Go to Users page
2. **Data Table**: Check if users are displayed in table
3. **Add User**: Click "Add User" button
4. **Modal Form**: Fill out user creation form
5. **Submit**: Create new user
6. **Edit User**: Click edit icon on any user row
7. **Delete User**: Click delete icon and confirm

**Expected Results:**
- ✅ Users table displays correctly
- ✅ Add user modal opens and works
- ✅ Form validation works
- ✅ API calls succeed
- ✅ Table updates after operations
- ✅ Success/error messages displayed

### Transactions Testing

**Steps:**
1. **Navigate**: Go to Transactions page
2. **Data Display**: Check if transactions are displayed
3. **Filtering**: Test filter dropdown (All/Income/Expense)
4. **Add Transaction**: Click "Add Transaction" button
5. **Modal Form**: Fill out transaction form
6. **Submit**: Create new transaction

**Expected Results:**
- ✅ Transactions list displays correctly
- ✅ Filtering works
- ✅ Add transaction modal works
- ✅ Form validation works
- ✅ API calls succeed
- ✅ List updates after operations

### Reports Testing

**Steps:**
1. **Navigate**: Go to Reports page
2. **Time Range**: Test time range selector (Week/Month/Year)
3. **Stats Cards**: Check income, expenses, and net balance cards
4. **Category Breakdown**: Check category breakdown section

**Expected Results:**
- ✅ Reports page loads without errors
- ✅ Time range selector works
- ✅ Stats cards display correct calculations
- ✅ Category breakdown shows data

### Settings Testing

**Steps:**
1. **Navigate**: Go to Settings page
2. **Form Fields**: Test all form fields:
   - Name input
   - Email input
   - Currency selector
   - Language selector
   - Theme selector
   - Notification checkboxes
3. **Save Changes**: Submit the form

**Expected Results:**
- ✅ All form fields work correctly
- ✅ Form validation works
- ✅ Settings save successfully
- ✅ Success message displayed

## Error Handling Testing

### Network Error Testing

**Steps:**
1. **Stop Backend**: Stop the Django server
2. **Try Operations**: Attempt to login, create users, etc.
3. **Error Messages**: Check if proper error messages are displayed
4. **Restart Backend**: Start Django server again
5. **Retry Operations**: Verify operations work after restart

**Expected Results:**
- ✅ Proper error messages displayed
- ✅ No application crashes
- ✅ Operations work after backend restart

### Invalid Data Testing

**Steps:**
1. **Invalid Login**: Try logging in with wrong credentials
2. **Invalid Signup**: Try signing up with invalid data
3. **Form Validation**: Test form validation with invalid inputs

**Expected Results:**
- ✅ Proper validation messages
- ✅ No successful operations with invalid data
- ✅ User-friendly error messages

## Performance Testing

### Load Testing

**Steps:**
1. **Multiple Users**: Open multiple browser tabs/windows
2. **Concurrent Operations**: Perform operations simultaneously
3. **Data Volume**: Create multiple users and transactions

**Expected Results:**
- ✅ Application remains responsive
- ✅ No data corruption
- ✅ Proper error handling for conflicts

## Browser Compatibility Testing

### Cross-Browser Testing

**Test in:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Expected Results:**
- ✅ Consistent appearance across browsers
- ✅ All functionality works in all browsers
- ✅ No JavaScript errors

## Mobile Responsiveness Testing

### Mobile Testing

**Steps:**
1. **Mobile View**: Use browser dev tools to simulate mobile devices
2. **Sidebar**: Test mobile sidebar functionality
3. **Forms**: Test form usability on mobile
4. **Navigation**: Test mobile navigation

**Expected Results:**
- ✅ Mobile sidebar opens/closes correctly
- ✅ Forms are usable on mobile
- ✅ Navigation works on mobile
- ✅ Content is properly sized for mobile

## API Integration Verification

### Manual API Testing

**Test with curl or Postman:**

1. **Login API:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

2. **Get Users (with token):**
```bash
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

3. **Create Transaction (with token):**
```bash
curl -X POST http://localhost:8000/api/transactions/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"description":"Test transaction","amount":100,"type":"income","category":"Salary","date":"2024-01-01"}'
```

**Expected Results:**
- ✅ All API endpoints respond correctly
- ✅ Authentication works
- ✅ Data is created/retrieved correctly
- ✅ Proper HTTP status codes returned

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check Django CORS settings
   - Verify frontend is making requests to correct URL

2. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT token format
   - Verify backend authentication endpoints

3. **Database Issues**
   - Run migrations: `python manage.py migrate`
   - Check database connection
   - Verify superuser exists

4. **Frontend Build Issues**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check for TypeScript errors
   - Verify all dependencies installed

### Debug Mode

**Frontend Debug:**
- Open browser DevTools
- Check Console for errors
- Check Network tab for failed requests
- Check Application tab for localStorage

**Backend Debug:**
- Check Django terminal for errors
- Use Django shell: `python manage.py shell`
- Check database directly: `python manage.py dbshell`

## Test Checklist

- [ ] Server connectivity
- [ ] User registration flow
- [ ] User login flow
- [ ] Protected route access
- [ ] Logout functionality
- [ ] Dashboard display
- [ ] Users management
- [ ] Transactions management
- [ ] Reports functionality
- [ ] Settings management
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] API integration
- [ ] Performance under load

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser and version
4. Console errors (if any)
5. Network request details (if relevant)
6. Screenshots (if helpful) 