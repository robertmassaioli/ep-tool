import { useEffect, useState } from 'react';
import { view } from '@forge/bridge';

export function ThemeInitializer({ children }) {
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        console.log('ThemeInitializer: Enabling Forge theming...');
        await view.theme.enable();
        console.log('ThemeInitializer: Theming enabled successfully');
        setThemeReady(true);
      } catch (error) {
        console.error('ThemeInitializer: Failed to enable theming:', error);
        setThemeReady(true); // Still render even if theme fails
      }
    };

    initializeTheme();
  }, []);

  // Wait for theme to be ready before rendering children
  if (!themeReady) {
    console.log('ThemeInitializer: Waiting for theme to be ready...');
    return null; // or a loading spinner
  }

  return children;
}
