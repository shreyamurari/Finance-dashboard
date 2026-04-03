import {
  ADD_TRANSACTION,
  UPDATE_TRANSACTION,
  DELETE_TRANSACTION,
  SET_ROLE,
  SET_SEARCH_QUERY,
  SET_SORT,
  SET_FILTERS,
  TOGGLE_THEME,
  LOAD_TRANSACTIONS,
  SET_LOADING,
  SET_ERROR
} from './actions';

const initialTransactions = [
  { id: 1, name: 'Starbucks', date: '2026-03-20', amount: 10.45, category: 'Food', type: 'expense', status: 'Completed' },
  { id: 2, name: 'Amazon', date: '2026-03-19', amount: 98.22, category: 'Shopping', type: 'expense', status: 'Completed' },
  { id: 3, name: 'Rent', date: '2026-03-01', amount: 1200.0, category: 'Housing', type: 'expense', status: 'Completed' },
  { id: 4, name: 'Salary', date: '2026-02-28', amount: 5000.0, category: 'Income', type: 'income', status: 'Paid In' },
];

const initialState = {
  transactions: initialTransactions,
  role: 'viewer',
  theme: 'light',
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

export const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TRANSACTION:
      return {
        ...state,
        transactions: [...state.transactions, { id: Date.now(), ...action.payload }],
      };
    case UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id ? action.payload : tx
        ),
      };
    case DELETE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.filter((tx) => tx.id !== action.payload),
      };
    case SET_ROLE:
      return {
        ...state,
        role: action.payload,
      };
    case SET_SEARCH_QUERY:
      return {
        ...state,
        filters: { ...state.filters, searchQuery: action.payload },
      };
    case SET_SORT:
      return {
        ...state,
        filters: {
          ...state.filters,
          sortBy: action.payload.sortBy,
          sortDirection: action.payload.sortDirection,
        },
      };
    case SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    case TOGGLE_THEME:
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      };
    case LOAD_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload,
        loading: false,
      };
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};
