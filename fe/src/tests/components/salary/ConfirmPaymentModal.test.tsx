import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockSalaryRecord } from '../../testUtils';
import ConfirmPaymentModal from '../../../components/salary/modals/ConfirmPaymentModal';

const { mockConfirmPayment } = vi.hoisted(() => ({
  mockConfirmPayment: vi.fn((payload: any) => ({
    type: 'salary/confirmPayment/fulfilled',
    payload,
    error: undefined,
  })),
}));

vi.mock('../../../redux/reducers/salarySlice', async () => {
  const actual = await vi.importActual<typeof import('../../../redux/reducers/salarySlice')>(
    '../../../redux/reducers/salarySlice'
  );
  return { ...actual, confirmPayment: mockConfirmPayment };
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

describe('ConfirmPaymentModal', () => {
  beforeEach(() => {
    handleClose.mockReset();
    onSuccess.mockReset();
    mockConfirmPayment.mockClear();
  });

  it('renders the heading', () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByText(/confirm payment manually/i)).toBeInTheDocument();
  });

  it('renders the payroll month/year subtitle', () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    // payroll_month=3 (March), payroll_year=2024
    expect(screen.getByText(/march 2024/i)).toBeInTheDocument();
  });

  it('renders the warning alert', () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByText(/manual override/i)).toBeInTheDocument();
  });

  it('shows the current payment status of the record', () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    // mockSalaryRecord.payment_status = 'PENDING'
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('renders PROCESSED and HOLD radio buttons', () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    expect(screen.getByText(/processed/i)).toBeInTheDocument();
    expect(screen.getByText(/hold/i)).toBeInTheDocument();
  });

  it('defaults the status selection to PROCESSED', () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    // Ant Design Radio.Group — the hidden <input> carries the checked state
    const processedInputs = document.querySelectorAll('input[type="radio"]');
    const processedInput = Array.from(processedInputs).find(
      (el) => (el as HTMLInputElement).value === 'PROCESSED'
    ) as HTMLInputElement | undefined;
    expect(processedInput).toBeDefined();
    expect(processedInput?.checked).toBe(true);
  });

  it('calls handleClose on Cancel', async () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('dispatches confirmPayment with PROCESSED status on submit', async () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

    await waitFor(() => {
      expect(mockConfirmPayment).toHaveBeenCalledWith({
        id: mockSalaryRecord.id,
        payment_status: 'PROCESSED',
      });
    });
  });

  it('dispatches confirmPayment with HOLD when HOLD is selected', async () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );

    // Click the HOLD Radio.Button — Ant Design renders a label wrapping the radio
    // The clickable element is the <label> or the button, not the hidden <input>
    const holdButton = screen.getByText('Hold').closest('label') ??
                       screen.getByText('Hold').closest('button') ??
                       screen.getByText('Hold');
    await userEvent.click(holdButton as HTMLElement);

    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

    await waitFor(() => {
      expect(mockConfirmPayment).toHaveBeenCalledWith({
        id: mockSalaryRecord.id,
        payment_status: 'HOLD',
      });
    });
  });

  it('disables submit button when salaryMutating is true', () => {
    renderWithProviders(
      <ConfirmPaymentModal record={mockSalaryRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: { salary: { ...salaryState.salary, salaryMutating: true } } }
    );
    expect(screen.getByRole('button', { name: /^confirm$/i })).toBeDisabled();
  });

  it('shows current status badge in green when status is "processed"', () => {
    const processedRecord = { ...mockSalaryRecord, payment_status: 'processed' };
    renderWithProviders(
      <ConfirmPaymentModal record={processedRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    const badge = screen.getByText('processed');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-700');
  });

  it('shows current status badge in orange when status is "hold"', () => {
    const holdRecord = { ...mockSalaryRecord, payment_status: 'hold' };
    renderWithProviders(
      <ConfirmPaymentModal record={holdRecord} handleClose={handleClose} onSuccess={onSuccess} />,
      { preloadedState: salaryState }
    );
    const badge = screen.getByText('hold');
    expect(badge).toHaveClass('bg-orange-100');
    expect(badge).toHaveClass('text-orange-700');
  });
});
