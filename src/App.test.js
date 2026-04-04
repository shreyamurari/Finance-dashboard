import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Finance Panel shell', () => {
  render(<App />);
  expect(screen.getByText('FinDash')).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
});
