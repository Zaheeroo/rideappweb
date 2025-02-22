import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins to switch roles
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();
    
    // Only allow switching between admin and customer roles
    if (role !== 'admin' && role !== 'customer') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update the session with the new role
    session.user.role = role;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error switching role:', error);
    return NextResponse.json(
      { error: 'Failed to switch role' },
      { status: 500 }
    );
  }
} 