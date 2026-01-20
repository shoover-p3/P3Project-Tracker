import { NextRequest, NextResponse } from 'next/server';
import { searchCards } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json([]);
    }

    const results = await searchCards(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching cards:', error);
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}
