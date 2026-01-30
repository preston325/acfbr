'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../globals.css';

type SocialMediaType = { id: number; social_media_type: string };

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    podcast_y_n: '' as '' | 'Y' | 'N',
    podcast_url: '',
    sports_media_y_n: '' as '' | 'Y' | 'N',
    sports_media_url: '',
    sports_broadcast_y_n: '' as '' | 'Y' | 'N',
    sports_broadcast_url: '',
    primary_social_handle: '',
    social_media_type_id: '' as '' | string,
  });
  const [socialMediaTypes, setSocialMediaTypes] = useState<SocialMediaType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    passwordConfirmation: false,
  });
  const [acknowledgeEmail, setAcknowledgeEmail] = useState(false);

  useEffect(() => {
    fetch('/api/social-media-types/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.socialMediaTypes) setSocialMediaTypes(data.socialMediaTypes);
      })
      .catch(() => {});
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    if (formData.podcast_y_n !== 'Y' && formData.podcast_y_n !== 'N') {
      newErrors.podcast_y_n = 'Please select Yes or No';
    }
    if (formData.podcast_y_n === 'Y' && !formData.podcast_url.trim()) {
      newErrors.podcast_url = 'Please enter podcast name or URL';
    }

    if (formData.sports_media_y_n !== 'Y' && formData.sports_media_y_n !== 'N') {
      newErrors.sports_media_y_n = 'Please select Yes or No';
    }
    if (formData.sports_media_y_n === 'Y' && !formData.sports_media_url.trim()) {
      newErrors.sports_media_url = 'Please enter sports media URL';
    }

    if (formData.sports_broadcast_y_n !== 'Y' && formData.sports_broadcast_y_n !== 'N') {
      newErrors.sports_broadcast_y_n = 'Please select Yes or No';
    }
    if (formData.sports_broadcast_y_n === 'Y' && !formData.sports_broadcast_url.trim()) {
      newErrors.sports_broadcast_url = 'Please enter broadcast URL';
    }

    const handleTrimmed = formData.primary_social_handle.trim();
    if (handleTrimmed && !formData.social_media_type_id) {
      newErrors.social_media_type_id = 'Please select a social media type when providing a handle';
    }

    if (!acknowledgeEmail) {
      newErrors.acknowledgeEmail = 'You must acknowledge the email policy to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          podcast_y_n: formData.podcast_y_n || 'N',
          podcast_url: formData.podcast_y_n === 'Y' ? formData.podcast_url : '',
          sports_media_y_n: formData.sports_media_y_n || 'N',
          sports_media_url: formData.sports_media_y_n === 'Y' ? formData.sports_media_url : '',
          sports_broadcast_y_n: formData.sports_broadcast_y_n || 'N',
          sports_broadcast_url: formData.sports_broadcast_y_n === 'Y' ? formData.sports_broadcast_url : '',
          primary_social_handle: formData.primary_social_handle.trim() || undefined,
          social_media_type_id: formData.primary_social_handle.trim() ? formData.social_media_type_id || undefined : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to signin with email verification notice
        router.push('/signin?verify=true');
      } else {
        setErrors({ submit: data.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '60px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center' }}>
          Create Account
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            {errors.name && <div className="error">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {errors.email && <div className="error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword.password ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
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
                aria-label={showPassword.password ? "Hide password" : "Show password"}
              >
                {showPassword.password ? (
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
            {errors.password && <div className="error">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirmation">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword.passwordConfirmation ? "text" : "password"}
                id="passwordConfirmation"
                value={formData.passwordConfirmation}
                onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, passwordConfirmation: !showPassword.passwordConfirmation })}
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
                aria-label={showPassword.passwordConfirmation ? "Hide password" : "Show password"}
              >
                {showPassword.passwordConfirmation ? (
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
            {errors.passwordConfirmation && <div className="error">{errors.passwordConfirmation}</div>}
          </div>

          <p style={{ marginBottom: '12px', fontWeight: 600, color: '#333' }}>Are you any of the following?</p>

          <div className="form-group">
            <label>College Football Podcaster</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="podcast_y_n"
                  checked={formData.podcast_y_n === 'Y'}
                  onChange={() => setFormData({ ...formData, podcast_y_n: 'Y' })}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>Yes</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="podcast_y_n"
                  checked={formData.podcast_y_n === 'N'}
                  onChange={() => setFormData({ ...formData, podcast_y_n: 'N' })}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>No</span>
              </label>
            </div>
            {formData.podcast_y_n === 'Y' && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  id="podcast_url"
                  value={formData.podcast_url}
                  onChange={(e) => setFormData({ ...formData, podcast_url: e.target.value })}
                  placeholder="Enter podcast name or URL"
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                />
                {errors.podcast_url && <div className="error">{errors.podcast_url}</div>}
              </div>
            )}
            {errors.podcast_y_n && <div className="error">{errors.podcast_y_n}</div>}
          </div>

          <div className="form-group">
            <label>Sports Media (Newspaper, Magazine, Website)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sports_media_y_n"
                  checked={formData.sports_media_y_n === 'Y'}
                  onChange={() => setFormData({ ...formData, sports_media_y_n: 'Y' })}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>Yes</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sports_media_y_n"
                  checked={formData.sports_media_y_n === 'N'}
                  onChange={() => setFormData({ ...formData, sports_media_y_n: 'N' })}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>No</span>
              </label>
            </div>
            {formData.sports_media_y_n === 'Y' && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  id="sports_media_url"
                  value={formData.sports_media_url}
                  onChange={(e) => setFormData({ ...formData, sports_media_url: e.target.value })}
                  placeholder="Enter sports media URL"
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                />
                {errors.sports_media_url && <div className="error">{errors.sports_media_url}</div>}
              </div>
            )}
            {errors.sports_media_y_n && <div className="error">{errors.sports_media_y_n}</div>}
          </div>

          <div className="form-group">
            <label>Sports Broadcaster (Radio, TV)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sports_broadcast_y_n"
                  checked={formData.sports_broadcast_y_n === 'Y'}
                  onChange={() => setFormData({ ...formData, sports_broadcast_y_n: 'Y' })}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>Yes</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="sports_broadcast_y_n"
                  checked={formData.sports_broadcast_y_n === 'N'}
                  onChange={() => setFormData({ ...formData, sports_broadcast_y_n: 'N' })}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span>No</span>
              </label>
            </div>
            {formData.sports_broadcast_y_n === 'Y' && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  id="sports_broadcast_url"
                  value={formData.sports_broadcast_url}
                  onChange={(e) => setFormData({ ...formData, sports_broadcast_url: e.target.value })}
                  placeholder="Enter broadcast URL"
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                />
                {errors.sports_broadcast_url && <div className="error">{errors.sports_broadcast_url}</div>}
              </div>
            )}
            {errors.sports_broadcast_y_n && <div className="error">{errors.sports_broadcast_y_n}</div>}
          </div>

          <div className="form-group">
            <input
              type="text"
              id="primary_social_handle"
              value={formData.primary_social_handle}
              onChange={(e) => setFormData({ ...formData, primary_social_handle: e.target.value })}
              placeholder="Primary Social Media Handle"
              aria-label="Primary Social Media Handle"
              style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
            />
            <select
              id="social_media_type"
              value={formData.social_media_type_id}
              onChange={(e) => setFormData({ ...formData, social_media_type_id: e.target.value as '' | string })}
              aria-label="Social media type"
              style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', marginTop: '8px', padding: '8px 12px' }}
            >
              <option value="">Select social media type</option>
              {socialMediaTypes.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.social_media_type}
                </option>
              ))}
            </select>
            {errors.social_media_type_id && <div className="error">{errors.social_media_type_id}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
              <input
                type="checkbox"
                id="acknowledgeEmail"
                checked={acknowledgeEmail}
                onChange={(e) => setAcknowledgeEmail(e.target.checked)}
                required
                style={{ cursor: 'pointer', flexShrink: 0, marginRight: '8px', marginTop: '2px', width: 'auto' }}
              />
              <label htmlFor="acknowledgeEmail" style={{ cursor: 'pointer', fontSize: '13px', lineHeight: '1.4', margin: 0, fontWeight: 'normal', flex: 1, textAlign: 'left' }}>
                I acknowledge that to participate in America's College Football Rankings ("ACFBR"), I will receive emails from ACFBR, including marketing emails.
              </label>
            </div>
            {errors.acknowledgeEmail && <div className="error">{errors.acknowledgeEmail}</div>}
          </div>

          {errors.submit && <div className="error" style={{ marginBottom: '20px' }}>{errors.submit}</div>}

          <button type="submit" className="btn" style={{ width: '100%' }} disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
