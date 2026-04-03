import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setFilters } from '../redux/actions';

const AdvancedFilters = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);
  const transactions = useSelector((state) => state.transactions);

  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRangeChange = (rangeKey, field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [rangeKey]: { ...prev[rangeKey], [field]: value }
    }));
  };

  const applyFilters = () => {
    dispatch(setFilters(localFilters));
    onClose();
  };

  const resetFilters = () => {
    const resetState = {
      searchQuery: '',
      sortBy: 'date',
      sortDirection: 'desc',
      category: 'all',
      type: 'all',
      status: 'all',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' },
    };
    setLocalFilters(resetState);
    dispatch(setFilters(resetState));
    onClose();
  };

  if (!isOpen) return null;

  // Get unique values for filter options
  const categories = [...new Set(transactions.map(tx => tx.category))];
  const statuses = [...new Set(transactions.map(tx => tx.status))];

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Advanced Filters</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          <div className="filter-group">
            <label>Category</label>
            <select
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Type</label>
            <select
              value={localFilters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-range">
              <input
                type="date"
                value={localFilters.dateRange.start}
                onChange={(e) => handleRangeChange('dateRange', 'start', e.target.value)}
                placeholder="Start date"
              />
              <input
                type="date"
                value={localFilters.dateRange.end}
                onChange={(e) => handleRangeChange('dateRange', 'end', e.target.value)}
                placeholder="End date"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Amount Range</label>
            <div className="amount-range">
              <input
                type="number"
                value={localFilters.amountRange.min}
                onChange={(e) => handleRangeChange('amountRange', 'min', e.target.value)}
                placeholder="Min amount"
                step="0.01"
              />
              <input
                type="number"
                value={localFilters.amountRange.max}
                onChange={(e) => handleRangeChange('amountRange', 'max', e.target.value)}
                placeholder="Max amount"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={resetFilters} className="btn btn-secondary">Reset</button>
          <button onClick={applyFilters} className="btn btn-primary">Apply Filters</button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--card);
          border-radius: var(--radius);
          padding: 0;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: var(--shadow-hover);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
          font-size: var(--text-lg);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: var(--spacing-lg);
        }

        .filter-group {
          margin-bottom: var(--spacing-md);
        }

        .filter-group label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 600;
          color: var(--text);
        }

        .filter-group select,
        .filter-group input {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
        }

        .date-range,
        .amount-range {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }

        .modal-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--border);
          display: flex;
          gap: var(--spacing-sm);
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
};

export default AdvancedFilters;