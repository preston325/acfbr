'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../globals.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(null);

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'A password reset link has been sent to your email.');
      } else {
        if (response.status === 404 && data.error === 'email_not_found') {
          setErrors({ submit: data.message || 'No account found with this email address.' });
        } else {
          setErrors({ submit: data.error || data.message || 'Something went wrong. Please try again.' });
        }
      }
    } catch {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '60px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center' }}>
          Forgot Password
        </h1>
        <p style={{ color: '#666', marginBottom: '24px', textAlign: 'center' }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {success && (
          <div className="success" style={{ marginBottom: '20px', padding: '12px', background: '#d4edda', borderRadius: '4px', color: '#155724' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!success}
            />
          </div>

          {errors.submit && (
            <div className="error" style={{ marginBottom: '20px', padding: '10px', background: '#f8d7da', borderRadius: '4px', color: '#721c24' }}>
              {errors.submit}
            </div>
          )}

          {errors.email && (
            <div className="error" style={{ marginBottom: '20px' }}>
              {errors.email}
            </div>
          )}

          <button type="submit" className="btn" style={{ width: '100%' }} disabled={isSubmitting || !!success}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          <Link href="/signin">Back to sign in</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
