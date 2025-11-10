import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DataTable from '../DataTable';

describe('DataTable', () => {
  const mockColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (value: any, row: any) => (
        <button onClick={() => row.id} data-testid="action-button">
          Action
        </button>
      ),
    },
  ];

  const mockData = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  ];

  const mockOnRowClick = vi.fn();

  const renderTable = () => {
    return render(
      <DataTable columns={mockColumns} data={mockData} onRowClick={mockOnRowClick} />
    );
  };

  it('renders table headers', () => {
    renderTable();

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders table data', () => {
    renderTable();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', () => {
    renderTable();

    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
      expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('renders custom cell content', () => {
    renderTable();

    const actionButtons = screen.getAllByTestId('action-button');
    expect(actionButtons).toHaveLength(2);
  });

  it('handles empty data', () => {
    render(<DataTable columns={mockColumns} data={[]} onRowClick={mockOnRowClick} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles missing data properties', () => {
    const incompleteData = [{ id: '1', name: 'John Doe' }];
    render(<DataTable columns={mockColumns} data={incompleteData} onRowClick={mockOnRowClick} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
  });

  it('handles null values', () => {
    const dataWithNull = [{ id: '1', name: null, email: 'john@example.com', role: 'Admin' }];
    render(<DataTable columns={mockColumns} data={dataWithNull} onRowClick={mockOnRowClick} />);

    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('applies hover effect on rows', () => {
    renderTable();

    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      fireEvent.mouseEnter(firstRow);
      expect(firstRow).toHaveClass('hover:bg-gray-50');
    }
  });
}); 