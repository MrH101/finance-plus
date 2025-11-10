import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Layout from '../components/Layout';

describe('Layout', () => {
  const renderLayout = (path: string = '/') => {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );
  };

  it('renders the app title', () => {
    renderLayout();
    expect(screen.getByText('Finance Plus')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderLayout();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderLayout();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('highlights active navigation link', () => {
    renderLayout('/transactions');
    const transactionsLink = screen.getByText('Transactions').closest('a');
    expect(transactionsLink).toHaveClass('border-blue-500');
  });

  it('does not highlight inactive navigation links', () => {
    renderLayout('/transactions');
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).not.toHaveClass('border-blue-500');
  });
}); 