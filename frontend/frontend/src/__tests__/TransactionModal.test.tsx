import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransactionModal from '../components/TransactionModal';
import { vi } from 'vitest';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
}

describe('TransactionModal', () => {
  const mockTransaction: Transaction = {
    id: '1',
    type: 'income',
    amount: 1000,
    category: 'Salary',
    description: 'Monthly salary',
    date: '2024-02-20',
    status: 'completed',
  };

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const renderModal = (transaction: Transaction | null = null) => {
    return render(
      <TransactionModal
        transaction={transaction}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add transaction form', () => {
    renderModal();

    expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('renders edit transaction form with existing data', () => {
    renderModal(mockTransaction);

    expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Salary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Monthly salary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderModal();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    renderModal();

    const submitButton = screen.getByText('Add');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderModal();

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'income' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Salary' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Monthly salary' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-02-20' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'completed' } });

    const submitButton = screen.getByText('Add');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        type: 'income',
        amount: 1000,
        category: 'Salary',
        description: 'Monthly salary',
        date: '2024-02-20',
        status: 'completed',
      });
    });
  });

  it('validates amount is positive', async () => {
    renderModal();

    // Fill in the form with negative amount
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'income' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '-1000' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Salary' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Monthly salary' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-02-20' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'completed' } });

    const submitButton = screen.getByText('Add');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 