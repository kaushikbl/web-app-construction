```js
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('BuildNest Application', () => {

  test('renders login screen', () => {
    render(<App />);

    expect(
      screen.getByText(/BuildNest/i)
    ).toBeInTheDocument();

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
```
