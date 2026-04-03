import { createStore } from 'redux';
import { appReducer } from './reducer';
import { loadFromLocalStorage, saveToLocalStorage, loadThemePreference } from '../utils/dataUtils';

// Load initial state from localStorage
const loadInitialState = () => {
  const savedTransactions = loadFromLocalStorage('transactions');
  const savedTheme = loadThemePreference();
  const savedRole = loadFromLocalStorage('role', 'viewer');

  return {
    transactions: savedTransactions || [],
    role: savedRole,
    theme: savedTheme,
    loading: false,
    error: null,
    filters: {
      searchQuery: '',
      sortBy: 'date',
      sortDirection: 'desc',
      category: 'all',
      type: 'all',
      status: 'all',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' },
    },
  };
};

export const store = createStore(appReducer, loadInitialState());

// Subscribe to store changes and save to localStorage
store.subscribe(() => {
  const state = store.getState();

  // Save transactions
  saveToLocalStorage('transactions', state.transactions);

  // Save theme preference
  saveToLocalStorage('theme', state.theme);

  // Save role preference
  saveToLocalStorage('role', state.role);
});
