import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockEmployee } from '../../testUtils';
import EmployeeTable from '../../../components/employee/EmployeeTable';

// ── Mock heavy child modals to keep this test focused on the table ────────────
vi.mock('../../../components/employee/modals/AddEmployeeForm', () => ({
  default: ({ onSuccess, handleClose }: any) => (
    <div data-testid="add-employee-form">
      <button onClick={onSuccess}>Submit Add</button>
      <button onClick={handleClose}>Cancel Add</button>
    </div>
  ),
}));

vi.mock('../../../components/employee/modals/EditEmployeeForm', () => ({
  default: ({ onSuccess, handleClose }: any) => (
    <div data-testid="edit-employee-form">
      <button onClick={onSuccess}>Submit Edit</button>
      <button onClick={handleClose}>Cancel Edit</button>
    </div>
  ),
}));

// ── Mock getEmployees thunk ───────────────────────────────────────────────────
const { mockGetEmployees } = vi.hoisted(() => ({
  mockGetEmployees: vi.fn(() => ({
    type: 'employee/getAll/fulfilled',
    payload: { items: [], total: 0, page: 1, limit: 20 },
  })),
}));

vi.mock('../../../redux/reducers/employeeSlice', async () => {
  const actual = await vi.importActual<typeof import('../../../redux/reducers/employeeSlice')>(
    '../../../redux/reducers/employeeSlice'
  );
  return { ...actual, getEmployees: mockGetEmployees };
});

const employeeState = {
  employee: {
    loading: false,
    employees: [mockEmployee],
    pagination: { total: 1, page: 1, limit: 20 },
    logsLoading: false,
    employeeLogs: null,
  },
};

describe('EmployeeTable', () => {
  beforeEach(() => {
    mockGetEmployees.mockClear();
  });

  it('renders the "Employees" heading', () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    expect(screen.getByText(/^employees$/i)).toBeInTheDocument();
  });

  it('renders the search input', () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
  });

  it('renders the "Add New" button', () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    expect(screen.getByRole('button', { name: /add new/i })).toBeInTheDocument();
  });

  it('dispatches getEmployees on mount', async () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    await waitFor(() => {
      expect(mockGetEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, order: 'desc' })
      );
    });
  });

  it('renders employee data in the table', () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('opens the Add modal when "Add New" is clicked', async () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    await userEvent.click(screen.getByRole('button', { name: /add new/i }));
    await waitFor(() => {
      expect(screen.getByTestId('add-employee-form')).toBeInTheDocument();
    });
  });

  it('dispatches getEmployees when search text changes (debounced)', async () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    const searchInput = screen.getByPlaceholderText(/search by name or email/i);
    await userEvent.type(searchInput, 'Jane');
    // After debounce of 600 ms, we expect at least one more call
    await waitFor(() => {
      expect(mockGetEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Jane' })
      );
    }, { timeout: 1500 });
  });

  it('renders the Filter toggle button', () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  it('shows the table with column headers', () => {
    renderWithProviders(<EmployeeTable />, { preloadedState: employeeState });
    const headers = document.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(h => h.textContent?.toLowerCase() ?? '');
    expect(headerTexts.some(t => t.includes('name'))).toBe(true);
    expect(headerTexts.some(t => t.includes('department'))).toBe(true);
    expect(headerTexts.some(t => t.includes('designation'))).toBe(true);
    expect(headerTexts.some(t => t.includes('email'))).toBe(true);
  });
});
