export const ADD_TRANSACTION = 'ADD_TRANSACTION';
export const UPDATE_TRANSACTION = 'UPDATE_TRANSACTION';
export const DELETE_TRANSACTION = 'DELETE_TRANSACTION';
export const SET_ROLE = 'SET_ROLE';
export const SET_SEARCH_QUERY = 'SET_SEARCH_QUERY';
export const SET_SORT = 'SET_SORT';
export const SET_FILTERS = 'SET_FILTERS';
export const TOGGLE_THEME = 'TOGGLE_THEME';
export const LOAD_TRANSACTIONS = 'LOAD_TRANSACTIONS';
export const SET_LOADING = 'SET_LOADING';
export const SET_ERROR = 'SET_ERROR';

export const addTransaction = (transaction) => ({
  type: ADD_TRANSACTION,
  payload: transaction,
});

export const updateTransaction = (transaction) => ({
  type: UPDATE_TRANSACTION,
  payload: transaction,
});

export const deleteTransaction = (id) => ({
  type: DELETE_TRANSACTION,
  payload: id,
});

export const setRole = (role) => ({
  type: SET_ROLE,
  payload: role,
});

export const setSearchQuery = (query) => ({
  type: SET_SEARCH_QUERY,
  payload: query,
});

export const setSort = (sortBy, sortDirection) => ({
  type: SET_SORT,
  payload: { sortBy, sortDirection },
});

export const setFilters = (filters) => ({
  type: SET_FILTERS,
  payload: filters,
});

export const toggleTheme = () => ({
  type: TOGGLE_THEME,
});

export const loadTransactions = (transactions) => ({
  type: LOAD_TRANSACTIONS,
  payload: transactions,
});

export const setLoading = (loading) => ({
  type: SET_LOADING,
  payload: loading,
});

export const setError = (error) => ({
  type: SET_ERROR,
  payload: error,
});
