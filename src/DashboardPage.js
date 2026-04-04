import React, { useMemo, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './Dashboard.css';
import SummaryCards from './components/SummaryCards';
import BalanceTrend from './components/BalanceTrend';
import SpendingBreakdown from './components/SpendingBreakdown';
import TransactionsTable from './components/TransactionsTable';
import ThemeToggle from './components/ThemeToggle';
import { setRole, addTransaction, updateTransaction } from './redux/actions';
import { loadThemePreference } from './utils/dataUtils';
import { dateToTimestampMs, normalizeExcelDate } from './utils/dateUtils';

const trendData = [
  { month: 'Jan', value: 320 },
  { month: 'Feb', value: 360 },
  { month: 'Mar', value: 310 },
  { month: 'Apr', value: 385 },
  { month: 'May', value: 430 },
  { month: 'Jun', value: 395 },
  { month: 'Jul', value: 470 },
  { month: 'Aug', value: 450 },
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'admin', label: 'Admin' },
  { id: 'viewer', label: 'Viewer' },
];

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { transactions, role } = useSelector((state) => state);
  const [activeNav, setActiveNav] = useState('dashboard');

  useEffect(() => {
    const savedTheme = loadThemePreference();
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const insights = useMemo(() => {
    const expenses = transactions.filter((tx) => String(tx.type || '').toLowerCase() === 'expense');
    const byCategory = expenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {});

    const highestSpendingCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    const monthTotals = transactions.reduce((acc, tx) => {
      const isoDate = normalizeExcelDate(tx.date);
      if (!isoDate) return acc;
      const monthKey = isoDate.slice(0, 7);
      if (!acc[monthKey]) {
        acc[monthKey] = { income: 0, expenses: 0 };
      }
      const type = String(tx.type || '').trim().toLowerCase();
      if (type === 'income') {
        acc[monthKey].income += tx.amount;
      } else if (type === 'expense') {
        acc[monthKey].expenses += tx.amount;
      }
      return acc;
    }, {});

    const months = Object.keys(monthTotals).sort();
    const lastMonth = months[months.length - 2] || null;
    const currentMonth = months[months.length - 1] || null;

    const lastSummary = lastMonth ? monthTotals[lastMonth] : { income: 0, expenses: 0 };
    const currentSummary = currentMonth ? monthTotals[currentMonth] : { income: 0, expenses: 0 };

    const lastNet = lastSummary.income - lastSummary.expenses;
    const currentNet = currentSummary.income - currentSummary.expenses;

    const isComparisonAvailable = !!lastMonth;
    const diffPercent = isComparisonAvailable ? ((currentNet - lastNet) / (Math.abs(lastNet) || 1)) * 100 : 0;
    const monthComparison = isComparisonAvailable
      ? currentNet >= lastNet
        ? `Net up ${diffPercent.toFixed(1)}% vs ${lastMonth}`
        : `Net down ${Math.abs(diffPercent).toFixed(1)}% vs ${lastMonth}`
      : 'Not enough data for comparison';

    const totalIncome = transactions
      .filter((tx) => String(tx.type || '').toLowerCase() === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = transactions
      .filter((tx) => String(tx.type || '').toLowerCase() === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalBalance = totalIncome - totalExpenses;

    const expenseWithDate = expenses
      .map((tx) => ({ tx, ms: dateToTimestampMs(tx.date) }))
      .filter((item) => !Number.isNaN(item.ms));

    const anchorMs = expenseWithDate.length ? Math.max(...expenseWithDate.map((x) => x.ms)) : Number.NaN;
    const startMs = Number.isNaN(anchorMs) ? Number.NaN : anchorMs - 30 * 24 * 60 * 60 * 1000;

    const recentExpenses = Number.isNaN(startMs)
      ? []
      : expenseWithDate
          .filter((item) => item.ms >= startMs && item.ms <= anchorMs)
          .map((item) => item.tx);

    const recentTotal = recentExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const recentByCategory = recentExpenses.reduce((acc, tx) => {
      const key = String(tx.category || '').trim() || 'Uncategorized';
      acc[key] = (acc[key] || 0) + (Number(tx.amount) || 0);
      return acc;
    }, {});

    let spendingCategories = Object.entries(recentByCategory)
      .map(([category, amount]) => ({
        category,
        value: recentTotal > 0 ? (amount / recentTotal) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    if (spendingCategories.length > 7) {
      const top = spendingCategories.slice(0, 6);
      const otherValue = spendingCategories.slice(6).reduce((sum, x) => sum + x.value, 0);
      spendingCategories = [...top, { category: 'Other', value: otherValue }];
    }

    const summaryCards = [
      {
        label: 'Total Balance',
        value: totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        change:
          currentNet >= 0
            ? `+${((currentNet / (lastNet || 1)) * 100).toFixed(1)}%`
            : `${((currentNet / (lastNet || 1)) * 100).toFixed(1)}%`,
        type: 'balance',
        data: months.map((m) => monthTotals[m].income - monthTotals[m].expenses),
      },
      {
        label: 'Total Income',
        value: totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        change:
          currentSummary.income >= lastSummary.income
            ? `+${((Math.abs(currentSummary.income - lastSummary.income) / (lastSummary.income || 1)) * 100).toFixed(1)}%`
            : `-${((Math.abs(currentSummary.income - lastSummary.income) / (lastSummary.income || 1)) * 100).toFixed(1)}%`,
        type: 'income',
        data: months.map((m) => monthTotals[m].income),
      },
      {
        label: 'Total Expenses',
        value: totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        change:
          currentSummary.expenses <= lastSummary.expenses
            ? `-${((Math.abs(currentSummary.expenses - lastSummary.expenses) / (lastSummary.expenses || 1)) * 100).toFixed(1)}%`
            : `+${((Math.abs(currentSummary.expenses - lastSummary.expenses) / (lastSummary.expenses || 1)) * 100).toFixed(1)}%`,
        type: 'expense',
        data: months.map((m) => monthTotals[m].expenses),
      },
    ];

    const observation =
      expenses.length === 0
        ? 'No expense data yet'
        : `Focus on ${highestSpendingCategory ? highestSpendingCategory[0] : 'N/A'} spending to reduce costs`;

    return {
      totalIncome,
      totalExpenses,
      totalBalance,
      summaryCards,
      spendingCategories,
      highestSpendingCategory: highestSpendingCategory ? highestSpendingCategory[0] : 'N/A',
      highestSpendingAmount: highestSpendingCategory ? highestSpendingCategory[1] : 0,
      currentMonth,
      currentSummary,
      currentNet,
      lastMonth,
      lastSummary,
      lastNet,
      monthComparison,
      observation,
    };
  }, [transactions]);

  const mainTitle =
    activeNav === 'dashboard'
      ? 'Dashboard overview'
      : activeNav === 'admin'
        ? 'Admin workspace'
        : 'Viewer workspace';

  const mainSubtitle =
    activeNav === 'dashboard'
      ? 'Summary cards, trends, and financial insights.'
      : activeNav === 'admin'
        ? 'Manage transactions when your role is Admin.'
        : 'Read-only access to transaction data.';

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">Finanace Panel</span>
        </div>
        <div className="sidebar-divider" />
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item${activeNav === item.id ? ' is-active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <label className="sidebar-role-label" htmlFor="sidebar-role-select">
            Role
          </label>
          <select
            id="sidebar-role-select"
            className="sidebar-role-select"
            value={role}
            onChange={(e) => dispatch(setRole(e.target.value))}
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <p className="sidebar-role-hint">
            {role === 'admin' ? 'Full transaction management in Admin.' : 'Read-only in Viewer; Admin tab stays safe.'}
          </p>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-main-header">
          <div className="dashboard-main-header-inner">
            <div className="dashboard-main-titles">
              <h1 className="dashboard-main-title">{mainTitle}</h1>
              <p className="dashboard-main-subtitle">{mainSubtitle}</p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {activeNav === 'dashboard' && (
          <div className="dashboard-main-body animate-fade-in">
            <SummaryCards cards={insights.summaryCards} />
            <section className="chart-grid">
              <BalanceTrend trend={trendData} />
              <SpendingBreakdown categories={insights.spendingCategories} />
            </section>

            <section className="insights-section">
              <div className="card">
                <h4>Highest spending category</h4>
                <p>
                  {insights.highestSpendingCategory === 'N/A'
                    ? 'No data available'
                    : `${insights.highestSpendingCategory} (${insights.highestSpendingAmount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })})`}
                </p>
              </div>
              <div className="card">
                <h4>Monthly comparison</h4>
                {insights.currentMonth ? (
                  <>
                    <p>{`${insights.currentMonth}: Expense ${insights.currentSummary.expenses.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}, Net ${insights.currentNet.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}</p>
                    <p>{`${insights.lastMonth}: Expense ${insights.lastSummary.expenses.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}, Net ${insights.lastNet.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}</p>
                  </>
                ) : (
                  <p>No data available</p>
                )}
                <p>{insights.monthComparison}</p>
              </div>
              <div className="card">
                <h4>Observation</h4>
                <p>{insights.observation}</p>
              </div>
            </section>
          </div>
        )}

        {activeNav === 'admin' && (
          <div className="dashboard-main-body animate-fade-in">
            <TransactionsTable
              transactions={transactions}
              role={role}
              viewMode="admin"
              onAddTransaction={(tx) => dispatch(addTransaction(tx))}
              onUpdateTransaction={(updatedTx) => dispatch(updateTransaction(updatedTx))}
            />
          </div>
        )}

        {activeNav === 'viewer' && (
          <div className="dashboard-main-body animate-fade-in">
            <TransactionsTable
              transactions={transactions}
              role={role}
              viewMode="viewer"
              onAddTransaction={(tx) => dispatch(addTransaction(tx))}
              onUpdateTransaction={(updatedTx) => dispatch(updateTransaction(updatedTx))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
