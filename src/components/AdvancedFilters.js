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
    </div>
  );
};

export default AdvancedFilters;