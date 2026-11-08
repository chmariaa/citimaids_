import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Footer from './Footer';

// Mock useSettings so unit tests test the UI without triggering real network calls
vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      business_name: 'CitiMaids Cleaning Services',
      contact_number: '+971 52 634 9461',
      business_email: 'info@citi-maids.com',
    },
    loading: false,
    error: null,
  }),
}));

describe('Footer Component', () => {
  it('renders company branding and navigation links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    // Verify company name is present across branding elements
    const brandElements = screen.getAllByText(/CitiMaids/i);
    expect(brandElements.length).toBeGreaterThan(0);

    // Verify brand tagline is present
    expect(screen.getByText(/Cleaning & Maintenance/i)).toBeInTheDocument();

    // Verify key navigation links exist
    expect(screen.getByRole('link', { name: /^Home$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Our Cleaning Services/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /About CitiMaids/i })).toBeInTheDocument();
  });
});
