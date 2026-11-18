/**
 * Shared test utilities — Redux store wrapper and helpers.
 */
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../redux/reducers/authSlice';
import employeeReducer from '../redux/reducers/employeeSlice';
import salaryReducer from '../redux/reducers/salarySlice';
import metricsReducer from '../redux/reducers/metricsSlice';

// ─── Default preloaded state ──────────────────────────────────────────────────

export const defaultAuthState = {
  loading: false,
  user: { email: 'admin@test.com', firstname: 'Admin' },
};

export const defaultEmployeeState = {
  loading: false,
  employees: [],
  pagination: { total: 0, page: 1, limit: 20 },
  logsLoading: false,
  employeeLogs: null,
};

export const defaultSalaryState = {
  basePayLoading: false,
  basePay: null,
  basePayNotFound: false,
  mutating: false,
  salaryListLoading: false,
  salaryList: [],
  salaryMutating: false,
};

export const defaultMetricsState = {
  loading: false,
  metrics: null,
};

// ─── Store factory ────────────────────────────────────────────────────────────

export function buildStore(preloadedState?: Record<string, any>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      employee: employeeReducer,
      salary: salaryReducer,
      metrics: metricsReducer,
    },
    preloadedState: {
      auth: defaultAuthState,
      employee: defaultEmployeeState,
      salary: defaultSalaryState,
      metrics: defaultMetricsState,
      ...preloadedState,
    },
  });
}

// ─── Render with Redux + Router ───────────────────────────────────────────────

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Record<string, any>;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: React.ReactElement,
  { preloadedState, initialEntries = ['/'], ...renderOptions }: CustomRenderOptions = {}
) {
  const store = buildStore(preloadedState);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </Provider>
  );

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// ─── Shared fixture data ──────────────────────────────────────────────────────

export const mockEmployee = {
  id: 1,
  firstname: 'Jane',
  lastname: 'Doe',
  email: 'jane.doe@test.com',
  country: 'India',
  state: 'Maharashtra',
  city: 'Mumbai',
  zipcode: '400001',
  address: '123 Test Street',
  phone_number: '+911234567890',
  department: 'Engineering',
  designation: 'Software Engineer',
  joining_date: '2023-01-15',
  created_at: '2023-01-15T00:00:00Z',
  added_by: 'admin',
};

export const mockSalaryRecord = {
  id: 10,
  employee_id: 1,
  payroll_month: 3,
  payroll_year: 2024,
  base_salary: '50000',
  allowances: '5000',
  deductions: '2000',
  gross_salary: '55000',
  net_salary: '53000',
  total_days: 31,
  working_days: 22,
  paid_days: 20,
  unpaid_days: 2,
  payment_date: '2024-03-31',
  payment_status: 'PENDING',
  added_by: 'admin',
};

export const mockBasePay = {
  employee_id: 1,
  base_salary: '50000',
  allowances: '5000',
  added_by: 'admin',
  created_at: '2023-01-15T00:00:00Z',
};
