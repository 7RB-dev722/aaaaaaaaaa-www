import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import ErrorBoundary from './ErrorBoundary';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

const AdminPanel: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();

      if (error && error.name !== 'AuthSessionMissingError') {
        console.error('Error logging out:', error);
        alert(`Failed to log out: ${error.message}`);
      } else {
        setSession(null);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (session) {
    return (
      <ErrorBoundary>
        <AdminDashboard onLogout={handleLogout} />
      </ErrorBoundary>
    );
  }

  return <AdminLogin onLoginSuccess={() => {}} />;
};

export default AdminPanel;
