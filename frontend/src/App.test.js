import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders BuildTrack AI application', () => {
  render(<App />);
  expect(screen.getByText(/BuildTrack AI/i)).toBeInTheDocument();
});