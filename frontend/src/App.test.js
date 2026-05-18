import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('BuildNest Application', () => {

  test('renders brand title', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /BuildNest/i
      })
    ).toBeInTheDocument();
  });

  test('renders dashboard subtitle', () => {
    render(<App />);

    expect(
      screen.getByText(/Smart Construction Dashboard/i)
    ).toBeInTheDocument();
  });

  test('renders login button', () => {
    render(<App />);

    expect(
      screen.getByRole('button', {
        name: /Enter Dashboard/i
      })
    ).toBeInTheDocument();
  });

  test('renders input field', () => {
    render(<App />);

    expect(
      screen.getByPlaceholderText(/Enter your name/i)
    ).toBeInTheDocument();
  });

});