'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '../globals.css';

interface TeamRanking {
  team_id: number;
  team_name: string;
  school_name: string;
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

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '60px' }}>
        <p>Loading rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '60px' }}>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1000px', marginTop: '60px' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Top 25 Rankings</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          Aggregated rankings based on votes from registered pundits
        </p>
        <div style={{ marginTop: '20px' }}>
          <Link href="/" className="btn btn-secondary" style={{ marginRight: '10px' }}>
            Home
          </Link>
          <Link href="/ballot" className="btn">
            Cast Your Ballot
          </Link>
        </div>
      </header>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0066cc', color: 'white' }}>
              <th style={{ padding: '15px', textAlign: 'left', width: '80px' }}>Rank</th>
              <th style={{ padding: '15px', textAlign: 'left' }}>Team</th>
              <th style={{ padding: '15px', textAlign: 'center', width: '150px' }}>Avg Rank</th>
              <th style={{ padding: '15px', textAlign: 'center', width: '150px' }}>Total Votes</th>
            </tr>
          </thead>
          <tbody>
            {rankings.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
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
                  <td style={{ padding: '20px', fontWeight: 'bold', fontSize: '20px' }}>
                    {team.rank}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {team.logo_url && (
                        <img
                          src={team.logo_url}
                          alt={team.team_name}
                          style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '18px' }}>{team.team_name}</div>
                        {team.school_name && team.school_name !== team.team_name && (
                          <div style={{ fontSize: '14px', color: '#666' }}>{team.school_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center', fontWeight: '500' }}>
                    {team.average_rank.toFixed(2)}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    {team.total_votes}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          Rankings are calculated by averaging the rank positions assigned by all registered voters.
        </p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
