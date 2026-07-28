import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Keep the iPad from bouncing/zooming the whole page during a race.
document.addEventListener(
  'gesturestart',
  (e) => {
    e.preventDefault();
  },
  { passive: false },
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
