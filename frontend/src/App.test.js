import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';
jest.mock('axios');

describe('Expense Dashboard', () => {
  const mockExpenses = [
    {
      _id: '1',
      quantity: '2',
      category: 'Food',
      amount: 100,
      notes: 'Lunch',
      date: new Date().toISOString(),
      Image: '/images/bill1.png',
    },
  ];

  const mockCategories = [{ _id: 'c1', name: 'Food' }];

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.endsWith('/expenses')) return Promise.resolve({ data: mockExpenses });
      if (url.endsWith('/categories')) return Promise.resolve({ data: mockCategories });
    });

    axios.post.mockResolvedValue({ data: mockExpenses[0] });
    axios.delete.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the dashboard title', async () => {
    render(<App />);
    expect(await screen.findByText(/Expense Dashboard/i)).toBeInTheDocument();
  });

  test('renders existing expenses and total', async () => {
    render(<App />);
    expect(await screen.findByText(/Lunch/i)).toBeInTheDocument();
    expect(screen.getByText(/₹100/i)).toBeInTheDocument();
    expect(screen.getByText(/Total: ₹100/i)).toBeInTheDocument();
  });

  test('adds a new expense', async () => {
    render(<App />);
    const quantityInput = screen.getByPlaceholderText('Quantity');
    const amountInput = screen.getByPlaceholderText('Amount');
    const categorySelect = screen.getByRole('combobox');
    const addButton = screen.getByText('Add');

    fireEvent.change(quantityInput, { target: { value: '3' } });
    fireEvent.change(amountInput, { target: { value: '200' } });
    fireEvent.change(categorySelect, { target: { value: 'Food' } });

    fireEvent.click(addButton);

    // Wait for new expense to appear
    await waitFor(() => {
      expect(screen.getAllByText(/Food/i).length).toBe(2);
      expect(screen.getAllByText(/₹100|₹200/i).length).toBeGreaterThanOrEqual(2);
    });
  });

  test('deletes an expense', async () => {
    render(<App />);
    // Mock window.confirm to always return true
    jest.spyOn(window, 'confirm').mockReturnValueOnce(true);

    const deleteButton = await screen.findByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText(/Lunch/i)).not.toBeInTheDocument();
    });
  });

  test('opens and closes image preview modal', async () => {
    render(<App />);
    const image = await screen.findByAltText('View');
    fireEvent.click(image);

    // Modal should appear
    expect(screen.getByAltText('Preview')).toBeInTheDocument();

    // Close modal by clicking overlay
    fireEvent.click(screen.getByAltText('Preview').parentElement);
    await waitFor(() => {
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
    });
  });

  test('shows "No Bill" if image is not available', async () => {
    const expensesWithoutImage = [
      { ...mockExpenses[0], Image: null },
    ];
    axios.get.mockResolvedValueOnce({ data: expensesWithoutImage });

    render(<App />);
    expect(await screen.findByText(/No Bill/i)).toBeInTheDocument();
  });
});
