import { useState } from 'react';
import './App.css';

export default function App() {
  const [form, setForm] = useState({ name: '', sy: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/public/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Submission failed');
      }

      setStatus(`Application submitted successfully. Reference ID: ${payload.id}`);
      setForm({ name: '', sy: '' });
    } catch (error) {
      setStatus(error.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="card">
        <h1>MEFAMDEV Application</h1>
        <p>This React form is the first migrated step toward the Laravel version of the system.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Full Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Enter applicant name"
              required
            />
          </label>

          <label>
            School Year
            <input
              value={form.sy}
              onChange={(event) => setForm({ ...form, sy: event.target.value })}
              placeholder="e.g. 2025-2026"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>

        {status ? <div className="status">{status}</div> : null}
      </div>
    </div>
  );
}
