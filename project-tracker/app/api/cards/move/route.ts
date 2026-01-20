import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const { cardId, boardId, newPriority, newPosition } = await request.json();

    if (!cardId || !boardId || !newPriority || newPosition === undefined) {
      return NextResponse.json(
        { error: 'cardId, boardId, newPriority, and newPosition are required' },
        { status: 400 }
      );
    }

    // Get the card being moved
    const cardResult = await client.execute({
      sql: 'SELECT priority, position FROM cards WHERE id = ?',
      args: [cardId]
    });

    if (cardResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    const oldPriority = cardResult.rows[0].priority as string;
    const oldPosition = cardResult.rows[0].position as number;

    // If moving to a different priority column
    if (oldPriority !== newPriority) {
      // Decrement positions in old column
      await client.execute({
        sql: 'UPDATE cards SET position = position - 1 WHERE board_id = ? AND priority = ? AND position > ?',
        args: [boardId, oldPriority, oldPosition]
      });

      // Increment positions in new column to make space
      await client.execute({
        sql: 'UPDATE cards SET position = position + 1 WHERE board_id = ? AND priority = ? AND position >= ?',
        args: [boardId, newPriority, newPosition]
      });
    } else {
      // Moving within same column
      if (oldPosition < newPosition) {
        // Moving down - decrement positions in between
        await client.execute({
          sql: 'UPDATE cards SET position = position - 1 WHERE board_id = ? AND priority = ? AND position > ? AND position <= ?',
          args: [boardId, oldPriority, oldPosition, newPosition]
        });
      } else if (oldPosition > newPosition) {
        // Moving up - increment positions in between
        await client.execute({
          sql: 'UPDATE cards SET position = position + 1 WHERE board_id = ? AND priority = ? AND position >= ? AND position < ?',
          args: [boardId, oldPriority, newPosition, oldPosition]
        });
      }
    }

    // Update the moved card
    await client.execute({
      sql: 'UPDATE cards SET priority = ?, position = ? WHERE id = ?',
      args: [newPriority, newPosition, cardId]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json(
      { error: 'Failed to move card' },
      { status: 500 }
    );
  }
}
