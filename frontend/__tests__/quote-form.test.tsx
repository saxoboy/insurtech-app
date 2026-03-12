import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteForm } from '@/components/quote-form';

// ─── Mocks ──────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/actions/catalogs', () => ({
  getInsuranceTypes: vi.fn().mockResolvedValue({
    items: [
      { code: 'AUTO', name: 'Seguro de Auto' },
      { code: 'SALUD', name: 'Seguro de Salud' },
      { code: 'HOGAR', name: 'Seguro de Hogar' },
    ],
  }),
  getLocations: vi.fn().mockResolvedValue({
    items: [
      { code: 'EC-PICHINCHA', name: 'Pichincha' },
      { code: 'EC-GUAYAS', name: 'Guayas' },
    ],
  }),
  getCoverages: vi.fn().mockResolvedValue({
    items: [
      { code: 'ESTANDAR', name: 'Estándar' },
      { code: 'PREMIUM', name: 'Premium' },
      { code: 'GOLD', name: 'Gold' },
    ],
  }),
}));

vi.mock('@/lib/actions/quotes', () => ({
  createQuote: vi.fn().mockResolvedValue({ id: 'quote-123' }),
}));

// ─── Helpers ────────────────────────────────────────────

/** Waits until catalog skeletons are replaced by the actual select triggers */
async function waitForCatalogsLoaded() {
  await waitFor(() => {
    expect(screen.getByLabelText('Tipo de seguro')).toBeDefined();
  });
}

/** Returns the submit button (type="submit") */
function getSubmitButton() {
  return document.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  ) as HTMLButtonElement;
}

// ─── Tests ──────────────────────────────────────────────

describe('QuoteForm', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the form title', async () => {
    render(<QuoteForm />);
    expect(screen.getByText('Solicitar Cotización')).toBeDefined();
  });

  it('shows loading skeletons initially', () => {
    render(<QuoteForm />);
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders all form fields after catalogs load', async () => {
    render(<QuoteForm />);

    await waitForCatalogsLoaded();

    expect(screen.getByLabelText('Tipo de seguro')).toBeDefined();
    expect(screen.getByLabelText('Edad')).toBeDefined();
    expect(screen.getByLabelText('Ubicación')).toBeDefined();
    expect(getSubmitButton()).not.toBeNull();
  });

  it('shows validation error when age is below 18', async () => {
    const user = userEvent.setup();
    render(<QuoteForm />);
    await waitForCatalogsLoaded();

    const ageInput = screen.getByLabelText('Edad');
    await user.clear(ageInput);
    await user.type(ageInput, '10');

    // Submit the form directly
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      const alerts = screen.queryAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('shows validation error when age is above 100', async () => {
    const user = userEvent.setup();
    render(<QuoteForm />);
    await waitForCatalogsLoaded();

    const ageInput = screen.getByLabelText('Edad');
    await user.clear(ageInput);
    await user.type(ageInput, '101');

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.queryAllByRole('alert').length).toBeGreaterThan(0);
    });
  });

  it('does not navigate when required fields are missing', async () => {
    const user = userEvent.setup();
    render(<QuoteForm />);
    await waitForCatalogsLoaded();

    await user.click(getSubmitButton()!);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('navigates to quote result after successful submit', async () => {
    const user = userEvent.setup();
    const { createQuote } = await import('@/lib/actions/quotes');
    const { getCoverages } = await import('@/lib/actions/catalogs');

    render(<QuoteForm />);
    await waitForCatalogsLoaded();

    // 1. Select insurance type
    await user.click(screen.getByLabelText('Tipo de seguro'));
    await waitFor(() => {
      expect(screen.queryByText('Seguro de Auto')).not.toBeNull();
    });
    await user.click(screen.getByText('Seguro de Auto'));

    // 2. Wait for coverages to load
    await waitFor(() => {
      expect(getCoverages).toHaveBeenCalledWith('AUTO');
    });

    // 3. Select coverage
    const coverageTrigger = screen.getByLabelText('Cobertura');
    await user.click(coverageTrigger);
    await waitFor(() => {
      expect(screen.queryByText('Estándar')).not.toBeNull();
    });
    await user.click(screen.getByText('Estándar'));

    // 4. Fill age
    const ageInput = screen.getByLabelText('Edad');
    await user.clear(ageInput);
    await user.type(ageInput, '30');

    // 5. Select location
    await user.click(screen.getByLabelText('Ubicación'));
    await waitFor(() => {
      expect(screen.queryByText('Pichincha')).not.toBeNull();
    });
    await user.click(screen.getByText('Pichincha'));

    // 6. Submit
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(createQuote).toHaveBeenCalledWith({
        insuranceType: 'AUTO',
        coverage: 'ESTANDAR',
        age: 30,
        location: 'EC-PICHINCHA',
      });
      expect(mockPush).toHaveBeenCalledWith('/quote/quote-123');
    });
  });
});

