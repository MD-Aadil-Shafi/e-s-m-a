import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import Filter from '../../../utils/Filters';
import type { FilterConfig } from '../../../utils/Filters';

const selectField: FilterConfig['fields'][0] = {
  type: 'select',
  key: 'country',
  label: 'Country',
  placeholder: 'All countries',
  options: [
    { value: 'India', label: 'India' },
    { value: 'USA', label: 'United States' },
  ],
};

const radioField: FilterConfig['fields'][0] = {
  type: 'radio',
  key: 'order',
  label: 'Sort',
  options: [
    { value: 'desc', label: 'Newest' },
    { value: 'asc', label: 'Oldest' },
  ],
};

function buildConfig(overrides: Partial<FilterConfig> = {}): FilterConfig {
  return {
    fields: [selectField, radioField],
    queryData: {},
    setQueryData: vi.fn(),
    ...overrides,
  };
}

describe('Filter component', () => {
  it('renders a "Filter" toggle button initially', () => {
    const config = buildConfig();
    render(<Filter config={config} />);
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  it('fields are hidden before toggling open', () => {
    const config = buildConfig();
    render(<Filter config={config} />);
    expect(screen.queryByText(/country/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sort/i)).not.toBeInTheDocument();
  });

  it('shows fields after clicking the Filter button', async () => {
    const config = buildConfig();
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
  });

  it('renders "Close" text when open', async () => {
    const config = buildConfig();
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('closes the filter panel on second toggle click', async () => {
    const config = buildConfig();
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('Country')).not.toBeInTheDocument();
  });

  it('renders radio option buttons when open', async () => {
    const config = buildConfig();
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByRole('button', { name: /newest/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /oldest/i })).toBeInTheDocument();
  });

  it('calls setQueryData with the selected radio value', async () => {
    const setQueryData = vi.fn();
    const config = buildConfig({ setQueryData });
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    await userEvent.click(screen.getByRole('button', { name: /newest/i }));
    expect(setQueryData).toHaveBeenCalledWith(expect.objectContaining({ order: 'desc' }));
  });

  it('deselects the radio option when clicking the active option again', async () => {
    const setQueryData = vi.fn();
    const config = buildConfig({
      queryData: { order: 'desc' },
      setQueryData,
    });
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    // Click the already-active "Newest" button
    await userEvent.click(screen.getByRole('button', { name: /newest/i }));
    // Should delete the key (value === undefined triggers deletion)
    const lastCall = setQueryData.mock.calls[setQueryData.mock.calls.length - 1][0];
    expect(lastCall.order).toBeUndefined();
  });

  it('shows active-filter badge count when closed and a filter is active', () => {
    const config = buildConfig({ queryData: { order: 'desc' } });
    render(<Filter config={config} />);
    // Badge with count "1" should be visible on the toggle button
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not show badge when no filters are active', () => {
    const config = buildConfig({ queryData: {} });
    render(<Filter config={config} />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows "Clear" button when filters are active and panel is open', async () => {
    const config = buildConfig({ queryData: { order: 'desc' } });
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls setQueryData({}) when Clear is clicked', async () => {
    const setQueryData = vi.fn();
    const config = buildConfig({ queryData: { order: 'desc' }, setQueryData });
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(setQueryData).toHaveBeenCalledWith({});
  });

  it('does not show "Clear" button when no filters are active', async () => {
    const config = buildConfig({ queryData: {} });
    render(<Filter config={config} />);
    await userEvent.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });
});
