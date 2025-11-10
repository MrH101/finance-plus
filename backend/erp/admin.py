from django.contrib import admin
from .models import (
    Business, User, Store, ChartOfAccounts, JournalEntry, JournalEntryLine,
    GeneralLedger, BankAccount, MobileMoneyAccount, BankTransaction,
    MobileMoneyTransaction, Product, Inventory, Employee, Payroll,
    SaleSession, POSSale, POSItem, FiscalizationLog, Module, Department,
    Tax, TaxReminder
)

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'created_at']
    search_fields = ['name', 'address']
    list_filter = ['created_at']

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'business', 'is_verified']
    list_filter = ['role', 'business', 'is_verified', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permissions', {'fields': ('role', 'business', 'is_verified', 'is_staff', 'is_active')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'business', 'manager', 'vat_number', 'created_at']
    list_filter = ['business', 'created_at']
    search_fields = ['name', 'vat_number', 'address']

@admin.register(ChartOfAccounts)
class ChartOfAccountsAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'account_type', 'store', 'current_balance', 'is_active']
    list_filter = ['account_type', 'store', 'is_active']
    search_fields = ['code', 'name', 'description']

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['entry_number', 'entry_type', 'date', 'description', 'status', 'total_debits', 'total_credits', 'created_by']
    list_filter = ['entry_type', 'status', 'date', 'store']
    search_fields = ['entry_number', 'description', 'reference']

@admin.register(JournalEntryLine)
class JournalEntryLineAdmin(admin.ModelAdmin):
    list_display = ['journal_entry', 'account', 'description', 'debit', 'credit']
    list_filter = ['journal_entry__entry_type', 'account__account_type']

@admin.register(GeneralLedger)
class GeneralLedgerAdmin(admin.ModelAdmin):
    list_display = ['date', 'account', 'debit', 'credit', 'reference', 'running_balance']
    list_filter = ['date', 'account__account_type']
    search_fields = ['reference', 'description']

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ['account_name', 'bank_name', 'account_number', 'store', 'current_balance', 'is_active']
    list_filter = ['bank_name', 'is_active', 'store']
    search_fields = ['account_name', 'account_number', 'bank_name']

@admin.register(MobileMoneyAccount)
class MobileMoneyAccountAdmin(admin.ModelAdmin):
    list_display = ['account_name', 'provider', 'phone_number', 'store', 'current_balance', 'is_active']
    list_filter = ['provider', 'is_active', 'store']
    search_fields = ['account_name', 'phone_number', 'provider']

@admin.register(BankTransaction)
class BankTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_type', 'amount', 'bank_account', 'transaction_date', 'status']
    list_filter = ['transaction_type', 'status', 'transaction_date']
    search_fields = ['reference', 'description']

@admin.register(MobileMoneyTransaction)
class MobileMoneyTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_type', 'amount', 'mobile_account', 'transaction_date', 'status']
    list_filter = ['transaction_type', 'status', 'transaction_date']
    search_fields = ['reference', 'description']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'unit_price', 'quantity_in_stock', 'business', 'is_active']
    list_filter = ['category', 'is_active', 'business']
    search_fields = ['name', 'sku', 'description']

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity', 'unit_cost', 'total_cost', 'transaction_type', 'created_at']
    list_filter = ['transaction_type', 'created_at']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'employee_id', 'position', 'business', 'salary', 'is_active']
    list_filter = ['position', 'is_active', 'business']
    search_fields = ['first_name', 'last_name', 'employee_id', 'email']

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ['employee', 'period_start', 'period_end', 'gross_salary', 'net_salary', 'status']
    list_filter = ['status', 'period_start', 'period_end']

@admin.register(SaleSession)
class SaleSessionAdmin(admin.ModelAdmin):
    list_display = ['cashier', 'start_time', 'end_time', 'is_active', 'total_sales']
    list_filter = ['is_active', 'start_time']

@admin.register(POSSale)
class POSSaleAdmin(admin.ModelAdmin):
    list_display = ['sale_number', 'session', 'customer_name', 'total_amount', 'payment_method', 'status']
    list_filter = ['payment_method', 'status', 'created_at']

@admin.register(POSItem)
class POSItemAdmin(admin.ModelAdmin):
    list_display = ['sale', 'product', 'quantity', 'unit_price', 'total_price']

@admin.register(FiscalizationLog)
class FiscalizationLogAdmin(admin.ModelAdmin):
    list_display = ['sale', 'fiscal_receipt_number', 'success', 'created_at']
    list_filter = ['success', 'created_at']

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active']
    list_filter = ['is_active']

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']

@admin.register(Tax)
class TaxAdmin(admin.ModelAdmin):
    list_display = ['type', 'amount', 'period_start', 'period_end', 'status']
    list_filter = ['type', 'status']

@admin.register(TaxReminder)
class TaxReminderAdmin(admin.ModelAdmin):
    list_display = ['tax', 'reminder_type', 'reminder_date', 'sent']
    list_filter = ['reminder_type', 'sent', 'reminder_date']
