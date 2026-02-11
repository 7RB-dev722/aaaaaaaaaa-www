import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPanel from '@/components/AdminPanel';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </SettingsProvider>
  );
}

export default App;
