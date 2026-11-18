import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockSalaryRecord } from '../../testUtils';
import SalaryTable from '../../../components/salary/SalaryTable';

// ── Mock getSalaryList thunk ──────────────────────────────────────────────────
const { mockGetSalaryList } = vi.hoisted(() => ({
  mockGetSalaryList: vi.fn(() => ({
    type: 'salary/getSalaryList/fulfilled',
    payload: [mockSalaryRecord],
  })),
}));

vi.mock('../../../redux/reducers/salarySlice', async () => {
  const actual = await vi.importActual<typeof import('../../../redux/reducers/salarySlice')>(
    '../../../redux/reducers/salarySlice'
  );
  return { ...actual, getSalaryList: mockGetSalaryList };
});

const onAddSalary = vi.fn();
const onEditSalary = vi.fn();
const onConfirmPayment = vi.fn();

const salaryState = {
  salary: {
    basePayLoading: false,
    basePay: null,
    basePayNotFound: false,
    mutating: false,
    salaryListLoading: false,
    salaryList: [mockSalaryRecord],
    salaryMutating: false,
  },
};

describe('SalaryTable', () => {
  beforeEach(() => {
    onAddSalary.mockReset();
    onEditSalary.mockReset();
    onConfirmPayment.mockReset();
    mockGetSalaryList.mockClear();
  });

  it('renders the "Monthly Salary Details" heading', () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByText(/monthly salary details/i)).toBeInTheDocument();
  });

  it('dispatches getSalaryList with the given employeeId on mount', async () => {
    renderWithProviders(
      <SalaryTable employeeId={5} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );
    await waitFor(() => {
      expect(mockGetSalaryList).toHaveBeenCalledWith(5);
    });
  });

  it('renders "Add Salary" button', () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByRole('button', { name: /add salary/i })).toBeInTheDocument();
  });

  it('calls onAddSalary when "Add Salary" is clicked', async () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );
    await userEvent.click(screen.getByRole('button', { name: /add salary/i }));
    expect(onAddSalary).toHaveBeenCalledOnce();
  });

  it('renders salary record month and year', () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );
    // payroll_month=3 (March), payroll_year=2024 — query the data row specifically
    const cells = document.querySelectorAll('td');
    const monthCell = Array.from(cells).find(td => td.textContent?.includes('Mar 2024'));
    expect(monthCell).toBeTruthy();
  });

  it('renders column headers', () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );
    const headers = document.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(h => h.textContent?.toLowerCase() ?? '');
    expect(headerTexts.some(t => t.includes('base salary'))).toBe(true);
    expect(headerTexts.some(t => t.includes('net pay'))).toBe(true);
    expect(headerTexts.some(t => t.includes('status'))).toBe(true);
  });

  it('renders payment status as a tag', () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('shows the Actions dropdown for a row', () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByText(/actions/i)).toBeInTheDocument();
  });

  it('calls onEditSalary when Edit action is clicked', async () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );

    // Open Actions dropdown
    await userEvent.click(screen.getByText(/actions/i));

    await waitFor(() => {
      expect(screen.getByText(/^edit$/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/^edit$/i));
    expect(onEditSalary).toHaveBeenCalledWith(mockSalaryRecord);
  });

  it('calls onConfirmPayment when "Confirm Payment Manually" is clicked', async () => {
    renderWithProviders(
      <SalaryTable employeeId={1} onAddSalary={onAddSalary} onEditSalary={onEditSalary} onConfirmPayment={onConfirmPayment} />,
      { preloadedState: salaryState }
    );

    await userEvent.click(screen.getByText(/actions/i));

    await waitFor(() => {
      expect(screen.getByText(/confirm payment manually/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/confirm payment manually/i));
    expect(onConfirmPayment).toHaveBeenCalledWith(mockSalaryRecord);
  });
});
