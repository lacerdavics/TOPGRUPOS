import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/sidebar-scroll.css'
import './styles/toast-mobile-fix.css'
import './styles/mobile-responsive.css'
import App from './App.tsx';
import './utils/mobilePerformanceConfig';

// Initialize app with static imports only
createRoot(document.getElementById("root")!).render(<App />);
