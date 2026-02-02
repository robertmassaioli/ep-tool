import { useEffect } from 'react';
import { view } from '@forge/bridge';

export function ThemeInitializer({ children }) {
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        console.log('ThemeInitializer: Enabling Forge theming...');
        await view.theme.enable();
        console.log('ThemeInitializer: Theming enabled successfully');
      } catch (error) {
        console.error('ThemeInitializer: Failed to enable theming:', error);
      }
    };

    initializeTheme();
  }, []);

  return children;
}