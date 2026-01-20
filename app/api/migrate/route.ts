import { NextResponse } from 'next/server';
import client from '@/lib/db';

export async function POST() {
  try {
    // Add status column if it doesn't exist
    try {
      await client.execute(`ALTER TABLE cards ADD COLUMN status TEXT DEFAULT 'not_started'`);
    } catch (error) {
      // Column already exists, that's fine
    }

    // Add updated_at column if it doesn't exist
    try {
      await client.execute(`ALTER TABLE cards ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
    } catch (error) {
      // Column already exists, that's fine
    }

    // Update any existing cards that have NULL status
    await client.execute(`UPDATE cards SET status = 'not_started' WHERE status IS NULL`);

    // Update any existing cards that have NULL updated_at
    await client.execute(`UPDATE cards SET updated_at = created_at WHERE updated_at IS NULL`);

    return NextResponse.json({
      success: true,
      message: 'Database migrated successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to migrate database' },
      { status: 500 }
    );
  }
}
