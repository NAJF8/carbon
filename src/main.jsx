import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import { I18nProvider } from './i18n/index.jsx';
import { ThemeProvider } from './store/theme.jsx';
import { DataProvider } from './store/data.jsx';
import { ShopProvider } from './store/shop.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <DataProvider>
          <ShopProvider>
            <App />
          </ShopProvider>
        </DataProvider>
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
);
