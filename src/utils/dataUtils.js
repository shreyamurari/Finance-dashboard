// Data persistence utilities
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Mock API utilities
export const mockApiDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiCall = async (operation, data = null) => {
  await mockApiDelay();

  // Simulate random failures (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Network error: Failed to connect to server');
  }

  switch (operation) {
    case 'fetchTransactions':
      return loadFromLocalStorage('transactions', []);
    case 'saveTransaction':
      const transactions = loadFromLocalStorage('transactions', []);
      const newTransaction = { ...data, id: Date.now() };
      transactions.push(newTransaction);
      saveToLocalStorage('transactions', transactions);
      return newTransaction;
    case 'updateTransaction':
      const txs = loadFromLocalStorage('transactions', []);
      const updated = txs.map(tx => tx.id === data.id ? data : tx);
      saveToLocalStorage('transactions', updated);
      return data;
    case 'deleteTransaction':
      const allTxs = loadFromLocalStorage('transactions', []);
      const filtered = allTxs.filter(tx => tx.id !== data);
      saveToLocalStorage('transactions', filtered);
      return data;
    default:
      throw new Error('Unknown operation');
  }
};

// Export utilities
export const exportToCSV = (data, filename = 'transactions.csv') => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data, filename = 'transactions.json') => {
  if (!data || data.length === 0) return;

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Theme utilities
export const saveThemePreference = (theme) => {
  saveToLocalStorage('theme', theme);
};

export const loadThemePreference = () => {
  return loadFromLocalStorage('theme', 'light');
};

// Animation utilities
export const fadeIn = {
  animation: 'fadeIn 0.3s ease-in-out',
};

export const slideIn = {
  animation: 'slideIn 0.3s ease-out',
};

export const scaleIn = {
  animation: 'scaleIn 0.2s ease-out',
};

// Add CSS animations to document head
const addAnimations = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        transform: translateY(-10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }

    .animate-scale-in {
      animation: scaleIn 0.2s ease-out;
    }
  `;
  document.head.appendChild(style);
};

// Initialize animations
if (typeof document !== 'undefined') {
  addAnimations();
}