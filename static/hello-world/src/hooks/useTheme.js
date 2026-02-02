import { useState, useEffect } from 'react';
import { view } from '@forge/bridge';

export function useTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Function to detect theme from Jira context
    const detectTheme = async () => {
      try {
        const context = await view.getContext();

        // Check if Jira is in dark mode
        // This checks for common Jira dark theme indicators
        const isDark = context?.theme === 'dark' ||
                      context?.appearance === 'dark' ||
                      document.documentElement.getAttribute('data-color-mode') === 'dark' ||
                      document.body.classList.contains('aui-theme-dark');

        setTheme(isDark ? 'dark' : 'light');
      } catch (error) {
        console.warn('Could not detect Jira theme, falling back to system preference:', error);

        // Fallback to system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    };

    // Initial theme detection
    detectTheme();

    // Listen for system theme changes as backup
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Only use system preference if we couldn't detect Jira theme
      detectTheme();
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return theme;
}
