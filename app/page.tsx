import Link from 'next/link';
import './globals.css';
import CookieConsent from './components/CookieConsent';

export default function LandingPage() {
  return (
    <>
      <div className="container" style={{ marginTop: '20px' }}>
      <header style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '8px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#0066cc' }}>
          America's College Football Rankings
        </h1>
        <p style={{ fontSize: '20px', color: '#666', maxWidth: '800px', margin: '0 auto 40px' }}>
          ACFBR is an independent ranking system where America's football fans and pundits cast votes each week 
          based on their opinions, observations, and experience. Completely independent of ESPN 
          and the college playoff committee.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signin" className="btn">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-secondary">
            Register
          </Link>
          <Link href="/signin" className="btn btn-secondary">
            View Rankings
          </Link>
        </div>
      </header>

      <section style={{ background: 'white', padding: '40px', borderRadius: '8px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
          <div>
            <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#0066cc' }}>1. Register</h3>
            <p>Create an account to become a voting member of our independent ranking system.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#0066cc' }}>2. Cast Your Ballot</h3>
            <p>Each week, rank your top 25 college football teams based on your expertise and observations.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#0066cc' }}>3. View Rankings</h3>
            <p>See the aggregated top 25 rankings based on votes from all registered ACFBR members.</p>
          </div>
        </div>
      </section>

      <section style={{ background: 'white', padding: '40px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>About</h2>
        <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#666' }}>
          This platform is designed for fans, podcasters, analysts, and football experts who want to 
          contribute to an independent ranking system. Your votes matter, and together we create 
          a more transparent and community-driven approach to college football rankings.
        </p>
      </section>
    </div>
    <CookieConsent />
    </>
  );
}
