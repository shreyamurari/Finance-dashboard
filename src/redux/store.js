import { createStore } from 'redux';
import { appReducer, DEFAULT_TRANSACTIONS } from './reducer';
import { loadFromLocalStorage, saveToLocalStorage, loadThemePreference } from '../utils/dataUtils';

const STORAGE_KEY_TRANSACTIONS = 'transactions';

/**
 * If `transactions` was never saved in this browser, use the default seed list.
 * If it was saved (including an empty array after deleting everything), use that —
 * so reloads keep deletions; a new browser/incognito has no key and gets defaults again.
 */
const loadPersistedTransactions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);   // like when backend is integrated, this is the source of truth for transactions data; if missing, use defaults
    if (raw === null) {
      return DEFAULT_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_TRANSACTIONS;
  } catch {
    return DEFAULT_TRANSACTIONS;
  }
};

// Load initial state from localStorage
const loadInitialState = () => {
  const savedTransactions = loadPersistedTransactions();
  const savedTheme = loadThemePreference();
  const savedRole = loadFromLocalStorage('role', 'viewer');

  return {
    transactions: savedTransactions,
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

// First visit: persist seed so anything reading `transactions` directly matches Redux
if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_TRANSACTIONS) === null) {
  saveToLocalStorage(STORAGE_KEY_TRANSACTIONS, store.getState().transactions);
}

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
