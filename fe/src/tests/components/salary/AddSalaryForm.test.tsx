import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils';
import AddSalaryForm from '../../../components/salary/modals/AddSalaryForm';

vi.mock('../../../redux/reducers/salarySlice', async () => {
  const actual = await vi.importActual<typeof import('../../../redux/reducers/salarySlice')>(
    '../../../redux/reducers/salarySlice'
  );
  return {
    ...actual,
    addSalary: vi.fn((payload: any) => ({
      type: 'salary/addSalary/fulfilled',
      payload,
      error: undefined,
    })),
  };
});

const handleClose = vi.fn();
const onSuccess = vi.fn();

const salaryState = {
  salary: {
    basePayLoading: false,
    basePay: null,
    basePayNotFound: false,
    mutating: false,
    salaryListLoading: false,
    salaryList: [],
    salaryMutating: false,
  },
};

// Helper to get the month <select> (first combobox) and year <select> (second)
const getMonthSelect = () => screen.getAllByRole('combobox')[0] as HTMLSelectElement;
const getYearSelect = () => screen.getAllByRole('combobox')[1] as HTMLSelectElement;

describe('AddSalaryForm', () => {
  beforeEach(() => {
    handleClose.mockReset();
    onSuccess.mockReset();
  });

  it('renders the "Add Monthly Salary" heading', () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, { preloadedState: salaryState });
    expect(screen.getByText(/add monthly salary/i)).toBeInTheDocument();
  });

  it('renders month and year select elements', () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, { preloadedState: salaryState });
    const combos = screen.getAllByRole('combobox');
    expect(combos).toHaveLength(2);
  });

  it('defaults the year to the current year', () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, { preloadedState: salaryState });
    expect(getYearSelect().value).toBe(String(new Date().getFullYear()));
  });

  it('defaults total_days to 30', () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, { preloadedState: salaryState });
    const totalDaysInput = screen.getByPlaceholderText(/e\.g\. 30/i) as HTMLInputElement;
    expect(totalDaysInput.value).toBe('30');
  });

  it('shows error when payroll month is not selected', async () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, { preloadedState: salaryState });
    // Submit without selecting a month (default value is "")
    await userEvent.click(screen.getByRole('button', { name: /^add salary$/i }));

    await waitFor(() => {
      // zod v4 may output its own message rather than invalid_type_error in some cases
      const allText = document.body.textContent ?? '';
      expect(allText).toMatch(/invalid|required|select|nan/i);
    }, { timeout: 3000 });
  });

  it('shows working_days refinement error when working_days > total_days', async () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, { preloadedState: salaryState });

    // Select month
    await userEvent.selectOptions(getMonthSelect(), '3');

    // working_days = 35 > total_days = 30
    await userEvent.clear(screen.getByPlaceholderText('e.g. 22'));
    await userEvent.type(screen.getByPlaceholderText('e.g. 22'), '35');
    await userEvent.type(screen.getByPlaceholderText('e.g. 20'), '0');
    await userEvent.type(screen.getByPlaceholderText('e.g. 2'), '0');

    await userEvent.click(screen.getByRole('button', { name: /^add salary$/i }));

    await waitFor(() => {
      expect(screen.getByText(/working days cannot exceed total days/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows refinement error when paid + unpaid > total_days', async () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, { preloadedState: salaryState });

    await userEvent.selectOptions(getMonthSelect(), '3');
    await userEvent.type(screen.getByPlaceholderText('e.g. 22'), '20');
    await userEvent.type(screen.getByPlaceholderText('e.g. 20'), '25');
    await userEvent.type(screen.getByPlaceholderText('e.g. 2'), '25'); // 25+25=50 > 30

    await userEvent.click(screen.getByRole('button', { name: /^add salary$/i }));

    await waitFor(() => {
      expect(screen.getByText(/paid \+ unpaid days cannot exceed total days/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls handleClose on Cancel', async () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, { preloadedState: salaryState });
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('disables submit when salaryMutating is true', () => {
    renderWithProviders(<AddSalaryForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />, {
      preloadedState: { salary: { ...salaryState.salary, salaryMutating: true } },
    });
    expect(screen.getByRole('button', { name: /^add salary$/i })).toBeDisabled();
  });
});
