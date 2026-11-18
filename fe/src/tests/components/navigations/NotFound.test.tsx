import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils';
import NotFound from '../../../components/navigations/NotFound';

// react-router-dom's useNavigate is provided via MemoryRouter in renderWithProviders
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('NotFound', () => {
  it('renders the 404 heading', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders the "Page Not Found" message', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders the "Back to Dashboard" button', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it('navigates to /dashboard with replace on button click', async () => {
    renderWithProviders(<NotFound />);
    await userEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
