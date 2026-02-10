import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppThemeProvider } from './contexts/ThemeContext';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <NotificationProvider>
          <CssBaseline />
          <App />
        </NotificationProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
