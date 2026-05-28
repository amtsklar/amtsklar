import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LangProvider } from './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Inter,sans-serif', color:'#6b7280' }}>Laden…</div>}>
        <App />
      </Suspense>
    </LangProvider>
  </React.StrictMode>
);
