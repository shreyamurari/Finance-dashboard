import React, { useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { setSearchQuery, setSort, deleteTransaction, addTransaction, setLoading, setError } from '../redux/actions';
import { exportToCSV, exportToJSON, mockApiCall } from '../utils/dataUtils';
import * as XLSX from 'xlsx';
import { dateToTimestampMs, formatDateForDisplay, normalizeExcelDate } from '../utils/dateUtils';
import AdvancedFilters from './AdvancedFilters';
import { Pencil, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

const columnHelper = createColumnHelper();

export default function TransactionsTable({
  transactions,
  role = 'viewer',
  viewMode = 'viewer',
  onAddTransaction,
  onUpdateTransaction,
}) {
  const dispatch = useDispatch();
  const { filters } = useSelector((state) => state);
  const { searchQuery, sortBy, sortDirection } = filters;

  const canMutate = role === 'admin' && viewMode === 'admin';

  const [isAddMode, setIsAddMode] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', amount: '', category: '', type: 'expense', status: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [importModal, setImportModal] = useState(null);

  const sorting = useMemo(
    () => (sortBy ? [{ id: sortBy, desc: sortDirection === 'desc' }] : []),
    [sortBy, sortDirection]
  );

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

  const startEdit = useCallback((tx) => {
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
  }, []);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (searchQuery.trim()) {
      const normalized = searchQuery.trim().toLowerCase();
      result = result.filter((tx) =>
        ['name', 'category', 'type', 'status', 'date'].some((key) =>
          String(tx[key]).toLowerCase().includes(normalized)
        )
      );
    }

    if (filters.category !== 'all') {
      result = result.filter((tx) => tx.category === filters.category);
    }

    if (filters.type !== 'all') {
      result = result.filter((tx) => tx.type === filters.type);
    }

    if (filters.status !== 'all') {
      result = result.filter((tx) => tx.status === filters.status);
    }

    if (filters.dateRange.start) {
      const startMs = dateToTimestampMs(filters.dateRange.start);
      result = result.filter((tx) => {
        const txMs = dateToTimestampMs(tx.date);
        return Number.isNaN(startMs) ? true : !Number.isNaN(txMs) && txMs >= startMs;
      });
    }

    if (filters.dateRange.end) {
      const endMs = dateToTimestampMs(filters.dateRange.end);
      result = result.filter((tx) => {
        const txMs = dateToTimestampMs(tx.date);
        return Number.isNaN(endMs) ? true : !Number.isNaN(txMs) && txMs <= endMs;
      });
    }

    if (filters.amountRange.min) {
      result = result.filter((tx) => tx.amount >= parseFloat(filters.amountRange.min));
    }

    if (filters.amountRange.max) {
      result = result.filter((tx) => tx.amount <= parseFloat(filters.amountRange.max));
    }

    return result;
  }, [searchQuery, transactions, filters]);

  const executeDelete = useCallback(
    async (id) => {
      try {
        dispatch(setLoading(true));
        await mockApiCall('deleteTransaction', id);
        dispatch(deleteTransaction(id));
      } catch (error) {
        dispatch(setError(error.message));
      } finally {
        dispatch(setLoading(false));
        setDeleteConfirm(null);
      }
    },
    [dispatch]
  );

  const requestDelete = useCallback((tx) => {
    setDeleteConfirm({ id: tx.id, name: tx.name || 'this transaction' });
  }, []);

  const columns = useMemo(
    () => {
      const cols = [
        columnHelper.accessor('name', {
          id: 'name',
          header: 'Name',
        }),
        columnHelper.accessor('date', {
          id: 'date',
          header: 'Date',
          cell: (info) => formatDateForDisplay(info.getValue()),
        }),
        columnHelper.accessor('amount', {
          id: 'amount',
          header: 'Amount',
          cell: (info) =>
            info.getValue().toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        }),
        columnHelper.accessor('category', {
          id: 'category',
          header: 'Category',
        }),
        columnHelper.accessor('type', {
          id: 'type',
          header: 'Type',
          cell: (info) => {
            const t = info.getValue();
            return (
              <span
                style={{
                  color: t === 'income' ? 'var(--green)' : 'var(--red)',
                  fontWeight: 500,
                }}
              >
                {t}
              </span>
            );
          },
        }),
        columnHelper.accessor('status', {
          id: 'status',
          header: 'Status',
          enableSorting: false,
        }),
      ];

      if (canMutate) {
        cols.push(
          columnHelper.display({
            id: 'actions',
            header: 'Action',
            enableSorting: false,
            cell: ({ row }) => (
              <div className="table-actions-cell">
                <button
                  type="button"
                  onClick={() => startEdit(row.original)}
                  className="btn btn-success table-action-btn"
                  aria-label="Edit transaction"
                >
                  <Pencil className="table-action-btn-icon" size={18} strokeWidth={2} aria-hidden />
                  <span className="table-action-btn-label">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => requestDelete(row.original)}
                  className="btn btn-danger table-action-btn"
                  aria-label="Delete transaction"
                >
                  <Trash2 className="table-action-btn-icon" size={18} strokeWidth={2} aria-hidden />
                  <span className="table-action-btn-label">Delete</span>
                </button>
              </div>
            ),
          })
        );
      }

      return cols;
    },
    [canMutate, startEdit, requestDelete]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      const first = next[0];
      if (first) {
        dispatch(setSort(first.id, first.desc ? 'desc' : 'asc'));
      }
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  });

  const totalFiltered = filtered.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const from = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalFiltered);

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

  const parseExcelRow = (row, index) => {
    const rawDate = row.Date ?? row.date ?? '';
    const normalizedDate = normalizeExcelDate(rawDate);
    const name = String(row.Name || row.name || '').trim();
    const amountRaw = row.Amount ?? row.amount;
    const amount = amountRaw === '' || amountRaw === undefined ? NaN : Number(amountRaw);
    const category = String(row.Category || row.category || '').trim();
    const type = String(row.Type || row.type || 'expense').trim().toLowerCase();
    const status = String(row.Status || row.status || 'Completed').trim();

    const rowHasAnyValue = Object.values(row).some(
      (v) => v !== '' && v !== undefined && v !== null
    );
    if (!rowHasAnyValue) {
      return { ok: false, reason: 'Empty row' };
    }

    const missing = [];
    if (!name) missing.push('name');
    if (!normalizedDate) missing.push('date');
    if (!Number.isFinite(amount)) missing.push('amount');
    if (!category) missing.push('category');

    if (missing.length > 0) {
      return { ok: false, reason: `Missing or invalid: ${missing.join(', ')}` };
    }

    return {
      ok: true,
      transaction: {
        id: Date.now() + index,
        name,
        date: normalizedDate,
        amount,
        category,
        type: type === 'income' ? 'income' : 'expense',
        status,
      },
    };
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';
    setIsImporting(true);
    setImportModal({ phase: 'progress', percent: 0, message: 'Reading file…' });

    const yieldToUi = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

    try {
      const data = await file.arrayBuffer();
      setImportModal({ phase: 'progress', percent: 12, message: 'Parsing workbook…' });
      await yieldToUi();

      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('The workbook has no sheets');
      }
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: true,
        cellDates: true,
      });

      const totalRows = jsonData.length;
      const failures = [];
      const validTransactions = [];

      if (totalRows === 0) {
        setIsImporting(false);
        setImportModal({
          phase: 'result',
          totalRows: 0,
          imported: 0,
          failed: 0,
          failures: [],
          sheetName,
        });
        return;
      }

      for (let i = 0; i < jsonData.length; i++) {
        const parsed = parseExcelRow(jsonData[i], i);
        if (parsed.ok) {
          validTransactions.push(parsed.transaction);
        } else {
          failures.push({ rowIndex: i + 1, reason: parsed.reason });
        }

        if (i % 8 === 0 || i === jsonData.length - 1) {
          const pct = 12 + Math.round(((i + 1) / totalRows) * 58);
          setImportModal({
            phase: 'progress',
            percent: pct,
            message: `Parsing rows… ${i + 1} / ${totalRows}`,
          });
          await yieldToUi();
        }
      }

      setImportModal({ phase: 'progress', percent: 72, message: 'Adding transactions to the table…' });
      await yieldToUi();

      for (let i = 0; i < validTransactions.length; i++) {
        dispatch(addTransaction(validTransactions[i]));
        if (i % 12 === 0 || i === validTransactions.length - 1) {
          const pct = 72 + Math.round(((i + 1) / Math.max(validTransactions.length, 1)) * 25);
          setImportModal({
            phase: 'progress',
            percent: Math.min(pct, 99),
            message: `Saving… ${i + 1} / ${validTransactions.length}`,
          });
          await yieldToUi();
        }
      }

      setImportModal({
        phase: 'result',
        totalRows,
        imported: validTransactions.length,
        failed: failures.length,
        failures,
        sheetName,
      });
    } catch (error) {
      setImportModal({
        phase: 'result',
        totalRows: 0,
        imported: 0,
        failed: 0,
        failures: [],
        error: error.message || 'Import failed',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const closeImportModal = () => setImportModal(null);

  const sectionTitle =
    viewMode === 'admin' ? 'Transaction management' : 'Transactions (read-only)';

  return (
    <section className="transactions-section">
      <h3>{sectionTitle}</h3>

      {viewMode === 'admin' && !canMutate && (
        <div className="rbac-banner" role="status">
          You are in <strong>Admin</strong> workspace with <strong>Viewer</strong> role. Switch role to Admin in the
          sidebar to add, edit, or import transactions.
        </div>
      )}

      <div className="controls">
        <input
          type="search"
          aria-label="Search transactions"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          placeholder="Search by name/date/category/type/status"
          className="search-input"
        />
       

        <div className="control-buttons">
          <div className="control-row control-row--filters">
            <button type="button" onClick={() => setShowAdvancedFilters(true)} className="btn btn-secondary">
              Filters
            </button>
          </div>

          <div className="control-row control-row--export">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting || filtered.length === 0}
              className="btn btn-success"
            >
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              disabled={isExporting || filtered.length === 0}
              className="btn btn-success"
            >
              {isExporting ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>

          {canMutate ? (
            <div className="control-row control-row--mutate">
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
              <button
                type="button"
                onClick={() => {
                  setIsAddMode(true);
                  setEditTarget(null);
                  setForm({ name: '', date: '', amount: '', category: '', type: 'expense', status: '' });
                }}
                className="btn btn-primary"
              >
                + Add Transaction
              </button>
            </div>
          ) : (
            <span className="viewer-mode-hint">Read-only: no edit actions</span>
          )}
        </div>
      </div>

      {(isAddMode || editTarget) && canMutate && (
        <div className="transaction-form">
          <h4>{isAddMode ? 'Add Transaction' : 'Edit Transaction'}</h4>
          <div className="form-grid">
            <input
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="Name"
            />
            <input type="date" value={form.date} onChange={(e) => handleFormChange('date', e.target.value)} />
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
            <button type="button" onClick={handleSave} className="btn btn-success">
              Save
            </button>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
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
              : canMutate
                ? 'Get started by adding your first transaction using the button above.'
                : 'No transactions have been added yet.'}
          </p>
          {canMutate && !searchQuery && (
            <button
              type="button"
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
        <>
          <div className="transaction-table-wrap">
            <table className="transaction-table" role="grid">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className={header.column.getCanSort() ? 'th-sortable' : undefined}
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            className="th-sort-btn"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc'
                              ? ' ▲'
                              : header.column.getIsSorted() === 'desc'
                                ? ' ▼'
                                : ''}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-pagination-bar">
            <div className="pagination-toolbar">
              <div className="pagination-toolbar__summary">
                <p className="pagination-entries" aria-live="polite">
                  Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{totalFiltered}</strong> entries
                </p>
                <div className="pagination-record-page" aria-label="Record summary">
                  <span className="pagination-total-records">
                    Total records: <strong>{totalFiltered}</strong>
                  </span>
                </div>
              </div>
              <div className="pagination-toolbar__actions">
                <label className="page-size-label">
                  <span className="page-size-label-text">Rows per page</span>
                  <select
                    className="page-size-select"
                    value={pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    aria-label="Rows per page"
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <div
                  className="pagination-nav pagination-nav--icons"
                  role="navigation"
                  aria-label="Table pages"
                >
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn pagination-btn--icon"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="First page"
                    title="First page"
                  >
                    <ChevronsLeft className="pagination-icon" size={18} strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn pagination-btn--icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Previous page"
                    title="Previous page"
                  >
                    <ChevronLeft className="pagination-icon" size={18} strokeWidth={2} aria-hidden />
                  </button>
                  <span
                    className="pagination-page-indicator"
                    aria-current="page"
                    aria-label={`Page ${pageIndex + 1} of ${Math.max(pageCount, 1)}`}
                  >
                    {pageIndex + 1} / {Math.max(pageCount, 1)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn pagination-btn--icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Next page"
                    title="Next page"
                  >
                    <ChevronRight className="pagination-icon" size={18} strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn pagination-btn--icon"
                    onClick={() => table.setPageIndex(Math.max(pageCount - 1, 0))}
                    disabled={!table.getCanNextPage()}
                    aria-label="Last page"
                    title="Last page"
                  >
                    <ChevronsRight className="pagination-icon" size={18} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <AdvancedFilters isOpen={showAdvancedFilters} onClose={() => setShowAdvancedFilters(false)} />

      {deleteConfirm && (
        <div
          className="modal-overlay animate-fade-in"
          role="presentation"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="modal-content confirm-dialog animate-scale-in"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="delete-confirm-title">Delete transaction?</h3>
              <button
                type="button"
                className="close-btn"
                aria-label="Close"
                onClick={() => setDeleteConfirm(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                This will remove <strong>{deleteConfirm.name}</strong> from your list. This cannot be undone from
                here.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={() => executeDelete(deleteConfirm.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {importModal?.phase === 'progress' && (
        <div className="modal-overlay import-progress-overlay animate-fade-in" role="presentation">
          <div
            className="modal-content import-progress-dialog"
            role="status"
            aria-live="polite"
            aria-busy="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-body import-progress-body">
              <p className="import-progress-title">Importing Excel…</p>
              <p className="import-progress-message">{importModal.message}</p>
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={importModal.percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-bar-fill" style={{ width: `${importModal.percent}%` }} />
              </div>
              <span className="progress-bar-percent">{importModal.percent}%</span>
            </div>
          </div>
        </div>
      )}

      {importModal?.phase === 'result' && (
        <div className="modal-overlay animate-fade-in" role="presentation" onClick={closeImportModal}>
          <div
            className="modal-content animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-result-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="import-result-title">Import results</h3>
              <button type="button" className="close-btn" aria-label="Close" onClick={closeImportModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {importModal.error ? (
                <p className="import-result-error" role="alert">
                  {importModal.error}
                </p>
              ) : importModal.totalRows === 0 ? (
                <p>No data rows were found in the first sheet of this workbook.</p>
              ) : (
                <>
                  <ul className="import-result-summary">
                    <li>
                      Total rows read from sheet: <strong>{importModal.totalRows}</strong>
                    </li>
                    <li>
                      Imported into the table: <strong>{importModal.imported}</strong>
                    </li>
                    <li>
                      Failed or skipped: <strong>{importModal.failed}</strong>
                    </li>
                    {importModal.sheetName ? (
                      <li>
                        Sheet used: <strong>{importModal.sheetName}</strong>
                      </li>
                    ) : null}
                  </ul>
                  {importModal.failures.length > 0 ? (
                    <div className="import-failures">
                      <h4 className="import-failures-heading">Rows that could not be imported</h4>
                      <ul className="import-failures-list">
                        {importModal.failures.map((f) => (
                          <li key={`fail-${f.rowIndex}`}>
                            <span className="import-failures-row">Row {f.rowIndex}</span>
                            <span className="import-failures-reason">{f.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={closeImportModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
