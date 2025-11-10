# Finance Plus API Documentation

## Reports API Endpoints

### Tax Summary Report
`GET /api/reports/tax_summary/`

Get a comprehensive tax summary report including PAYE, NSSA, and NHIMA contributions.

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `department_id` (optional): Filter by department ID

**Response:**
```json
{
    "period": {
        "start": "2024-01-01",
        "end": "2024-12-31"
    },
    "department": "Finance Department",
    "summary": {
        "total_paye": 1500000.00,
        "total_nssa": 300000.00,
        "total_nhima": 150000.00,
        "total_tax_liability": 1950000.00,
        "employee_count": 50
    },
    "monthly_breakdown": [
        {
            "month": "2024-01",
            "paye": 125000.00,
            "nssa": 25000.00,
            "nhima": 12500.00,
            "total": 162500.00
        }
    ],
    "tax_bracket_analysis": [
        {
            "bracket": "0 - 300,000",
            "rate": "20%",
            "employee_count": 20
        }
    ]
}
```

### Attendance Summary Report
`GET /api/reports/attendance_summary/`

Get a detailed attendance summary including leave patterns and trends.

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `department_id` (optional): Filter by department ID

**Response:**
```json
{
    "period": {
        "start": "2024-01-01",
        "end": "2024-12-31"
    },
    "department": "Finance Department",
    "summary": {
        "total_days": 500,
        "approved_days": 450,
        "pending_days": 30,
        "rejected_days": 20,
        "employee_count": 50
    },
    "monthly_breakdown": [
        {
            "month": "2024-01",
            "total_days": 45,
            "approved_days": 40,
            "pending_days": 3,
            "rejected_days": 2
        }
    ],
    "attendance_patterns": [
        {
            "leave_type": "ANNUAL",
            "total_days": 300,
            "request_count": 100,
            "avg_duration": 3.0,
            "employee_count": 45
        }
    ]
}
```

### Cost Analysis Report
`GET /api/reports/cost_analysis/`

Get a comprehensive cost analysis including salary, benefits, overtime, and tax costs.

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `department_id` (optional): Filter by department ID

**Response:**
```json
{
    "period": {
        "start": "2024-01-01",
        "end": "2024-12-31"
    },
    "department": "Finance Department",
    "summary": {
        "total_salary_cost": 10000000.00,
        "total_benefits_cost": 2000000.00,
        "total_overtime_cost": 500000.00,
        "total_tax_cost": 1950000.00,
        "total_cost": 14450000.00,
        "employee_count": 50
    },
    "monthly_breakdown": [
        {
            "month": "2024-01",
            "salary_cost": 833333.33,
            "benefits_cost": 166666.67,
            "overtime_cost": 41666.67,
            "tax_cost": 162500.00,
            "total_cost": 1204166.67
        }
    ],
    "cost_per_employee": [
        {
            "employee__user__first_name": "John",
            "employee__user__last_name": "Doe",
            "employee__department__name": "Finance",
            "salary_cost": 200000.00,
            "benefits_cost": 40000.00,
            "overtime_cost": 10000.00,
            "tax_cost": 39000.00,
            "total_cost": 289000.00
        }
    ]
}
```

### Payroll Summary Report
`GET /api/reports/payroll_summary/`

Get a comprehensive payroll summary including earnings and deductions.

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `department_id` (optional): Filter by department ID

**Response:**
```json
{
    "period": {
        "start": "2024-01-01",
        "end": "2024-12-31"
    },
    "department": "Finance Department",
    "summary": {
        "total_gross": 10000000.00,
        "total_paye": 1500000.00,
        "total_nssa": 300000.00,
        "total_nhima": 150000.00,
        "total_net": 8050000.00,
        "employee_count": 50
    },
    "monthly_breakdown": [
        {
            "month": "2024-01",
            "gross_salary": 833333.33,
            "net_salary": 670833.33,
            "employee_count": 50
        }
    ]
}
```

### Leave Summary Report
`GET /api/reports/leave_summary/`

Get a detailed leave summary including leave types and balances.

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `department_id` (optional): Filter by department ID

**Response:**
```json
{
    "period": {
        "start": "2024-01-01",
        "end": "2024-12-31"
    },
    "department": "Finance Department",
    "summary": {
        "total_annual": 300,
        "total_sick": 100,
        "total_maternity": 30,
        "total_unpaid": 20,
        "request_count": 150
    },
    "monthly_breakdown": [
        {
            "month": "2024-01",
            "annual_days": 25,
            "sick_days": 8,
            "maternity_days": 2,
            "unpaid_days": 1
        }
    ]
}
```

### Overtime Summary Report
`GET /api/reports/overtime_summary/`

Get a detailed overtime summary including hours and costs.

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `department_id` (optional): Filter by department ID

**Response:**
```json
{
    "period": {
        "start": "2024-01-01",
        "end": "2024-12-31"
    },
    "department": "Finance Department",
    "summary": {
        "total_hours": 1000,
        "total_amount": 500000.00,
        "employee_count": 30
    },
    "monthly_breakdown": [
        {
            "month": "2024-01",
            "total_hours": 83.33,
            "total_amount": 41666.67,
            "employee_count": 30
        }
    ]
}
```

### Employee Summary Report
`GET /api/reports/employee_summary/`

Get a comprehensive employee summary including employment types and salary ranges.

**Query Parameters:**
- `department_id` (optional): Filter by department ID

**Response:**
```json
{
    "department": "Finance Department",
    "summary": {
        "total_employees": 50,
        "full_time": 40,
        "part_time": 5,
        "contract": 5,
        "avg_salary": 200000.00
    },
    "employment_type_breakdown": [
        {
            "employment_type": "FULL_TIME",
            "count": 40,
            "avg_salary": 220000.00
        }
    ],
    "salary_breakdown": [
        {
            "range": "100,001 - 200,000",
            "count": 20
        }
    ]
}
```

### Export Reports
`GET /api/reports/export/`

Export any report in various formats (Excel, PDF, CSV, JSON, XML).

**Query Parameters:**
- `type` (required): Type of report to export
  - `payroll`: Payroll summary report
  - `leave`: Leave summary report
  - `overtime`: Overtime summary report
  - `employee`: Employee summary report
  - `tax`: Tax summary report
  - `attendance`: Attendance summary report
  - `cost`: Cost analysis report
- `format` (optional): Export format (default: excel)
  - `excel`: Microsoft Excel format (.xlsx)
  - `pdf`: PDF document format (.pdf)
  - `csv`: Comma-separated values format (.csv)
  - `json`: JSON format (.json)
  - `xml`: XML format (.xml)
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `department_id` (optional): Filter by department ID

**Example Requests:**
```
# Export to Excel
GET /api/reports/export/?type=payroll&format=excel&start_date=2024-01-01&end_date=2024-12-31

# Export to JSON
GET /api/reports/export/?type=payroll&format=json&start_date=2024-01-01&end_date=2024-12-31

# Export to XML
GET /api/reports/export/?type=payroll&format=xml&start_date=2024-01-01&end_date=2024-12-31
```

**Response Formats:**
- Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- PDF: `application/pdf`
- CSV: `text/csv`
- JSON: `application/json`
- XML: `application/xml`

The response will be a downloadable file with the following naming convention:
```
{report_type}_report_{timestamp}.{extension}
```

**JSON Response Structure:**
```json
{
    "metadata": {
        "period": {
            "start": "2024-01-01",
            "end": "2024-12-31"
        },
        "department": "Finance Department",
        "generated_at": "2024-03-14T10:30:00Z"
    },
    "summary": {
        "total_gross": 10000000.00,
        "total_net": 8050000.00,
        "employee_count": 50
    },
    "breakdowns": {
        "monthly": [
            {
                "month": "2024-01",
                "gross_salary": 833333.33,
                "net_salary": 670833.33
            }
        ],
        "tax_bracket_analysis": [
            {
                "bracket": "0 - 300,000",
                "rate": "20%",
                "employee_count": 20
            }
        ]
    }
}
```

**XML Response Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<report>
    <metadata>
        <period>
            <start>2024-01-01</start>
            <end>2024-12-31</end>
        </period>
        <department>Finance Department</department>
        <generated_at>2024-03-14T10:30:00Z</generated_at>
    </metadata>
    <summary>
        <total_gross>10000000.00</total_gross>
        <total_net>8050000.00</total_net>
        <employee_count>50</employee_count>
    </summary>
    <breakdowns>
        <monthly>
            <month>
                <month>2024-01</month>
                <gross_salary>833333.33</gross_salary>
                <net_salary>670833.33</net_salary>
            </month>
        </monthly>
        <tax_bracket_analysis>
            <entry>
                <bracket>0 - 300,000</bracket>
                <rate>20%</rate>
                <employee_count>20</employee_count>
            </entry>
        </tax_bracket_analysis>
    </breakdowns>
</report>
```

**Error Responses:**
```json
{
    "error": "Report type is required"
}
```

```json
{
    "error": "Invalid export format. Supported formats: excel, pdf, csv, json, xml"
}
```

```json
{
    "error": "Start date and end date are required"
}
```

```json
{
    "error": "Invalid date format. Use YYYY-MM-DD"
}
```

```json
{
    "error": "Department not found"
}
```

## Common Features

All report endpoints include:
- Caching (15 minutes)
- Department filtering
- Date range filtering
- Permission checks (Admin or Manager only)
- Error handling for invalid dates and departments
- Detailed response data with summaries and breakdowns

## Error Responses

All endpoints may return the following error responses:

```json
{
    "error": "Start date and end date are required"
}
```

```json
{
    "error": "Invalid date format. Use YYYY-MM-DD"
}
```

```json
{
    "error": "Department not found"
}
```

## Authentication

All endpoints require authentication using a valid token. Include the token in the Authorization header:

```
Authorization: Token your-token-here
```

## Rate Limiting

API requests are limited to:
- 100 requests per minute per user
- 1000 requests per hour per user

## Best Practices

1. Always include both start_date and end_date parameters
2. Use department_id to filter reports when needed
3. Cache report results on the client side when possible
4. Handle error responses appropriately
5. Use appropriate date ranges to avoid large result sets 