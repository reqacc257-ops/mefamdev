import { useState } from 'react';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/auth/applicant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Login failed');
      }

      setStatus(`Welcome, ${payload.user?.name || 'applicant'}!`);
    } catch (error) {
      setStatus(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>Applicant Portal</h1>
        <p>Login with your portal username and password.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Username
            <input
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              placeholder="Enter portal username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Enter password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {status ? <div className="status">{status}</div> : null}
      </div>
    </div>
  );
}
