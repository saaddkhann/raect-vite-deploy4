import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigured } from '../services/firebase';
import { isAdmin } from '../services/admin';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function Admin() {
  const [state, setState] = useState({ loading: true, user: null, allowed: false });
  useEffect(() => {
    if (!firebaseConfigured || !auth) { setState({ loading: false, user: null, allowed: false }); return; }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setState({ loading: false, user: null, allowed: false });
      try { setState({ loading: false, user, allowed: await isAdmin(user.uid) }); }
      catch { setState({ loading: false, user, allowed: false }); }
    });
  }, []);
  if (!firebaseConfigured) return <main className="notice"><h2>Firebase setup required</h2><p>Create <code>.env</code> from <code>.env.example</code> and restart Vite.</p></main>;
  if (state.loading) return <main className="notice">Checking admin access…</main>;
  if (!state.user || !state.allowed) return <AdminLogin unauthorized={!!state.user} />;
  return <AdminDashboard />;
}
