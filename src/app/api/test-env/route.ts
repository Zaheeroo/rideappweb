import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'exists' : 'missing',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'exists' : 'missing',
  });
} 