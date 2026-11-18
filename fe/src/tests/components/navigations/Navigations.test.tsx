import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils';
import Navigation from '../../../components/navigations/Navigations';

// Mock AuthorizedRoutes so the test does not load every lazy page
vi.mock('../../../components/navigations/AuthorizedRoutes', () => ({
  default: () => <div data-testid="authorized-routes" />,
  sidebarItemsList: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'employees', label: 'Employees' },
    { key: 'salaries', label: 'Salaries' },
  ],
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-redirect" data-to={to} />,
  };
});

describe('Navigation (Navigations.tsx)', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe('when user is authenticated', () => {
    const authState = {
      auth: {
        loading: false,
        user: { email: 'admin@test.com', firstname: 'Admin' },
      },
    };

    it('renders the main layout without redirecting', () => {
      renderWithProviders(<Navigation />, { preloadedState: authState });
      expect(screen.queryByTestId('navigate-redirect')).not.toBeInTheDocument();
      expect(screen.getByTestId('authorized-routes')).toBeInTheDocument();
    });

    it('shows the user greeting with the firstname', () => {
      renderWithProviders(<Navigation />, { preloadedState: authState });
      expect(screen.getByText(/hi!/i)).toBeInTheDocument();
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });

    it('renders the sidebar toggle button', () => {
      renderWithProviders(<Navigation />, { preloadedState: authState });
      // The toggle button renders an icon; test by its role
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('when user is not authenticated', () => {
    const unauthState = {
      auth: { loading: false, user: {} },
    };

    it('redirects to /login', () => {
      renderWithProviders(<Navigation />, { preloadedState: unauthState });
      const redirect = screen.getByTestId('navigate-redirect');
      expect(redirect).toHaveAttribute('data-to', '/login');
    });

    it('does not render the layout', () => {
      renderWithProviders(<Navigation />, { preloadedState: unauthState });
      expect(screen.queryByTestId('authorized-routes')).not.toBeInTheDocument();
    });
  });

  describe('logout', () => {
    const authState = {
      auth: {
        loading: false,
        user: { email: 'admin@test.com', firstname: 'Admin' },
      },
    };

    it('dispatches logout when "Log Out" is clicked', async () => {
      const { store } = renderWithProviders(<Navigation />, { preloadedState: authState });

      // Open the user dropdown
      const greeting = screen.getByText(/hi!/i);
      await userEvent.click(greeting.closest('a') as HTMLElement);

      // The dropdown item "Log Out" should appear
      await waitFor(() => {
        expect(screen.getByText(/log out/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/log out/i));

      // After logout the auth user should be reset to empty
      await waitFor(() => {
        expect(store.getState().auth.user).toEqual({});
      });
    });
  });
});
