'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function AppNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/account');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Not logged in or error - nav may still show links
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!popupOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setPopupOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popupOpen]);

  const handleSignOut = async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    if (res.ok) router.push('/');
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <Link
        href="/ballot"
        style={{
          color: '#333',
          textDecoration: 'none',
          fontSize: '15px',
          fontWeight: 500,
        }}
      >
        My Ballot
      </Link>
      <Link
        href="/rankings"
        style={{
          color: '#333',
          textDecoration: 'none',
          fontSize: '15px',
          fontWeight: 500,
        }}
      >
        Rankings
      </Link>
      <Link
        href="/ballot-periods-2025"
        style={{
          color: '#333',
          textDecoration: 'none',
          fontSize: '15px',
          fontWeight: 500,
        }}
      >
        Ballot Periods
      </Link>
      <div style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setPopupOpen((o) => !o)}
          aria-label="Account menu"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        {popupOpen && (
          <div
            ref={popupRef}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              minWidth: '240px',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e0e0e0',
              padding: '16px',
              zIndex: 1000,
            }}
          >
            {user && (
              <>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#333' }}>{user.name || 'User'}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{user.email}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    href="/account"
                    onClick={() => setPopupOpen(false)}
                    style={{
                      color: '#0066cc',
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    Account
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: '#0066cc',
                      fontSize: '14px',
                      textAlign: 'left',
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
            {!user && (
              <div style={{ fontSize: '14px', color: '#666' }}>Loading...</div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
