import { NextResponse } from 'next/server';
import { updateUserToAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await updateUserToAdmin(email);
    
    return NextResponse.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Error in promote endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 