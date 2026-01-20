import { NextResponse } from 'next/server';
import { markSetupComplete } from '@/lib/db';

export async function POST() {
  try {
    await markSetupComplete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking setup complete:', error);
    return NextResponse.json(
      { error: 'Failed to mark setup complete' },
      { status: 500 }
    );
  }
}
