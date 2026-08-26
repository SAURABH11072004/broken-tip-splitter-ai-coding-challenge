import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import * as api from '../services/api';

const mockCalculations = [
  {
    id: 'mock-1',
    billCents: 1003,
    tipPercentage: 15,
    tipCents: 150,
    grandTotalCents: 1153,
    peopleCount: 3,
    baseShareCents: 384,
    remainderCents: 1,
    remainderExplanation: '1 extra cent was assigned to Person 1...',
    verificationTotalCents: 1153,
    isVerified: true,
    shares: [
      { personNumber: 1, baseShareCents: 384, extraCents: 1, finalShareCents: 385 },
      { personNumber: 2, baseShareCents: 384, extraCents: 0, finalShareCents: 384 },
      { personNumber: 3, baseShareCents: 384, extraCents: 0, finalShareCents: 384 },
    ],
    createdAt: '2026-08-26T12:00:00.000Z',
  },
];

// Mock API calls
vi.mock('../services/api', () => ({
  fetchCalculations: vi.fn(),
  saveCalculation: vi.fn(),
  updateCalculation: vi.fn(),
  deleteCalculationRecord: vi.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchCalculations).mockResolvedValue(mockCalculations);
    vi.mocked(api.saveCalculation).mockResolvedValue(mockCalculations[0]);
    vi.mocked(api.updateCalculation).mockResolvedValue(mockCalculations[0]);
    vi.mocked(api.deleteCalculationRecord).mockResolvedValue({ id: 'mock-1', message: 'Deleted' });
  });

  it('renders header, initial inputs, and default calculation correctly ($10.03, 15% tip, 3 people)', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText(/Broken Tip Splitter/i)).toBeInTheDocument();

    // Default inputs
    const billInput = screen.getByLabelText(/Bill Amount/i) as HTMLInputElement;
    const tipInput = screen.getByLabelText(/Tip Percentage/i) as HTMLInputElement;
    const peopleInput = screen.getByLabelText(/Number of People/i) as HTMLInputElement;

    expect(billInput.value).toBe('10.03');
    expect(tipInput.value).toBe('15');
    expect(peopleInput.value).toBe('3');

    // Verification badge & breakdown
    expect(screen.getByText(/Mathematical Invariant Verified/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$11.53/i).length).toBeGreaterThanOrEqual(1); // Grand total
    expect(screen.getByText(/\$3.85/i)).toBeInTheDocument(); // Person 1 final share
    expect(screen.getAllByText(/\$3.84/i).length).toBeGreaterThanOrEqual(2); // Person 2 and 3
  });

  it('updates calculation instantly on bill input change', async () => {
    await act(async () => {
      render(<App />);
    });

    const billInput = screen.getByLabelText(/Bill Amount/i);
    await act(async () => {
      fireEvent.change(billInput, { target: { value: '12.00' } });
    });

    const tipInput = screen.getByLabelText(/Tip Percentage/i);
    await act(async () => {
      fireEvent.change(tipInput, { target: { value: '0' } });
    });

    const peopleInput = screen.getByLabelText(/Number of People/i);
    await act(async () => {
      fireEvent.change(peopleInput, { target: { value: '3' } });
    });

    // $12.00 / 3 people with 0% tip = $4.00 each
    expect(screen.getByText(/The total divides evenly. No extra cents need to be assigned./i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$4.00/i).length).toBeGreaterThanOrEqual(3);
  });

  it('displays validation error when bill is negative or zero', async () => {
    await act(async () => {
      render(<App />);
    });

    const billInput = screen.getByLabelText(/Bill Amount/i);
    await act(async () => {
      fireEvent.change(billInput, { target: { value: '-5.00' } });
    });

    expect(screen.getByText(/Bill amount must be greater than zero./i)).toBeInTheDocument();
  });

  it('displays validation error when number of people is decimal or 0', async () => {
    await act(async () => {
      render(<App />);
    });

    const peopleInput = screen.getByLabelText(/Number of People/i);
    await act(async () => {
      fireEvent.change(peopleInput, { target: { value: '2.5' } });
    });

    expect(screen.getByText(/Number of people must be a whole integer./i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(peopleInput, { target: { value: '0' } });
    });
    expect(screen.getByText(/Number of people must be at least 1./i)).toBeInTheDocument();
  });

  it('handles tip presets and party presets buttons properly', async () => {
    await act(async () => {
      render(<App />);
    });

    const tip20Button = screen.getByRole('button', { name: '20%' });
    await act(async () => {
      fireEvent.click(tip20Button);
    });

    const tipInput = screen.getByLabelText(/Tip Percentage/i) as HTMLInputElement;
    expect(tipInput.value).toBe('20');

    const people4Button = screen.getByRole('button', { name: '4 People' });
    await act(async () => {
      fireEvent.click(people4Button);
    });

    const peopleInput = screen.getByLabelText(/Number of People/i) as HTMLInputElement;
    expect(peopleInput.value).toBe('4');
  });

  it('saves calculation when clicking Save button', async () => {
    await act(async () => {
      render(<App />);
    });

    const saveButton = screen.getByRole('button', { name: /Save Calculation to History/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(api.saveCalculation).toHaveBeenCalledWith({
        billAmount: '10.03',
        tipPercentage: '15',
        peopleCount: '3',
      });
    });
  });

  it('loads historical calculation into form when selected from history list', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Load calculation mock-1')).toBeInTheDocument();
    });

    const loadButton = screen.getByLabelText('Load calculation mock-1');
    await act(async () => {
      fireEvent.click(loadButton);
    });

    const billInput = screen.getByLabelText(/Bill Amount/i) as HTMLInputElement;
    expect(billInput.value).toBe('10.03');
  });

  it('deletes calculation from history when delete button clicked', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Delete calculation mock-1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete calculation mock-1');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(api.deleteCalculationRecord).toHaveBeenCalledWith('mock-1');
    });
  });

  it('toggles explainer accordion when button clicked', async () => {
    await act(async () => {
      render(<App />);
    });

    const toggleButton = screen.getByRole('button', { name: /How the rounding bug works/i });
    expect(screen.queryByText(/Why Standard Bill Splitters Silently Lose Cents/i)).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(screen.getByText(/Why Standard Bill Splitters Silently Lose Cents/i)).toBeInTheDocument();
  });
});
