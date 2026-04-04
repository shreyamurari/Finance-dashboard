import React, { useId } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/actions';

const ThemeToggle = () => {
  const theme = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const appearanceLabelId = useId();

  const handleToggle = () => {
    dispatch(toggleTheme());
    // Update document theme attribute
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'dark' : 'light');
  };

  const nextMode = theme === 'light' ? 'dark' : 'light';

  return (
    <div className="theme-toggle-group" role="group" aria-label="Theme appearance">
      <span className="theme-toggle-group-label" id={appearanceLabelId}>
        Appearance
      </span>
      <button
        type="button"
        className="theme-toggle theme-toggle--header animate-scale-in"
        onClick={handleToggle}
        aria-label={`${theme} mode active. Switch to ${nextMode} mode.`}
        title={`Switch to ${nextMode} mode`}
      >
        <span className="theme-toggle-icon" aria-hidden="true">
          {theme === 'light' ? (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </span>
        <span className="theme-toggle-text">
          <span className="theme-toggle-current">{theme === 'light' ? 'Light mode' : 'Dark mode'}</span>
          <span className="theme-toggle-hint">Switch to {nextMode} mode</span>
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;