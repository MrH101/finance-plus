import pandas as pd
import json
import xml.etree.ElementTree as ET
from datetime import datetime
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from django.http import HttpResponse
from django.template.loader import render_to_string
import xlsxwriter
from decimal import Decimal

class ReportExporter:
    @staticmethod
    def export_to_excel(data, filename):
        """Export report data to Excel format"""
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        
        # Add a worksheet
        worksheet = workbook.add_worksheet()
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4F81BD',
            'font_color': 'white',
            'border': 1
        })
        
        number_format = workbook.add_format({
            'num_format': '#,##0.00',
            'border': 1
        })
        
        date_format = workbook.add_format({
            'num_format': 'yyyy-mm-dd',
            'border': 1
        })
        
        # Write period information
        worksheet.write('A1', 'Period:', header_format)
        worksheet.write('B1', f"{data['period']['start']} to {data['period']['end']}", date_format)
        worksheet.write('A2', 'Department:', header_format)
        worksheet.write('B2', data['department'])
        
        # Write summary
        row = 4
        worksheet.write(row, 0, 'Summary', header_format)
        row += 1
        
        for key, value in data['summary'].items():
            worksheet.write(row, 0, key.replace('_', ' ').title(), header_format)
            if isinstance(value, (int, float, Decimal)):
                worksheet.write(row, 1, value, number_format)
            else:
                worksheet.write(row, 1, value)
            row += 1
        
        # Write monthly breakdown
        if 'monthly_breakdown' in data:
            row += 2
            worksheet.write(row, 0, 'Monthly Breakdown', header_format)
            row += 1
            
            # Write headers
            headers = list(data['monthly_breakdown'][0].keys())
            for col, header in enumerate(headers):
                worksheet.write(row, col, header.replace('_', ' ').title(), header_format)
            
            # Write data
            for month_data in data['monthly_breakdown']:
                row += 1
                for col, header in enumerate(headers):
                    value = month_data[header]
                    if isinstance(value, (int, float, Decimal)):
                        worksheet.write(row, col, value, number_format)
                    else:
                        worksheet.write(row, col, value)
        
        # Write additional breakdowns if they exist
        for breakdown_key in ['tax_bracket_analysis', 'attendance_patterns', 'cost_per_employee']:
            if breakdown_key in data:
                row += 2
                worksheet.write(row, 0, breakdown_key.replace('_', ' ').title(), header_format)
                row += 1
                
                # Write headers
                headers = list(data[breakdown_key][0].keys())
                for col, header in enumerate(headers):
                    worksheet.write(row, col, header.replace('_', ' ').title(), header_format)
                
                # Write data
                for item in data[breakdown_key]:
                    row += 1
                    for col, header in enumerate(headers):
                        value = item[header]
                        if isinstance(value, (int, float, Decimal)):
                            worksheet.write(row, col, value, number_format)
                        else:
                            worksheet.write(row, col, value)
        
        workbook.close()
        output.seek(0)
        
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
        return response

    @staticmethod
    def export_to_pdf(data, filename):
        """Export report data to PDF format"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Add title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30
        )
        elements.append(Paragraph(f"{filename} Report", title_style))
        
        # Add period information
        elements.append(Paragraph(f"Period: {data['period']['start']} to {data['period']['end']}", styles['Normal']))
        elements.append(Paragraph(f"Department: {data['department']}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Add summary
        elements.append(Paragraph("Summary", styles['Heading2']))
        summary_data = [['Metric', 'Value']]
        for key, value in data['summary'].items():
            summary_data.append([key.replace('_', ' ').title(), str(value)])
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))
        
        # Add monthly breakdown
        if 'monthly_breakdown' in data:
            elements.append(Paragraph("Monthly Breakdown", styles['Heading2']))
            headers = list(data['monthly_breakdown'][0].keys())
            monthly_data = [headers]
            for month_data in data['monthly_breakdown']:
                monthly_data.append([str(month_data[header]) for header in headers])
            
            monthly_table = Table(monthly_data, colWidths=[1.5*inch] * len(headers))
            monthly_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(monthly_table)
            elements.append(Spacer(1, 20))
        
        # Add additional breakdowns
        for breakdown_key in ['tax_bracket_analysis', 'attendance_patterns', 'cost_per_employee']:
            if breakdown_key in data:
                elements.append(Paragraph(breakdown_key.replace('_', ' ').title(), styles['Heading2']))
                headers = list(data[breakdown_key][0].keys())
                breakdown_data = [headers]
                for item in data[breakdown_key]:
                    breakdown_data.append([str(item[header]) for header in headers])
                
                breakdown_table = Table(breakdown_data, colWidths=[1.5*inch] * len(headers))
                breakdown_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                elements.append(breakdown_table)
                elements.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
        return response

    @staticmethod
    def export_to_csv(data, filename):
        """Export report data to CSV format"""
        # Convert data to pandas DataFrame
        df = pd.DataFrame()
        
        # Add summary
        summary_df = pd.DataFrame([data['summary']])
        df = pd.concat([df, summary_df])
        
        # Add monthly breakdown
        if 'monthly_breakdown' in data:
            monthly_df = pd.DataFrame(data['monthly_breakdown'])
            df = pd.concat([df, monthly_df])
        
        # Add additional breakdowns
        for breakdown_key in ['tax_bracket_analysis', 'attendance_patterns', 'cost_per_employee']:
            if breakdown_key in data:
                breakdown_df = pd.DataFrame(data[breakdown_key])
                df = pd.concat([df, breakdown_df])
        
        # Create response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        
        # Write to CSV
        df.to_csv(response, index=False)
        return response

    @staticmethod
    def export_to_json(data, filename):
        """Export report data to JSON format"""
        # Create a more structured JSON output
        json_data = {
            'metadata': {
                'period': data['period'],
                'department': data['department'],
                'generated_at': datetime.now().isoformat()
            },
            'summary': data['summary'],
            'breakdowns': {}
        }
        
        # Add monthly breakdown
        if 'monthly_breakdown' in data:
            json_data['breakdowns']['monthly'] = data['monthly_breakdown']
        
        # Add additional breakdowns
        for breakdown_key in ['tax_bracket_analysis', 'attendance_patterns', 'cost_per_employee']:
            if breakdown_key in data:
                json_data['breakdowns'][breakdown_key] = data[breakdown_key]
        
        response = HttpResponse(
            json.dumps(json_data, indent=2, default=str),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}.json"'
        return response

    @staticmethod
    def export_to_xml(data, filename):
        """Export report data to XML format"""
        root = ET.Element('report')
        
        # Add metadata
        metadata = ET.SubElement(root, 'metadata')
        period = ET.SubElement(metadata, 'period')
        ET.SubElement(period, 'start').text = str(data['period']['start'])
        ET.SubElement(period, 'end').text = str(data['period']['end'])
        ET.SubElement(metadata, 'department').text = data['department']
        ET.SubElement(metadata, 'generated_at').text = datetime.now().isoformat()
        
        # Add summary
        summary = ET.SubElement(root, 'summary')
        for key, value in data['summary'].items():
            ET.SubElement(summary, key).text = str(value)
        
        # Add breakdowns
        breakdowns = ET.SubElement(root, 'breakdowns')
        
        # Add monthly breakdown
        if 'monthly_breakdown' in data:
            monthly = ET.SubElement(breakdowns, 'monthly')
            for month_data in data['monthly_breakdown']:
                month = ET.SubElement(monthly, 'month')
                for key, value in month_data.items():
                    ET.SubElement(month, key).text = str(value)
        
        # Add additional breakdowns
        for breakdown_key in ['tax_bracket_analysis', 'attendance_patterns', 'cost_per_employee']:
            if breakdown_key in data:
                breakdown = ET.SubElement(breakdowns, breakdown_key)
                for item in data[breakdown_key]:
                    entry = ET.SubElement(breakdown, 'entry')
                    for key, value in item.items():
                        ET.SubElement(entry, key).text = str(value)
        
        # Create response
        response = HttpResponse(
            ET.tostring(root, encoding='unicode', method='xml'),
            content_type='application/xml'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}.xml"'
        return response 

    @staticmethod
    def export_payslip_pdf(payslip_data, filename):
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from io import BytesIO
        from django.http import HttpResponse

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(f"Payslip for {payslip_data['employee_name']}", styles['Title']))
        elements.append(Spacer(1, 12))

        # Employee Info Table
        emp_info = [
            ['Employee Name', payslip_data['employee_name']],
            ['Employee ID', payslip_data['employee_id']],
            ['Department', payslip_data['department']],
            ['Bank Name', payslip_data['bank_name']],
            ['Bank Account', payslip_data['bank_account']],
            ['Tax Number', payslip_data['tax_number']],
            ['NSSA Number', payslip_data['nssa_number']],
            ['NHIMA Number', payslip_data['nhima_number']],
            ['Employment Type', payslip_data['employment_type']],
            ['Employment Date', str(payslip_data['employment_date'])],
        ]
        emp_table = Table(emp_info, colWidths=[2.5*inch, 3.5*inch])
        emp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(emp_table)
        elements.append(Spacer(1, 12))

        # Payroll Info Table
        payroll_info = [
            ['Period Start', str(payslip_data['period_start'])],
            ['Period End', str(payslip_data['period_end'])],
            ['Pay Period', payslip_data['pay_period']],
            ['Status', payslip_data['status']],
            ['Payment Date', str(payslip_data['payment_date'])],
            ['Payment Reference', payslip_data['payment_reference']],
        ]
        payroll_table = Table(payroll_info, colWidths=[2.5*inch, 3.5*inch])
        payroll_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(payroll_table)
        elements.append(Spacer(1, 12))

        # Earnings Table
        earnings = [
            ['Basic Salary', payslip_data['basic_salary']],
            ['Overtime', payslip_data['overtime_amount']],
        ]
        for k, v in payslip_data['allowances'].items():
            earnings.append([f"Allowance: {k}", v])
        earnings.append(['Gross Salary', payslip_data['gross_salary']])
        earnings_table = Table(earnings, colWidths=[2.5*inch, 3.5*inch])
        earnings_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.lightblue),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(Paragraph('Earnings', styles['Heading3']))
        elements.append(earnings_table)
        elements.append(Spacer(1, 12))

        # Deductions Table
        deductions = [
            ['PAYE', payslip_data['paye']],
            ['NSSA', payslip_data['nssa']],
            ['NHIMA', payslip_data['nhima']],
        ]
        for k, v in payslip_data['other_deductions'].items():
            deductions.append([f"Other Deduction: {k}", v])
        deductions.append(['Total Deductions', payslip_data['total_deductions']])
        deductions_table = Table(deductions, colWidths=[2.5*inch, 3.5*inch])
        deductions_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.pink),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(Paragraph('Deductions', styles['Heading3']))
        elements.append(deductions_table)
        elements.append(Spacer(1, 12))

        # Net Salary
        elements.append(Paragraph(f"<b>Net Salary: {payslip_data['net_salary']}</b>", styles['Heading2']))

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
        return response

    @staticmethod
    def export_payslip_excel(payslip_data, filename):
        import xlsxwriter
        from io import BytesIO
        from django.http import HttpResponse
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet('Payslip')
        bold = workbook.add_format({'bold': True})
        row = 0
        worksheet.write(row, 0, 'Payslip', bold)
        row += 2
        # Employee Info
        for label, value in [
            ('Employee Name', payslip_data['employee_name']),
            ('Employee ID', payslip_data['employee_id']),
            ('Department', payslip_data['department']),
            ('Bank Name', payslip_data['bank_name']),
            ('Bank Account', payslip_data['bank_account']),
            ('Tax Number', payslip_data['tax_number']),
            ('NSSA Number', payslip_data['nssa_number']),
            ('NHIMA Number', payslip_data['nhima_number']),
            ('Employment Type', payslip_data['employment_type']),
            ('Employment Date', str(payslip_data['employment_date'])),
        ]:
            worksheet.write(row, 0, label, bold)
            worksheet.write(row, 1, value)
            row += 1
        row += 1
        # Payroll Info
        for label, value in [
            ('Period Start', str(payslip_data['period_start'])),
            ('Period End', str(payslip_data['period_end'])),
            ('Pay Period', payslip_data['pay_period']),
            ('Status', payslip_data['status']),
            ('Payment Date', str(payslip_data['payment_date'])),
            ('Payment Reference', payslip_data['payment_reference']),
        ]:
            worksheet.write(row, 0, label, bold)
            worksheet.write(row, 1, value)
            row += 1
        row += 1
        # Earnings
        worksheet.write(row, 0, 'Earnings', bold)
        row += 1
        worksheet.write(row, 0, 'Basic Salary')
        worksheet.write(row, 1, payslip_data['basic_salary'])
        row += 1
        worksheet.write(row, 0, 'Overtime')
        worksheet.write(row, 1, payslip_data['overtime_amount'])
        row += 1
        for k, v in payslip_data['allowances'].items():
            worksheet.write(row, 0, f"Allowance: {k}")
            worksheet.write(row, 1, v)
            row += 1
        worksheet.write(row, 0, 'Gross Salary', bold)
        worksheet.write(row, 1, payslip_data['gross_salary'])
        row += 2
        # Deductions
        worksheet.write(row, 0, 'Deductions', bold)
        row += 1
        worksheet.write(row, 0, 'PAYE')
        worksheet.write(row, 1, payslip_data['paye'])
        row += 1
        worksheet.write(row, 0, 'NSSA')
        worksheet.write(row, 1, payslip_data['nssa'])
        row += 1
        worksheet.write(row, 0, 'NHIMA')
        worksheet.write(row, 1, payslip_data['nhima'])
        row += 1
        for k, v in payslip_data['other_deductions'].items():
            worksheet.write(row, 0, f"Other Deduction: {k}")
            worksheet.write(row, 1, v)
            row += 1
        worksheet.write(row, 0, 'Total Deductions', bold)
        worksheet.write(row, 1, payslip_data['total_deductions'])
        row += 2
        worksheet.write(row, 0, 'Net Salary', bold)
        worksheet.write(row, 1, payslip_data['net_salary'])
        workbook.close()
        output.seek(0)
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
        return response 