import { NextRequest, NextResponse } from 'next/server';
import { getCardsByBoard, createCard, updateCard, deleteCard, updateCardBoard } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('board_id');

    if (!boardId) {
      return NextResponse.json(
        { error: 'board_id is required' },
        { status: 400 }
      );
    }

    const cards = await getCardsByBoard(Number(boardId));
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { board_id, title, description, assignee, priority, status } = await request.json();

    if (!board_id || !title || !priority) {
      return NextResponse.json(
        { error: 'board_id, title, and priority are required' },
        { status: 400 }
      );
    }

    const id = await createCard(
      Number(board_id),
      title,
      description || null,
      assignee || null,
      priority,
      status || 'not_started'
    );

    return NextResponse.json({ id, board_id, title, description, assignee, priority, status });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { title, description, assignee, priority, status, board_id } = await request.json();

    if (!title || !priority) {
      return NextResponse.json(
        { error: 'title and priority are required' },
        { status: 400 }
      );
    }

    await updateCard(
      Number(id),
      title,
      description || null,
      assignee || null,
      priority,
      status || 'not_started'
    );

    // If board_id is provided, update it separately
    if (board_id !== undefined) {
      await updateCardBoard(Number(id), Number(board_id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    await deleteCard(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}
