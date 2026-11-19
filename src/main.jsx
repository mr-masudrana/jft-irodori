import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

// সার্ভিস ওয়ার্কার শুধু প্রোডাকশন বিল্ডে; dev-এ পুরনো SW ও ক্যাশ মুছে ফেলা হয় (নইলে পুরনো JS দেখায়)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  } else {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    window.caches?.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
  }
}
