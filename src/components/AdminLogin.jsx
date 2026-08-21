import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function AdminLogin({ unauthorized }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { await signInWithEmailAndPassword(auth, email.trim(), password); } catch (err) { setError(err.code === 'auth/invalid-credential' ? 'Invalid admin email or PIN.' : err.message); } finally { setBusy(false); } }
  return <main className="login"><form onSubmit={submit}><p className="eyebrow">ADMIN CONTROL ROOM</p><h1>Admin Login</h1>{unauthorized && <div className="error">This account is not authorized as an admin.</div>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Admin PIN / Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>{error && <div className="error">{error}</div>}<button className="btn" disabled={busy}>{busy?'Signing in…':'Sign in'}</button><a href="#register">← Back to registration</a></form></main>;
}
