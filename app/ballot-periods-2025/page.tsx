'use client';

import { useState, useEffect } from 'react';
import AppNav from '../components/AppNav';
import '../globals.css';

interface BallotPeriod {
  period_name: string;
  period_beg_dt: string;
  period_end_dt: string;
  poll_open_dt: string;
  poll_close_dt: string;
}

export default function BallotPeriodsPage() {
  const [periods, setPeriods] = useState<BallotPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBallotPeriods();
  }, []);

  const fetchBallotPeriods = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      // Add cache-busting parameter to prevent browser caching
      const response = await fetch(`/api/ballot-periods?_=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPeriods(data.periods || []);
      } else {
        setError('Failed to load ballot periods');
      }
    } catch (err) {
      setError('An error occurred while loading ballot periods');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const isCurrentPeriod = (period: BallotPeriod) => {
    const now = new Date();
    const periodBeg = new Date(period.period_beg_dt);
    const pollClose = new Date(period.poll_close_dt);
    
    // Check if current time is between period_beg_dt and poll_close_dt
    return now >= periodBeg && now <= pollClose;
  };

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>Loading ballot periods...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '20px' }}>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <AppNav />
      </div>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Ballot Periods - 2025</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          Schedule for when ballots may be cast
        </p>
      </header>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#0066cc', color: 'white' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Period Name</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Period Begin Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Period End Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Poll Open Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Poll Close Date</th>
              </tr>
            </thead>
            <tbody>
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    No ballot periods found for 2025.
                  </td>
                </tr>
              ) : (
                periods.map((period, index) => {
                  const isCurrent = isCurrentPeriod(period);
                  return (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid #eee',
                        background: isCurrent 
                          ? '#fff3cd' 
                          : index % 2 === 0 ? '#fff' : '#f9f9f9',
                        fontWeight: isCurrent ? '600' : 'normal',
                      }}
                    >
                      <td style={{ padding: '20px', fontWeight: '600', fontSize: '16px' }}>
                        {period.period_name}
                      </td>
                      <td style={{ padding: '20px', color: '#333' }}>
                        {formatDateTime(period.period_beg_dt)}
                      </td>
                      <td style={{ padding: '20px', color: '#333' }}>
                        {formatDateTime(period.period_end_dt)}
                      </td>
                      <td style={{ padding: '20px', color: '#333' }}>
                        {formatDateTime(period.poll_open_dt)}
                      </td>
                      <td style={{ padding: '20px', color: '#333' }}>
                        {formatDateTime(period.poll_close_dt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
