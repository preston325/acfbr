'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppNav from '../components/AppNav';
import '../globals.css';

interface UserType {
  id: number;
  user_type: string;
}

interface Team {
  id: number;
  str_team: string;
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
    user_type_id: '',
    favorite_team_id: '',
  });
  const [podcastFormData, setPodcastFormData] = useState({
    podcast_y_n: '',
    podcast_name: '',
    podcast_url: '',
    podcast_followers: '',
    podcast_verified_y_n: '',
  });
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, string | null>>({});
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [showPodcastConfirmation, setShowPodcastConfirmation] = useState(false);
  const [pendingPodcastUpdate, setPendingPodcastUpdate] = useState<any>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingEmailUpdate, setPendingEmailUpdate] = useState<string | null>(null);
  const [originalEmail, setOriginalEmail] = useState<string>('');

  useEffect(() => {
    fetchUserData();
    fetchUserTypes();
    fetchTeams();
  }, []);

  const fetchUserTypes = async () => {
    try {
      const response = await fetch('/api/user-types/public');
      if (response.ok) {
        const data = await response.json();
        setUserTypes(data.userTypes);
      }
    } catch (error) {
      console.error('Error fetching user types:', error);
    }
  };

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

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/account');
      if (response.ok) {
        const data = await response.json();
        setEmailFormData({ email: data.user.email });
        setOriginalEmail(data.user.email);
        
        if (data.account) {
          setAccountFormData({
            user_type_id: data.account.user_type_id?.toString() || '',
            favorite_team_id: data.account.favorite_team_id?.toString() || '',
          });
          setPodcastFormData({
            podcast_y_n: data.account.podcast_y_n || '',
            podcast_name: data.account.podcast_name || '',
            podcast_url: data.account.podcast_url || '',
            podcast_followers: data.account.podcast_followers || '',
            podcast_verified_y_n: data.account.podcast_verified_y_n || '',
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
      const updateData: any = {};
      if (accountFormData.user_type_id) {
        updateData.user_type_id = parseInt(accountFormData.user_type_id);
      }
      if (accountFormData.favorite_team_id) {
        updateData.favorite_team_id = parseInt(accountFormData.favorite_team_id);
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
      } else {
        setErrors({ account: data.error || 'Failed to update account info' });
      }
    } catch (error) {
      setErrors({ account: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(prev => ({ ...prev, account: false }));
    }
  };

  const handlePodcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});

    // Build update data
    const updateData: any = {};
    if (podcastFormData.podcast_y_n) {
      updateData.podcast_y_n = podcastFormData.podcast_y_n;
    }
    if (podcastFormData.podcast_name) {
      updateData.podcast_name = podcastFormData.podcast_name;
    }
    if (podcastFormData.podcast_url) {
      updateData.podcast_url = podcastFormData.podcast_url;
    }
    if (podcastFormData.podcast_followers) {
      updateData.podcast_followers = podcastFormData.podcast_followers;
    }

    // Show confirmation dialog
    setPendingPodcastUpdate(updateData);
    setShowPodcastConfirmation(true);
  };

  const handlePodcastUpdateConfirm = async () => {
    setShowPodcastConfirmation(false);
    setIsSubmitting(prev => ({ ...prev, podcast: true }));
    setSuccess(prev => ({ ...prev, podcast: null }));
    setErrors({});

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingPodcastUpdate),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(prev => ({ ...prev, podcast: 'Podcast info updated successfully!' }));
        // Sync podcast_y_n with account form data
        if (podcastFormData.podcast_y_n) {
          setAccountFormData(prev => ({ ...prev, podcast_y_n: podcastFormData.podcast_y_n }));
        }
        // Refresh user data to get updated verified status
        await fetchUserData();
        setTimeout(() => setSuccess(prev => ({ ...prev, podcast: null })), 3000);
      } else {
        setErrors({ podcast: data.error || 'Failed to update podcast info' });
      }
    } catch (error) {
      setErrors({ podcast: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(prev => ({ ...prev, podcast: false }));
      setPendingPodcastUpdate(null);
    }
  };

  const handlePodcastUpdateCancel = () => {
    setShowPodcastConfirmation(false);
    setPendingPodcastUpdate(null);
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
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Quadrant 1: Update Email */}
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

        {/* Quadrant 2: Account Info */}
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
              <label htmlFor="user_type_id">User Type</label>
              <select
                id="user_type_id"
                value={accountFormData.user_type_id}
                onChange={(e) => setAccountFormData({ ...accountFormData, user_type_id: e.target.value })}
              >
                <option value="">Select user type</option>
                {userTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.user_type}
                  </option>
                ))}
              </select>
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

        {/* Quadrant 3: Update Password */}
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

        {/* Quadrant 4: Podcast Information */}
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Podcast Information</h2>
            {podcastFormData.podcast_y_n === 'Y' && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                color: podcastFormData.podcast_verified_y_n === 'Y' ? '#28a745' : '#666',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={podcastFormData.podcast_verified_y_n === 'Y' ? '#28a745' : '#666'}
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={podcastFormData.podcast_verified_y_n === 'Y' ? {} : { filter: 'grayscale(100%)' }}
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>{podcastFormData.podcast_verified_y_n === 'Y' ? 'Verified' : 'Unverified'}</span>
              </div>
            )}
          </div>
          
          {success.podcast && (
            <div className="success" style={{ padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', marginBottom: '15px', color: '#155724' }}>
              {success.podcast}
            </div>
          )}

          <form onSubmit={handlePodcastSubmit}>
            <div className="form-group">
              <label htmlFor="podcast_y_n_podcast">Are you a podcaster?</label>
              <select
                id="podcast_y_n_podcast"
                value={podcastFormData.podcast_y_n}
                onChange={(e) => {
                  setPodcastFormData({ ...podcastFormData, podcast_y_n: e.target.value });
                  setAccountFormData(prev => ({ ...prev, podcast_y_n: e.target.value }));
                }}
              >
                <option value="">Select</option>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>

            {podcastFormData.podcast_y_n === 'Y' && (
              <>
                <div className="form-group">
                  <label htmlFor="podcast_name">Podcast Name</label>
                  <input
                    type="text"
                    id="podcast_name"
                    value={podcastFormData.podcast_name}
                    onChange={(e) => setPodcastFormData({ ...podcastFormData, podcast_name: e.target.value })}
                    placeholder="Enter podcast name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="podcast_url">Podcast URL</label>
                  <input
                    type="text"
                    id="podcast_url"
                    value={podcastFormData.podcast_url}
                    onChange={(e) => setPodcastFormData({ ...podcastFormData, podcast_url: e.target.value })}
                    placeholder="Enter podcast URL"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="podcast_followers">Approximate Number of Followers</label>
                  <input
                    type="text"
                    id="podcast_followers"
                    value={podcastFormData.podcast_followers}
                    onChange={(e) => setPodcastFormData({ ...podcastFormData, podcast_followers: e.target.value })}
                    placeholder="Enter approximate number of followers"
                  />
                </div>
              </>
            )}

            {errors.podcast && <div className="error" style={{ marginBottom: '15px' }}>{errors.podcast}</div>}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                type="submit" 
                className="btn" 
                style={{ minWidth: '150px' }} 
                disabled={isSubmitting.podcast}
              >
                {isSubmitting.podcast ? 'Updating...' : 'Update Podcast Info'}
              </button>
            </div>
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

      {/* Podcast Update Confirmation Dialog */}
      {showPodcastConfirmation && (
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
              This action will require Podcast Re-verification, do you wish to proceed?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handlePodcastUpdateCancel}
                className="btn btn-secondary"
                style={{ minWidth: '80px' }}
              >
                No
              </button>
              <button
                onClick={handlePodcastUpdateConfirm}
                className="btn"
                style={{ minWidth: '80px' }}
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
