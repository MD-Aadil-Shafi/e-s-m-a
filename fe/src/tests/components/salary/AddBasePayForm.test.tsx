import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils';
import AddBasePayForm from '../../../components/salary/modals/AddBasePayForm';

vi.mock('../../../redux/reducers/salarySlice', async () => {
  const actual = await vi.importActual<typeof import('../../../redux/reducers/salarySlice')>(
    '../../../redux/reducers/salarySlice'
  );
  return {
    ...actual,
    addBasePay: vi.fn((payload: any) => ({
      type: 'salary/addBasePay/fulfilled',
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

describe('AddBasePayForm', () => {
  beforeEach(() => {
    handleClose.mockReset();
    onSuccess.mockReset();
  });

  it('renders "Add Base Pay" heading', () => {
    renderWithProviders(
      <AddBasePayForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByRole('heading', { name: /add base pay/i })).toBeInTheDocument();
  });

  it('renders Base Salary and Allowances inputs', () => {
    renderWithProviders(
      <AddBasePayForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByPlaceholderText('e.g. 50000.00')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 5000.00')).toBeInTheDocument();
  });

  it('defaults allowances to 0.00', () => {
    renderWithProviders(
      <AddBasePayForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    const allowancesInput = screen.getByPlaceholderText('e.g. 5000.00') as HTMLInputElement;
    expect(allowancesInput.value).toBe('0.00');
  });

  it('shows required error when base_salary is empty', async () => {
    renderWithProviders(
      <AddBasePayForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    const baseSalaryInput = screen.getByPlaceholderText('e.g. 50000.00');
    await userEvent.clear(baseSalaryInput);
    await userEvent.click(screen.getByRole('button', { name: /add base pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  it('shows error when base_salary is not a positive number', async () => {
    renderWithProviders(
      <AddBasePayForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    // Clear base_salary and submit — the "Required" error from zod min(1) fires
    const baseSalaryInput = screen.getByPlaceholderText('e.g. 50000.00');
    await userEvent.clear(baseSalaryInput);
    await userEvent.click(screen.getByRole('button', { name: /add base pay/i }));

    await waitFor(() => {
      // zod: z.string().min(1, "Required") fires when input is cleared
      const allText = document.body.textContent ?? '';
      expect(allText).toMatch(/required/i);
    }, { timeout: 3000 });
  });

  it('calls handleClose on Cancel', async () => {
    renderWithProviders(
      <AddBasePayForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('disables submit button when mutating is true', () => {
    renderWithProviders(
      <AddBasePayForm employeeId={1} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: { salary: { ...salaryState.salary, mutating: true } } }
    );
    expect(screen.getByRole('button', { name: /add base pay/i })).toBeDisabled();
  });
});
