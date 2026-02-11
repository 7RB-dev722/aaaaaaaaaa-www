import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import { ProductsGrid } from './components/ProductsGrid';
import Footer from './components/Footer';
import { AnimatedBackground } from './components/AnimatedBackground';
import MagicCursor from './components/MagicCursor';
import WinningPhotosPage from './components/WinningPhotosPage';
import { SettingsProvider } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ImagePaymentPage from './components/ImagePaymentPage';
import LinkPaymentPage from './components/LinkPaymentPage';
import CompatibilityCheckPage from './components/CompatibilityCheckPage';
import PrePurchaseInfoPage from './components/PrePurchaseInfoPage';
import LanguageSelectionPage from './components/LanguageSelectionPage';
import LocalPaymentPage from './components/LocalPaymentPage';
import AdminPanel from './components/admin/AdminPanel';

// Wrapper for public pages that use the magic cursor
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="use-magic-cursor">
    <MagicCursor />
    {children}
  </div>
);

function HomePage() {
  return (
    <div className="min-h-screen bg-[#030014] relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        <Hero />
        <ProductsGrid />
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            {/* Public Routes - Wrapped with PublicLayout for Magic Cursor */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/winning-photos" element={<PublicLayout><WinningPhotosPage /></PublicLayout>} />
            <Route path="/select-language/:productId" element={<PublicLayout><LanguageSelectionPage /></PublicLayout>} />
            <Route path="/pay/:productId" element={<PublicLayout><ImagePaymentPage /></PublicLayout>} />
            <Route path="/link-pay/:productId" element={<PublicLayout><LinkPaymentPage /></PublicLayout>} />
            <Route path="/local-pay/:productId" element={<PublicLayout><LocalPaymentPage /></PublicLayout>} />
            <Route path="/check-compatibility/:productId" element={<PublicLayout><CompatibilityCheckPage /></PublicLayout>} />
            <Route path="/pre-purchase/:productId" element={<PublicLayout><PrePurchaseInfoPage /></PublicLayout>} />
            
            {/* Integrated Admin Panel Route - NO Magic Cursor, Default System Cursor */}
            <Route path="/admin/*" element={<AdminPanel />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </SettingsProvider>
  );
}

export default App;
