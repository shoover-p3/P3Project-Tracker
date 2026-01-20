import { NextResponse } from 'next/server';
import { getAllCards } from '@/lib/db';

export async function GET() {
  try {
    const cards = await getAllCards();
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching all cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}
