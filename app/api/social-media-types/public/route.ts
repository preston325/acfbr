import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      'SELECT id, social_media_type FROM social_media_types ORDER BY social_media_type'
    );

    const socialMediaTypes = result.rows.map((row: { id: number; social_media_type: string }) => ({
      id: Number(row.id),
      social_media_type: String(row.social_media_type ?? ''),
    }));

    const response = NextResponse.json({ socialMediaTypes });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error fetching social media types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
