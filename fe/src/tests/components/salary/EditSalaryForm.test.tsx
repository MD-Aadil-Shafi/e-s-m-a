import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockSalaryRecord, mockBasePay } from '../../testUtils';
import EditSalaryForm from '../../../components/salary/modals/EditSalaryForm';

vi.mock('../../../redux/reducers/salarySlice', async () => {
  const actual = await vi.importActual<typeof import('../../../redux/reducers/salarySlice')>(
    '../../../redux/reducers/salarySlice'
  );
  return {
    ...actual,
    editSalary: vi.fn((payload: any) => ({
      type: 'salary/editSalary/fulfilled',
      payload,
      error: undefined,
    })),
  };
});

const handleClose = vi.fn();
const onSuccess = vi.fn();

const salaryStateWithBasePay = {
  salary: {
    basePayLoading: false,
    basePay: mockBasePay,
    basePayNotFound: false,
    mutating: false,
    salaryListLoading: false,
    salaryList: [],
    salaryMutating: false,
  },
};

describe('EditSalaryForm', () => {
  beforeEach(() => {
    handleClose.mockReset();
    onSuccess.mockReset();
  });

  it('renders the "Edit Salary" heading', () => {
    renderWithProviders(
      <EditSalaryForm initialValues={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryStateWithBasePay }
    );
    expect(screen.getByText(/edit salary/i)).toBeInTheDocument();
  });

  it('renders the payroll month/year subtitle', () => {
    renderWithProviders(
      <EditSalaryForm initialValues={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryStateWithBasePay }
    );
    // payroll_month=3 (March), payroll_year=2024
    expect(screen.getByText(/march 2024/i)).toBeInTheDocument();
  });

  it('pre-fills form with initialValues', () => {
    renderWithProviders(
      <EditSalaryForm initialValues={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryStateWithBasePay }
    );
    // total_days=31 — the first number input in the form
    const numberInputs = document.querySelectorAll('input[type="number"]');
    expect((numberInputs[0] as HTMLInputElement).value).toBe('31');
  });

  it('shows the salary preview section with Base Salary label', () => {
    renderWithProviders(
      <EditSalaryForm initialValues={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryStateWithBasePay }
    );
    expect(screen.getByText(/base salary/i)).toBeInTheDocument();
    expect(screen.getByText(/allowances/i)).toBeInTheDocument();
    expect(screen.getByText(/gross salary/i)).toBeInTheDocument();
    expect(screen.getByText(/net pay/i)).toBeInTheDocument();
  });

  it('renders cancel and submit buttons', () => {
    renderWithProviders(
      <EditSalaryForm initialValues={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryStateWithBasePay }
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update salary/i })).toBeInTheDocument();
  });

  it('calls handleClose on Cancel without calling onSuccess', async () => {
    renderWithProviders(
      <EditSalaryForm initialValues={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryStateWithBasePay }
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledOnce();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('disables submit button when salaryMutating is true', () => {
    renderWithProviders(
      <EditSalaryForm initialValues={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      {
        preloadedState: {
          salary: { ...salaryStateWithBasePay.salary, salaryMutating: true },
        },
      }
    );
    expect(screen.getByRole('button', { name: /update salary/i })).toBeDisabled();
  });

  it('shows error when total_days is below min (1)', async () => {
    renderWithProviders(
      <EditSalaryForm initialValues={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryStateWithBasePay }
    );
    // First number input is total_days
    const totalDays = document.querySelectorAll('input[type="number"]')[0] as HTMLInputElement;
    await userEvent.clear(totalDays);
    await userEvent.type(totalDays, '0'); // below min of 1
    await userEvent.click(screen.getByRole('button', { name: /update salary/i }));

    await waitFor(() => {
      const errorEl = document.querySelector('.text-red-500');
      expect(errorEl).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
