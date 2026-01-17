'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Overlay to lock the screen */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
      />
      {/* Cookie consent banner */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          padding: '20px',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        <p
          style={{
            flex: '1',
            minWidth: '250px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#333',
            margin: 0,
          }}
        >
          We use cookies and similar technologies to improve your experience, analyze site traffic, and support essential site functionality. By clicking "Accept", you consent to our use of cookies.
        </p>
        <button
          onClick={handleAccept}
          className="btn"
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            whiteSpace: 'nowrap',
          }}
        >
          Accept
        </button>
      </div>
    </>
  );
}
