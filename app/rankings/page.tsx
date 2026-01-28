'use client';

import { useState, useEffect } from 'react';
import AppNav from '../components/AppNav';
import '../globals.css';

interface TeamRanking {
  team_id: number;
  team_name: string;
  logo_url?: string;
  average_rank: number;
  total_votes: number;
  rank: number;
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const response = await fetch('/api/rankings');
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || []);
      } else {
        setError('Failed to load rankings');
      }
    } catch (err) {
      setError('An error occurred while loading rankings');
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSrc = (logoUrl?: string) => {
    if (logoUrl) {
      // If it already starts with 'data:', use it directly
      if (logoUrl.startsWith('data:')) {
        return logoUrl;
      }
      // Otherwise, add the data URI prefix
      return `data:image/png;base64,${logoUrl}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>Loading rankings...</p>
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
    <div className="container" style={{ maxWidth: '800px', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <AppNav />
      </div>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Top 25 Rankings</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          America's College Football Rankings (ACFBR Poll)
        </p>
      </header>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#0066cc', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left', width: '80px' }}>Rank</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Team</th>
              </tr>
            </thead>
            <tbody>
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    No rankings available yet. Be the first to cast a ballot!
                  </td>
                </tr>
              ) : (
                rankings.map((team, index) => (
                  <tr
                    key={team.team_id}
                    style={{
                      borderBottom: '1px solid #eee',
                      background: index % 2 === 0 ? '#fff' : '#f9f9f9',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: '600', fontSize: '16px' }}>
                      {team.rank}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {team.logo_url && getImageSrc(team.logo_url) && (
                          <img
                            src={getImageSrc(team.logo_url) || ''}
                            alt={team.team_name}
                            style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                          />
                        )}
                        <div style={{ fontWeight: '600', fontSize: '16px', color: '#333' }}>
                          {team.team_name}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
