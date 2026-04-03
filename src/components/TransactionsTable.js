import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchQuery, setSort, deleteTransaction, addTransaction, setLoading, setError } from '../redux/actions';
import { exportToCSV, exportToJSON, mockApiCall } from '../utils/dataUtils';
import * as XLSX from 'xlsx';
import { dateToTimestampMs, formatDateForDisplay, normalizeExcelDate } from '../utils/dateUtils';
import AdvancedFilters from './AdvancedFilters';

const sortFns = {
  name: (a, b) => a.name.localeCompare(b.name),
  date: (a, b) => (dateToTimestampMs(a.date) || 0) - (dateToTimestampMs(b.date) || 0),
  amount: (a, b) => a.amount - b.amount,
  category: (a, b) => a.category.localeCompare(b.category),
  type: (a, b) => a.type.localeCompare(b.type),
  status: (a, b) => a.status.localeCompare(b.status),
};

export default function TransactionsTable({ transactions, role = 'viewer', onAddTransaction, onUpdateTransaction }) {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state);
  const { searchQuery, sortBy, sortDirection } = filters;

  const [isAddMode, setIsAddMode] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', amount: '', category: '', type: 'expense', status: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const resetForm = () => {
    setIsAddMode(false);
    setEditTarget(null);
    setForm({ name: '', date: '', amount: '', category: '', type: 'expense', status: '' });
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.name || !form.date || !form.amount || !form.category || !form.type || !form.status) {
      alert('Please fill in all fields before saving.');
      return;
    }

    const normalized = {
      ...form,
      amount: Number(form.amount),
    };

    if (isAddMode) {
      onAddTransaction?.({ id: Date.now(), ...normalized });
    } else if (editTarget) {
      onUpdateTransaction?.({ ...editTarget, ...normalized });
    }

    resetForm();
  };

  const startEdit = (tx) => {
    setEditTarget(tx);
    setIsAddMode(false);
    setForm({
      name: tx.name,
      date: tx.date,
      amount: tx.amount.toString(),
      category: tx.category,
      type: tx.type,
      status: tx.status,
    });
  };

  const filtered = useMemo(() => {
    let result = [...transactions];

    // Apply search query
    if (searchQuery.trim()) {
      const normalized = searchQuery.trim().toLowerCase();
      result = result.filter((tx) =>
        ['name', 'category', 'type', 'status', 'date'].some((key) =>
          String(tx[key]).toLowerCase().includes(normalized)
        )
      );
    }

    // Apply advanced filters
    if (filters.category !== 'all') {
      result = result.filter(tx => tx.category === filters.category);
    }

    if (filters.type !== 'all') {
      result = result.filter(tx => tx.type === filters.type);
    }

    if (filters.status !== 'all') {
      result = result.filter(tx => tx.status === filters.status);
    }

    if (filters.dateRange.start) {
      const startMs = dateToTimestampMs(filters.dateRange.start);
      result = result.filter(tx => {
        const txMs = dateToTimestampMs(tx.date);
        return Number.isNaN(startMs) ? true : (!Number.isNaN(txMs) && txMs >= startMs);
      });
    }

    if (filters.dateRange.end) {
      const endMs = dateToTimestampMs(filters.dateRange.end);
      result = result.filter(tx => {
        const txMs = dateToTimestampMs(tx.date);
        return Number.isNaN(endMs) ? true : (!Number.isNaN(txMs) && txMs <= endMs);
      });
    }

    if (filters.amountRange.min) {
      result = result.filter(tx => tx.amount >= parseFloat(filters.amountRange.min));
    }

    if (filters.amountRange.max) {
      result = result.filter(tx => tx.amount <= parseFloat(filters.amountRange.max));
    }

    // Apply sorting
    const sorted = result.sort(sortFns[sortBy] || sortFns.date);
    if (sortDirection === 'desc') sorted.reverse();
    return sorted;
  }, [searchQuery, sortBy, sortDirection, transactions, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      dispatch(setLoading(true));
      await mockApiCall('deleteTransaction', id);
      dispatch(deleteTransaction(id));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await mockApiCall('fetchTransactions');
      exportToCSV(filtered, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      dispatch(setError('Failed to export data'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      await mockApiCall('fetchTransactions');
      exportToJSON(filtered, `transactions_${new Date().toISOString().split('T')[0]}.json`);
    } catch (error) {
      dispatch(setError('Failed to export data'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: true,
        cellDates: true,
      });

      const validTransactions = jsonData
        .map((row, index) => {
          const rawDate = row.Date ?? row.date ?? '';
          const normalizedDate = normalizeExcelDate(rawDate);

          const transaction = {
            id: Date.now() + index,
            name: String(row.Name || row.name || '').trim(),
            date: normalizedDate,
            amount: Number(row.Amount || row.amount || 0),
            category: String(row.Category || row.category || '').trim(),
            type: String(row.Type || row.type || 'expense').trim().toLowerCase(),
            status: String(row.Status || row.status || 'Completed').trim(),
          };

          if (!transaction.name || !transaction.date || Number.isNaN(transaction.amount) || !transaction.category) {
            console.warn(`Skipping invalid row ${index + 1}:`, row);
            return null;
          }

          return transaction;
        })
        .filter(Boolean);

      if (validTransactions.length === 0) {
        throw new Error('No valid transactions found in the Excel file');
      }

      validTransactions.forEach((tx) => {
        dispatch(addTransaction(tx));
      });

      alert(`Successfully imported ${validTransactions.length} transactions`);
    } catch (error) {
      dispatch(setError(`Failed to import Excel file: ${error.message}`));
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const changeSort = (column) => {
    const newDirection = sortBy === column ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
    dispatch(setSort(column, newDirection));
  };

  return (
    <section className="transactions-section">
      <h3>Recent Transactions</h3>

      <div className="controls">
        <input
          type="search"
          aria-label="Search transactions"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search by name/date/category/type/status"
          className="search-input"
        />
        <span className="results-count">Total: {filtered.length}</span>

        <div className="control-buttons">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="btn btn-secondary"
          >
            Filters
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting || filtered.length === 0}
            className="btn btn-success"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={handleExportJSON}
            disabled={isExporting || filtered.length === 0}
            className="btn btn-success"
          >
            {isExporting ? 'Exporting...' : 'Export JSON'}
          </button>

          {role === 'admin' && (
            <>
              <label htmlFor="excel-import" className="btn btn-import" style={{ cursor: 'pointer' }}>
                {isImporting ? 'Importing...' : 'Import Excel'}
              </label>
              <input
                id="excel-import"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                disabled={isImporting}
                style={{ display: 'none' }}
              />
            </>
          )}

          {role === 'admin' ? (
            <button
              onClick={() => {
                setIsAddMode(true);
                setEditTarget(null);
                setForm({ name: '', date: '', amount: '', category: '', type: 'expense', status: '' });
              }}
              className="btn btn-primary"
            >
              + Add Transaction
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#999' }}>
              Viewer mode: no edit actions
            </span>
          )}
        </div>
      </div>

      {(isAddMode || editTarget) && (
        <div className="transaction-form">
          <h4>{isAddMode ? 'Add Transaction' : 'Edit Transaction'}</h4>
          <div className="form-grid">
            <input
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Name"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleFormChange('date', e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              placeholder="Amount"
            />
            <input
              value={form.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              placeholder="Category"
            />
            <select value={form.type} onChange={(e) => handleFormChange('type', e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input
              value={form.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
              placeholder="Status"
            />
          </div>
          <div className="form-actions">
            <button onClick={handleSave} className="btn btn-success">
              Save
            </button>
            <button onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h4>No transactions found</h4>
          <p>
            {searchQuery
              ? `No transactions match your search "${searchQuery}". Try adjusting your search terms.`
              : role === 'admin'
              ? 'Get started by adding your first transaction using the button above.'
              : 'No transactions have been added yet.'
            }
          </p>
          {role === 'admin' && !searchQuery && (
            <button
              onClick={() => {
                setIsAddMode(true);
                setEditTarget(null);
                setForm({ name: '', date: '', amount: '', category: '', type: 'expense', status: '' });
              }}
              className="btn btn-primary"
              style={{ marginTop: '12px' }}
            >
              Add Your First Transaction
            </button>
          )}
        </div>
      ) : (
        <table className="transaction-table">
          <thead>
            <tr>
              <th onClick={() => changeSort('name')} style={{ cursor: 'pointer' }}>
                Name {sortBy === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => changeSort('date')} style={{ cursor: 'pointer' }}>
                Date {sortBy === 'date' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => changeSort('amount')} style={{ cursor: 'pointer' }}>
                Amount {sortBy === 'amount' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => changeSort('category')} style={{ cursor: 'pointer' }}>
                Category {sortBy === 'category' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => changeSort('type')} style={{ cursor: 'pointer' }}>
                Type {sortBy === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.name}</td>
                <td>{formatDateForDisplay(tx.date)}</td>
                <td>{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                <td>{tx.category}</td>
                <td>
                  <span style={{
                    color: tx.type === 'income' ? 'var(--green)' : 'var(--red)',
                    fontWeight: '500'
                  }}>
                    {tx.type}
                  </span>
                </td>
                <td>{tx.status}</td>
                <td>
                  {role === 'admin' ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => startEdit(tx)}
                        className="btn btn-success"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
      />
    </section>
  );
}
