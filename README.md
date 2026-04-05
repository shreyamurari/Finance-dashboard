# Finance Panel — Personal Finance Dashboard

A single-page **React** web application for exploring income and expenses: summary metrics, charts, and a sortable **transactions** table with **Admin** (full edit) and **Viewer** (read-only) workspaces. Data is stored in the **browser** (no backend server).

This document is written for **reviewers, new developers, and end users** who open the project for the first time.

---

## Table of contents

1. [Overview](#overview)
2. [Tech stack](#tech-stack)
3. [Getting started (developers)](#getting-started-developers)
4. [How to use the panel (end users)](#how-to-use-the-panel-end-users)
5. [Roles: Admin vs Viewer](#roles-admin-vs-viewer)
6. [Data: seed transactions & persistence](#data-seed-transactions--persistence)
7. [Excel import format](#excel-import-format)
8. [Project structure](#project-structure)
9. [Testing & build](#testing--build)
10. [Limitations & notes](#limitations--notes)

---

## Overview

**Finance Panel** (branded in the UI as “Finanace Panel”) provides:

- **Dashboard** — balance, income, and expense cards; a balance trend visualization; spending breakdown; and short insight cards.
- **Admin** — transaction management: add, edit, delete, search, advanced filters, export **CSV** / **JSON**, import **Excel**, and paginated table navigation.
- **Viewer** — the same table in **read-only** mode (no add/edit/delete/import).

The **sidebar** lets you switch sections and choose a **Role** (Admin or Viewer). Which tabs appear depends on the role (see [Roles](#roles-admin-vs-viewer)).

**Light / dark** theme is available from the header toggle; the choice is remembered in the browser.

---

## Tech stack

| Layer | Technology | Purpose |
|--------|------------|---------|
| **UI library** | [React](https://react.dev/) 19 | Component-based interface |
| **State** | [Redux](https://redux.js.org/) 5 + [React-Redux](https://react-redux.js.org/) 9 | Global app state (transactions, role, theme, filters, loading/errors) |
| **Tables** | [TanStack Table](https://tanstack.com/table) v8 (`@tanstack/react-table`) | Sortable, paginated transaction grid |
| **Spreadsheets** | [SheetJS (`xlsx`)](https://sheetjs.com/) | Read `.xlsx` / `.xls` for import |
| **Icons** | [Lucide React](https://lucide.dev/) | Toolbar and UI icons |
| **Tooling** | [Create React App](https://create-react-app.dev/) (`react-scripts` 5) | Dev server, build, Jest test runner |
| **Language** | JavaScript (ES modules) | Application source |
| **Styling** | CSS (single large `Dashboard.css` + `index.css`) | Layout, responsive breakpoints, theme variables |
| **Fonts** | IBM Plex Sans (Google Fonts) | Typography |
| **Persistence** | Browser `localStorage` | Transactions, theme, role |

There is **no** Node/Express API, database, or authentication service in this repo. “API” delays in the app are **simulated** in `src/utils/dataUtils.js` (`mockApiCall`) for demonstration.

---

## Getting started (developers)

### Prerequisites

- **Node.js** (LTS recommended, e.g. 18.x or 20.x)
- **npm** (bundled with Node)

### Install

```bash
npm install
```

### Run locally

```bash
npm start
```

Opens the app at [http://localhost:3000](http://localhost:3000) with hot reload.

### Production build

```bash
npm run build
```

Outputs an optimized bundle under `build/`, suitable for static hosting.

---

## How to use the panel (end users)

### First visit

1. Open the app in the browser (after `npm start` or your deployed URL).
2. Use the **sidebar** on the left:
   - **Dashboard** — overview and charts.
   - **Admin** or **Viewer** — transactions (see [Roles](#roles-admin-vs-viewer)).
3. At the bottom of the sidebar, choose **Role**: **Viewer** or **Admin**.  
   - The visible tabs update automatically (Admin users do not see the Viewer tab; Viewer users do not see the Admin tab).
4. Use the **theme** control in the top header to switch light/dark mode.

### Dashboard tab

- Review **summary cards** (balance, income, expenses).
- Scroll through **charts** (sample trend data is partly static for the line trend; spending breakdown uses your transaction data).
- Read **insight** cards (highest category, month comparison, observation).

### Transactions (Admin or Viewer)

- **Search** — filter by text across name, date, category, type, and status.
- **Filters** — open advanced filters (category, type, status, date range, amount range).
- **Sort** — click column headers where sorting is enabled.
- **Pagination** — change **rows per page** and use the icon controls (first / previous / next / last). The bar shows how many entries you are viewing and total records.
- **Admin only**
  - **Add Transaction** — opens a form; fill all fields and save.
  - **Edit / Delete** — per row; delete asks for confirmation in a dialog (not the browser’s default alert).
  - **Import Excel** — pick a file; a progress state and **import summary** (rows read, imported, failures) are shown.
  - **Export CSV** / **Export JSON** — downloads the **currently filtered** list (respects search and filters).

If your **role** is Viewer but you somehow opened Admin-only flows, the UI explains that you need **Admin** role in the sidebar.

---

## Roles: Admin vs Viewer

| Role | Sidebar tabs | Transactions |
|------|----------------|--------------|
| **Admin** | Dashboard, **Admin** | Full management: add, edit, delete, import Excel, export CSV/JSON |
| **Viewer** | Dashboard, **Viewer** | Read-only table; exports still available where shown; no mutating actions |

The **role** is stored in `localStorage` and restored on the next visit. Switching role while on a hidden tab (e.g. from Admin to Viewer while on Admin) moves you back to **Dashboard** so you never stay on an invalid section.

---

## Data: seed transactions & persistence

### Hard-coded (seed) transactions

On **first load in a browser profile** where no saved transactions exist, the app loads **four sample transactions** from `src/redux/reducer.js` (`DEFAULT_TRANSACTIONS`):

| Name | Date | Amount | Category | Type | Status |
|------|------|--------|----------|------|--------|
| Starbucks | 2026-03-20 | $10.45 | Food | expense | Completed |
| Amazon | 2026-03-19 | $98.22 | Shopping | expense | Completed |
| Rent | 2026-03-01 | $1,200.00 | Housing | expense | Completed |
| Salary | 2026-02-28 | $5,000.00 | Income | income | Paid In |

These exist so the **dashboard and table are meaningful before any user input**. They are **not** fetched from a server.

### What gets saved in the browser

After the first save, Redux syncs to **`localStorage`** (see `src/redux/store.js`):

| Key | Content |
|-----|---------|
| `transactions` | Full array of transaction objects |
| `theme` | `"light"` or `"dark"` |
| `role` | `"viewer"` or `"admin"` |

- **Reload** — you see the same data you left (including deletions).
- **New browser / incognito / cleared site data** — no `transactions` key → seed list appears again (fresh demo state).

---

## Excel import format

The importer reads the **first sheet** of the workbook. Rows should include columns the app can map (case-insensitive headers supported):

- **Name** / `name`
- **Date** / `date`
- **Amount** / `amount`
- **Category** / `category`
- **Type** / `type` (optional; defaults toward expense/income handling in code)
- **Status** / `status` (optional; default e.g. Completed)

Invalid or empty rows are reported in the **import results** dialog with reasons; valid rows are appended via Redux.

---

## Project structure

```
src/
├── App.js                 # Redux Provider + DashboardPage
├── DashboardPage.js       # Shell: sidebar, routing by nav + role, main views
├── Dashboard.css          # Main layout and component styles
├── components/
│   ├── TransactionsTable.js   # Table, forms, import/export, modals, pagination
│   ├── AdvancedFilters.js     # Filter modal
│   ├── SummaryCards.js
│   ├── BalanceTrend.js
│   ├── SpendingBreakdown.js
│   └── ThemeToggle.js
├── redux/
│   ├── store.js           # createStore, localStorage hydrate + subscribe
│   ├── reducer.js         # DEFAULT_TRANSACTIONS + appReducer
│   └── actions.js
└── utils/
    ├── dataUtils.js       # localStorage, mock API, CSV/JSON export
    └── dateUtils.js       # Dates for filters and Excel normalization
```

---

## Testing & build

```bash
npm test
```

Runs Jest / React Testing Library in watch mode by default; use `CI=true npm test` for a single non-interactive run where appropriate.

---

## Limitations & notes

- **No real backend** — no login, multi-user sync, or server validation.
- **Mock delays** — some actions use `mockApiCall` with random rare “failure” to simulate latency/errors.
- **Demo trend data** — part of the dashboard chart uses static `trendData` in `DashboardPage.js` for illustration alongside real aggregates from transactions.
- **Single-user, one browser** — data is only as durable as that browser’s `localStorage`.

---

## Submission checklist (quick)

- [ ] `npm install` then `npm start` — confirm UI loads.
- [ ] Try **Dashboard**, then **Admin** / **Viewer** with role switching.
- [ ] Confirm seed data appears on a clean profile; edit data and refresh to confirm persistence.
- [ ] Optional: `npm run build` to verify production build succeeds.

---

*README generated to match the repository as of the Finance Panel coursework / submission. Update version numbers in [Tech stack](#tech-stack) if `package.json` changes.*
