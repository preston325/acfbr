'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '../globals.css';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Prioritize verification message over success message
    if (searchParams.get('verify') === 'true') {
      setVerificationMessage('Registration successful! Please check your email to verify your account before signing in.');
    } else if (searchParams.get('registered') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    if (searchParams.get('verified') === 'success') {
      setVerificationMessage('Email verified successfully! You can now sign in.');
      setTimeout(() => setVerificationMessage(null), 5000);
    }
    if (searchParams.get('verified') === 'already') {
      setVerificationMessage('Your email is already verified. You can sign in.');
      setTimeout(() => setVerificationMessage(null), 5000);
    }
    if (searchParams.get('error') === 'invalid_token') {
      setErrors({ submit: 'Invalid or expired verification link. Please request a new verification email.' });
    }
    if (searchParams.get('error') === 'verification_failed') {
      setErrors({ submit: 'Email verification failed. Please try again or contact support.' });
    }
    if (searchParams.get('email_updated') === 'true') {
      setVerificationMessage('Your email has been updated. Please check your email to verify your new address before signing in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email || !formData.password) {
      setErrors({ submit: 'Please fill in all fields' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/ballot');
      } else {
        // Check if email doesn't exist
        if (response.status === 404 && data.error === 'email_not_found') {
          setErrors({ submit: data.message || 'No registered user found with this email address.' });
        } else if (response.status === 403 && (data.error?.includes('verify your email') || data.error?.includes('verification'))) {
          // Check if it's an email verification error
          setErrors({ submit: data.error });
        } else {
          setErrors({ submit: data.error || 'Invalid email or password' });
        }
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!formData.email) {
      setResendStatus({ type: 'error', message: 'Please enter your email address first' });
      return;
    }

    setResendStatus(null);
    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendStatus({ type: 'success', message: data.message || 'Verification email sent! Please check your inbox.' });
        setTimeout(() => {
          setResendStatus(null);
        }, 5000);
      } else {
        setResendStatus({ type: 'error', message: data.error || 'Failed to send verification email. Please try again.' });
      }
    } catch (error) {
      setResendStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '60px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center' }}>
          Sign In
        </h1>

        {showSuccess && (
          <div className="success" style={{ marginBottom: '20px', textAlign: 'center', padding: '10px', background: '#d4edda', borderRadius: '4px', color: '#155724' }}>
            Registration successful! Please sign in.
          </div>
        )}

        {verificationMessage && (
          <div className="success" style={{ marginBottom: '20px', textAlign: 'center', padding: '10px', background: '#d4edda', borderRadius: '4px', color: '#155724' }}>
            {verificationMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {errors.submit && (
            <div className="error" style={{ marginBottom: '20px' }}>
              {errors.submit}
              {formData.email && !errors.submit.includes('No registered user') && (
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0066cc',
                      cursor: isResending ? 'not-allowed' : 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                      fontSize: '14px',
                      opacity: isResending ? 0.6 : 1,
                    }}
                  >
                    {isResending ? 'Sending...' : 'Resend verification email'}
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn" style={{ width: '100%' }} disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {resendStatus && (
          <div
            className={resendStatus.type === 'success' ? 'success' : 'error'}
            style={{
              marginTop: '20px',
              padding: '10px',
              borderRadius: '4px',
              background: resendStatus.type === 'success' ? '#d4edda' : '#f8d7da',
              color: resendStatus.type === 'success' ? '#155724' : '#721c24',
            }}
          >
            {resendStatus.message}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Don't have an account? <Link href="/register">Register</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ maxWidth: '500px', marginTop: '60px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center' }}>
            Sign In
          </h1>
          <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
