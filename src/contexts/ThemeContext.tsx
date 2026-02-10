import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const AppThemeProvider = ({ children }: PropsWithChildren) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: { main: '#1565C0' },
          secondary: { main: '#2E7D32' },
          error: { main: '#C62828' },
          warning: { main: '#F57C00' }
        },
        shape: {
          borderRadius: 16
        },
        breakpoints: {
          values: {
            xs: 0,
            sm: 601,
            md: 961,
            lg: 1200,
            xl: 1536
          }
        }
      }),
    [isDarkMode]
  );

  const value = useMemo(
    () => ({
      isDarkMode,
      toggleTheme: () => setIsDarkMode((prev) => !prev)
    }),
    [isDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within AppThemeProvider');
  }
  return context;
};
