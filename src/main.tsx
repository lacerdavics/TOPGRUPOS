import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './styles/sidebar-scroll.css'
import './styles/mobile-responsive.css'
import App from './App.tsx';
import './utils/mobilePerformanceConfig';

// Initialize app with static imports only
createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
