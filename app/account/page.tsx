'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppNav from '../components/AppNav';
import '../globals.css';

interface Team {
  id: number;
  str_team: string;
}

interface SocialMediaType {
  id: number;
  social_media_type: string;
}

interface SocialHandle {
  id: number;
  handle: string;
  social_media_type_id: number;
  social_media_type: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [emailFormData, setEmailFormData] = useState({
    email: '',
  });
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [accountFormData, setAccountFormData] = useState({
    favorite_team_id: '',
    podcast_y_n: '',
    podcast_url: '',
    sports_media_y_n: '',
    sports_media_url: '',
    sports_broadcast_y_n: '',
    sports_broadcast_url: '',
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>([]);
  const [socialMediaTypes, setSocialMediaTypes] = useState<SocialMediaType[]>([]);
  const [socialAddForm, setSocialAddForm] = useState({ social_media_type_id: '', handle: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, string | null>>({});
  const [removingHandleId, setRemovingHandleId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmailUpdate, setPendingEmailUpdate] = useState<string | null>(null);
  const [originalEmail, setOriginalEmail] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState({
    podcast_verified_y_n: '',
    sports_media_verified_y_n: '',
    sports_broadcast_verified_y_n: '',
  });

  useEffect(() => {
    fetchUserData();
    fetchTeams();
    fetchSocialHandles();
    fetchSocialMediaTypes();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams/public');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchSocialHandles = async () => {
    try {
      const response = await fetch('/api/account/social-handles');
      if (response.ok) {
        const data = await response.json();
        setSocialHandles(data.handles ?? []);
      }
    } catch (error) {
      console.error('Error fetching social handles:', error);
    }
  };

  const fetchSocialMediaTypes = async () => {
    try {
      const response = await fetch('/api/social-media-types/public', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok && Array.isArray(data.socialMediaTypes)) {
        setSocialMediaTypes(
          data.socialMediaTypes.map((t: { id: number; social_media_type?: string; socialMediaType?: string }) => ({
            id: Number(t.id),
            social_media_type: t.social_media_type ?? t.socialMediaType ?? '',
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching social media types:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/account');
      if (response.ok) {
        const data = await response.json();
        setEmailFormData({ email: data.user.email });
        setOriginalEmail(data.user.email);
        
        if (data.account) {
          setAccountFormData({
            favorite_team_id: data.account.favorite_team_id?.toString() || '',
            podcast_y_n: data.account.podcast_y_n || '',
            podcast_url: data.account.podcast_url || '',
            sports_media_y_n: data.account.sports_media_y_n || '',
            sports_media_url: data.account.sports_media_url || '',
            sports_broadcast_y_n: data.account.sports_broadcast_y_n || '',
            sports_broadcast_url: data.account.sports_broadcast_url || '',
          });
          setVerificationStatus({
            podcast_verified_y_n: data.account.podcast_verified_y_n || '',
            sports_media_verified_y_n: data.account.sports_media_verified_y_n || '',
            sports_broadcast_verified_y_n: data.account.sports_broadcast_verified_y_n || '',
          });
        }
      } else if (response.status === 401) {
        router.push('/signin');
      } else {
        setErrors({ submit: 'Failed to load account information' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while loading account information' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = () => {
    const newErrors: Record<string, string> = {};
    if (emailFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFormData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    if (passwordFormData.newPassword) {
      if (passwordFormData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }

    // Check if email is different from original
    if (emailFormData.email === originalEmail) {
      setErrors({ email: 'No changes to save' });
      return;
    }

    // Show confirmation dialog
    setPendingEmailUpdate(emailFormData.email);
    setShowEmailConfirmation(true);
  };

  const handleEmailUpdateConfirm = async () => {
    setShowEmailConfirmation(false);
    setIsSubmitting(prev => ({ ...prev, email: true }));
    setSuccess(prev => ({ ...prev, email: null }));
    setErrors({});

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pendingEmailUpdate }),
      });

      const data = await response.json();

      if (response.ok) {
        // User will be logged out, so redirect to signin with message
        router.push('/signin?email_updated=true');
      } else {
        setErrors({ email: data.error || 'Failed to update email' });
        setIsSubmitting(prev => ({ ...prev, email: false }));
      }
    } catch (error) {
      setErrors({ email: 'An error occurred. Please try again.' });
      setIsSubmitting(prev => ({ ...prev, email: false }));
    } finally {
      setPendingEmailUpdate(null);
    }
  };

  const handleEmailUpdateCancel = () => {
    setShowEmailConfirmation(false);
    setPendingEmailUpdate(null);
    // Reset email to original
    setEmailFormData({ email: originalEmail });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    if (!passwordFormData.newPassword) {
      setErrors({ password: 'No changes to save' });
      return;
    }

    setIsSubmitting(prev => ({ ...prev, password: true }));
    setSuccess(prev => ({ ...prev, password: null }));
    setErrors({});

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: passwordFormData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(prev => ({ ...prev, password: 'Password updated successfully!' }));
        setPasswordFormData({
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSuccess(prev => ({ ...prev, password: null })), 3000);
      } else {
        setErrors({ password: data.error || 'Failed to update password' });
      }
    } catch (error) {
      setErrors({ password: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(prev => ({ ...prev, password: false }));
    }
  };

  const handleAccountInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(prev => ({ ...prev, account: true }));
    setSuccess(prev => ({ ...prev, account: null }));
    setErrors({});

    try {
      const updateData: Record<string, unknown> = {};
      if (accountFormData.favorite_team_id !== undefined && accountFormData.favorite_team_id !== '') {
        updateData.favorite_team_id = parseInt(accountFormData.favorite_team_id) || null;
      } else if (accountFormData.favorite_team_id === '') {
        updateData.favorite_team_id = null;
      }
      if (accountFormData.podcast_y_n === 'Y' || accountFormData.podcast_y_n === 'N') {
        updateData.podcast_y_n = accountFormData.podcast_y_n;
        updateData.podcast_url = accountFormData.podcast_y_n === 'Y' ? (accountFormData.podcast_url || '') : '';
      }
      if (accountFormData.sports_media_y_n === 'Y' || accountFormData.sports_media_y_n === 'N') {
        updateData.sports_media_y_n = accountFormData.sports_media_y_n;
        updateData.sports_media_url = accountFormData.sports_media_y_n === 'Y' ? (accountFormData.sports_media_url || '') : '';
      }
      if (accountFormData.sports_broadcast_y_n === 'Y' || accountFormData.sports_broadcast_y_n === 'N') {
        updateData.sports_broadcast_y_n = accountFormData.sports_broadcast_y_n;
        updateData.sports_broadcast_url = accountFormData.sports_broadcast_y_n === 'Y' ? (accountFormData.sports_broadcast_url || '') : '';
      }

      if (Object.keys(updateData).length === 0) {
        setErrors({ account: 'No changes to save' });
        setIsSubmitting(prev => ({ ...prev, account: false }));
        return;
      }

      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(prev => ({ ...prev, account: 'Account info updated successfully!' }));
        setTimeout(() => setSuccess(prev => ({ ...prev, account: null })), 3000);
        fetchUserData();
      } else {
        setErrors({ account: data.error || 'Failed to update account info' });
      }
    } catch (error) {
      setErrors({ account: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(prev => ({ ...prev, account: false }));
    }
  };

  const handleSocialAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, social: undefined }));
    setSuccess(prev => ({ ...prev, social: null }));

    if (!socialAddForm.social_media_type_id || !socialAddForm.handle.trim()) {
      setErrors(prev => ({ ...prev, social: 'Select a type and enter a handle' }));
      return;
    }

    setIsSubmitting(prev => ({ ...prev, social: true }));
    try {
      const response = await fetch('/api/account/social-handles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          social_media_type_id: parseInt(socialAddForm.social_media_type_id, 10),
          handle: socialAddForm.handle.trim(),
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setSocialHandles(prev => [...prev, data.handle]);
        setSocialAddForm({ social_media_type_id: '', handle: '' });
        setSuccess(prev => ({ ...prev, social: 'Handle added.' }));
        setTimeout(() => setSuccess(prev => ({ ...prev, social: null })), 3000);
      } else {
        setErrors(prev => ({ ...prev, social: data.error || 'Failed to add handle' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, social: 'An error occurred. Please try again.' }));
    } finally {
      setIsSubmitting(prev => ({ ...prev, social: false }));
    }
  };

  const handleSocialRemove = async (id: number) => {
    setRemovingHandleId(id);
    setErrors(prev => ({ ...prev, social: undefined }));
    try {
      const response = await fetch(`/api/account/social-handles?id=${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (response.ok) {
        setSocialHandles(prev => prev.filter(h => h.id !== id));
        setSuccess(prev => ({ ...prev, social: 'Handle removed.' }));
        setTimeout(() => setSuccess(prev => ({ ...prev, social: null })), 3000);
      } else {
        setErrors(prev => ({ ...prev, social: data.error || 'Failed to remove handle' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, social: 'An error occurred. Please try again.' }));
    } finally {
      setRemovingHandleId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ maxWidth: '1200px', marginTop: '20px', textAlign: 'center' }}>
        <p>Loading account information...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', marginTop: '20px' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px' }}>Account Settings</h1>
        <AppNav />
      </header>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Section 1: Email */}
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Update Email</h2>
          
          {success.email && (
            <div className="success" style={{ padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', marginBottom: '15px', color: '#155724' }}>
              {success.email}
            </div>
          )}

          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={emailFormData.email}
                onChange={(e) => setEmailFormData({ email: e.target.value })}
                required
              />
              {errors.email && <div className="error">{errors.email}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className="btn" style={{ minWidth: '150px' }} disabled={isSubmitting.email}>
                {isSubmitting.email ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Password */}
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Update Password</h2>
          
          {success.password && (
            <div className="success" style={{ padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', marginBottom: '15px', color: '#155724' }}>
              {success.password}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword.newPassword ? "text" : "password"}
                  id="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, newPassword: !showPassword.newPassword })}
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
                  aria-label={showPassword.newPassword ? "Hide password" : "Show password"}
                >
                  {showPassword.newPassword ? (
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
              {errors.newPassword && <div className="error">{errors.newPassword}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword.confirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, confirmPassword: !showPassword.confirmPassword })}
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
                  aria-label={showPassword.confirmPassword ? "Hide password" : "Show password"}
                >
                  {showPassword.confirmPassword ? (
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
              {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}
            </div>

            {errors.password && <div className="error" style={{ marginBottom: '15px' }}>{errors.password}</div>}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className="btn" style={{ minWidth: '150px' }} disabled={isSubmitting.password}>
                {isSubmitting.password ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Account Info */}
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Account Info</h2>
          
          {success.account && (
            <div className="success" style={{ padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', marginBottom: '15px', color: '#155724' }}>
              {success.account}
            </div>
          )}

          <form onSubmit={handleAccountInfoSubmit}>
            <div className="form-group">
              <label>College Football Podcaster</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="podcast_y_n"
                      checked={accountFormData.podcast_y_n === 'Y'}
                      onChange={() => setAccountFormData({ ...accountFormData, podcast_y_n: 'Y' })}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="podcast_y_n"
                      checked={accountFormData.podcast_y_n === 'N' || !accountFormData.podcast_y_n}
                      onChange={() => setAccountFormData({ ...accountFormData, podcast_y_n: 'N' })}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>No</span>
                  </label>
                </div>
                {(accountFormData.podcast_y_n === 'Y') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      id="account_podcast_url"
                      value={accountFormData.podcast_url}
                      onChange={(e) => setAccountFormData({ ...accountFormData, podcast_url: e.target.value })}
                      placeholder="Enter podcast name or URL"
                      style={{ maxWidth: '400px' }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: verificationStatus.podcast_verified_y_n === 'Y' ? '#16a34a' : '#9ca3af', fontSize: '14px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      {verificationStatus.podcast_verified_y_n === 'Y' ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Sports Media (Newspaper, Magazine, Website)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sports_media_y_n"
                      checked={accountFormData.sports_media_y_n === 'Y'}
                      onChange={() => setAccountFormData({ ...accountFormData, sports_media_y_n: 'Y' })}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sports_media_y_n"
                      checked={accountFormData.sports_media_y_n === 'N' || !accountFormData.sports_media_y_n}
                      onChange={() => setAccountFormData({ ...accountFormData, sports_media_y_n: 'N' })}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>No</span>
                  </label>
                </div>
                {(accountFormData.sports_media_y_n === 'Y') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      id="sports_media_url"
                      value={accountFormData.sports_media_url}
                      onChange={(e) => setAccountFormData({ ...accountFormData, sports_media_url: e.target.value })}
                      placeholder="Enter sports media URL"
                      style={{ maxWidth: '400px' }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: verificationStatus.sports_media_verified_y_n === 'Y' ? '#16a34a' : '#9ca3af', fontSize: '14px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      {verificationStatus.sports_media_verified_y_n === 'Y' ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Sports Broadcaster (Radio, TV)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sports_broadcast_y_n"
                      checked={accountFormData.sports_broadcast_y_n === 'Y'}
                      onChange={() => setAccountFormData({ ...accountFormData, sports_broadcast_y_n: 'Y' })}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>Yes</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sports_broadcast_y_n"
                      checked={accountFormData.sports_broadcast_y_n === 'N' || !accountFormData.sports_broadcast_y_n}
                      onChange={() => setAccountFormData({ ...accountFormData, sports_broadcast_y_n: 'N' })}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span>No</span>
                  </label>
                </div>
                {(accountFormData.sports_broadcast_y_n === 'Y') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      id="sports_broadcast_url"
                      value={accountFormData.sports_broadcast_url}
                      onChange={(e) => setAccountFormData({ ...accountFormData, sports_broadcast_url: e.target.value })}
                      placeholder="Enter broadcast URL"
                      style={{ maxWidth: '400px' }}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: verificationStatus.sports_broadcast_verified_y_n === 'Y' ? '#16a34a' : '#9ca3af', fontSize: '14px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      {verificationStatus.sports_broadcast_verified_y_n === 'Y' ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="favorite_team_id">Favorite Team</label>
              <select
                id="favorite_team_id"
                value={accountFormData.favorite_team_id}
                onChange={(e) => setAccountFormData({ ...accountFormData, favorite_team_id: e.target.value })}
              >
                <option value="">Select favorite team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.str_team}
                  </option>
                ))}
              </select>
            </div>

            {errors.account && <div className="error" style={{ marginBottom: '15px' }}>{errors.account}</div>}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className="btn" style={{ minWidth: '150px' }} disabled={isSubmitting.account}>
                {isSubmitting.account ? 'Updating...' : 'Update Account Info'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 4: Social Media */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Social Media</h2>

          {success.social && (
            <div className="success" style={{ padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', marginBottom: '15px', color: '#155724' }}>
              {success.social}
            </div>
          )}
          {errors.social && <div className="error" style={{ marginBottom: '15px' }}>{errors.social}</div>}

          {socialHandles.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#374151' }}>Your handles</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {socialHandles.map((h) => (
                  <li
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <span style={{ fontWeight: 500, color: '#374151' }}>{h.social_media_type}</span>
                    <span style={{ color: '#6b7280' }}>{h.handle}</span>
                    <button
                      type="button"
                      onClick={() => handleSocialRemove(h.id)}
                      disabled={removingHandleId === h.id}
                      className="btn btn-secondary"
                      style={{ minWidth: '80px', padding: '6px 12px', fontSize: '14px' }}
                      aria-label={`Remove ${h.social_media_type} handle ${h.handle}`}
                    >
                      {removingHandleId === h.id ? 'Removing...' : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#374151' }}>
            {socialHandles.length > 0 ? 'Add another handle' : 'Add a handle'}
          </h3>
          <form onSubmit={handleSocialAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
              <label htmlFor="social_media_type_id">Platform</label>
              <select
                id="social_media_type_id"
                value={socialAddForm.social_media_type_id}
                onChange={(e) => setSocialAddForm({ ...socialAddForm, social_media_type_id: e.target.value })}
              >
                <option value="">Select platform</option>
                {socialMediaTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.social_media_type || `Platform ${t.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px', flex: 1 }}>
              <label htmlFor="social_handle">Handle</label>
              <input
                type="text"
                id="social_handle"
                value={socialAddForm.handle}
                onChange={(e) => setSocialAddForm({ ...socialAddForm, handle: e.target.value })}
                placeholder="e.g. @username or channel name"
              />
            </div>
            <button type="submit" className="btn" style={{ minWidth: '100px' }} disabled={isSubmitting.social}>
              {isSubmitting.social ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>
      </div>

      {/* Email Update Confirmation Dialog */}
      {showEmailConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', color: '#d9534f' }}>
              Warning
            </h3>
            <p style={{ marginBottom: '20px', color: '#333' }}>
              You will need to check your email to re-verify your email address and you will be logged out. Do you wish to proceed?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleEmailUpdateCancel}
                className="btn btn-secondary"
                style={{ minWidth: '80px' }}
              >
                No
              </button>
              <button
                onClick={handleEmailUpdateConfirm}
                className="btn"
                style={{ minWidth: '80px' }}
                disabled={isSubmitting.email}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
