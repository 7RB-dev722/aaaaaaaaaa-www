import React, { useState, useEffect } from 'react';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { supabase } from '@/lib/supabase';
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

      // The AuthSessionMissingError can occur if the session is already invalidated
      // (e.g., in another tab or due to expiration). In this case, we can treat
      // it as a successful logout from the UI's perspective.
      if (error && error.name !== 'AuthSessionMissingError') {
        console.error('Error logging out:', error);
        alert(`Failed to log out: ${error.message}`);
      } else {
        // For a successful logout or a "session missing" error,
        // manually set the session to null to trigger a re-render to the login page.
        // This is more efficient than a full page reload.
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
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return <AdminLogin onLoginSuccess={() => {}} />;
};

export default AdminPanel;
