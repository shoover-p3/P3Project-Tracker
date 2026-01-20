import { createClient } from '@libsql/client';

// For local development, use a local SQLite file
// For production on Vercel, set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export interface Board {
  id: number;
  name: string;
  position: number;
  created_at: string;
}

export interface Card {
  id: number;
  board_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'done';
  position: number;
  created_at: string;
  updated_at?: string;
}

export interface TeamMember {
  id: number;
  name: string;
  created_at: string;
}

// Initialize database schema
export async function initializeDatabase() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assignee TEXT,
      priority TEXT NOT NULL,
      status TEXT DEFAULT 'not_started',
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )
  `);

  // Add status column if it doesn't exist (for existing databases)
  try {
    await client.execute(`ALTER TABLE cards ADD COLUMN status TEXT DEFAULT 'not_started'`);
  } catch (error) {
    // Column already exists, ignore
  }

  // Add updated_at column if it doesn't exist
  try {
    await client.execute(`ALTER TABLE cards ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (error) {
    // Column already exists, ignore
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

// Check if app has been set up
export async function isAppSetup(): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: 'SELECT value FROM app_settings WHERE key = ?',
      args: ['setup_completed']
    });
    return result.rows.length > 0 && result.rows[0].value === 'true';
  } catch (error) {
    // If table doesn't exist, app is not set up
    return false;
  }
}

// Mark app as set up
export async function markSetupComplete() {
  await client.execute({
    sql: 'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
    args: ['setup_completed', 'true']
  });
}

// Board operations
export async function getAllBoards(): Promise<Board[]> {
  const result = await client.execute('SELECT * FROM boards ORDER BY position');
  return result.rows as unknown as Board[];
}

export async function getBoard(id: number): Promise<Board | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM boards WHERE id = ?',
    args: [id]
  });
  return result.rows[0] as unknown as Board || null;
}

export async function createBoard(name: string): Promise<number> {
  const maxPos = await client.execute('SELECT MAX(position) as max_pos FROM boards');
  const position = (maxPos.rows[0]?.max_pos as number || -1) + 1;

  const result = await client.execute({
    sql: 'INSERT INTO boards (name, position) VALUES (?, ?)',
    args: [name, position]
  });
  return Number(result.lastInsertRowid);
}

export async function deleteBoard(id: number) {
  await client.execute({
    sql: 'DELETE FROM boards WHERE id = ?',
    args: [id]
  });
}

// Card operations
export async function getCardsByBoard(boardId: number): Promise<Card[]> {
  const result = await client.execute({
    sql: `SELECT * FROM cards WHERE board_id = ?
          ORDER BY
            CASE priority
              WHEN 'high' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'low' THEN 3
            END,
            CASE COALESCE(status, 'not_started')
              WHEN 'in_progress' THEN 1
              WHEN 'not_started' THEN 2
              WHEN 'done' THEN 3
            END,
            position`,
    args: [boardId]
  });
  return result.rows as unknown as Card[];
}

export async function createCard(
  boardId: number,
  title: string,
  description: string | null,
  assignee: string | null,
  priority: 'high' | 'medium' | 'low',
  status: 'not_started' | 'in_progress' | 'done' = 'not_started'
): Promise<number> {
  const maxPos = await client.execute({
    sql: 'SELECT MAX(position) as max_pos FROM cards WHERE board_id = ? AND priority = ?',
    args: [boardId, priority]
  });
  const position = (maxPos.rows[0]?.max_pos as number || -1) + 1;

  const result = await client.execute({
    sql: 'INSERT INTO cards (board_id, title, description, assignee, priority, status, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [boardId, title, description, assignee, priority, status, position]
  });
  return Number(result.lastInsertRowid);
}

export async function updateCard(
  id: number,
  title: string,
  description: string | null,
  assignee: string | null,
  priority: 'high' | 'medium' | 'low',
  status: 'not_started' | 'in_progress' | 'done'
) {
  // Try with updated_at first
  try {
    await client.execute({
      sql: 'UPDATE cards SET title = ?, description = ?, assignee = ?, priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [title, description, assignee, priority, status, id]
    });
  } catch (error) {
    // If updated_at column doesn't exist, update without it
    await client.execute({
      sql: 'UPDATE cards SET title = ?, description = ?, assignee = ?, priority = ?, status = ? WHERE id = ?',
      args: [title, description, assignee, priority, status, id]
    });
  }
}

export async function deleteCard(id: number) {
  await client.execute({
    sql: 'DELETE FROM cards WHERE id = ?',
    args: [id]
  });
}

export async function updateCardBoard(id: number, boardId: number) {
  await client.execute({
    sql: 'UPDATE cards SET board_id = ? WHERE id = ?',
    args: [boardId, id]
  });
}

export async function updateCardPosition(id: number, priority: string, position: number) {
  await client.execute({
    sql: 'UPDATE cards SET priority = ?, position = ? WHERE id = ?',
    args: [priority, position, id]
  });
}

export async function searchCards(query: string): Promise<(Card & { board_name: string })[]> {
  const result = await client.execute({
    sql: `
      SELECT cards.*, boards.name as board_name
      FROM cards
      JOIN boards ON cards.board_id = boards.id
      WHERE cards.title LIKE ? OR cards.description LIKE ? OR cards.assignee LIKE ?
      ORDER BY boards.name, cards.priority, cards.position
    `,
    args: [`%${query}%`, `%${query}%`, `%${query}%`]
  });
  return result.rows as unknown as (Card & { board_name: string })[];
}

export async function getCardsByUser(assignee: string): Promise<(Card & { board_name: string })[]> {
  const result = await client.execute({
    sql: `
      SELECT cards.*, boards.name as board_name
      FROM cards
      JOIN boards ON cards.board_id = boards.id
      WHERE cards.assignee = ?
      ORDER BY boards.name, cards.priority, cards.position
    `,
    args: [assignee]
  });
  return result.rows as unknown as (Card & { board_name: string })[];
}

export async function getAllCards(): Promise<(Card & { board_name: string })[]> {
  const result = await client.execute(`
    SELECT cards.*, boards.name as board_name
    FROM cards
    JOIN boards ON cards.board_id = boards.id
    ORDER BY boards.name, cards.priority, cards.position
  `);
  return result.rows as unknown as (Card & { board_name: string })[];
}

export async function getCompletedCardsByDateRange(startDate: string, endDate: string): Promise<(Card & { board_name: string })[]> {
  const result = await client.execute({
    sql: `
      SELECT cards.*, boards.name as board_name
      FROM cards
      JOIN boards ON cards.board_id = boards.id
      WHERE cards.status = 'done'
      AND cards.updated_at >= ?
      AND cards.updated_at <= ?
      ORDER BY cards.updated_at DESC
    `,
    args: [startDate, endDate]
  });
  return result.rows as unknown as (Card & { board_name: string })[];
}

// Team member operations
export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const result = await client.execute('SELECT * FROM team_members ORDER BY name');
  return result.rows as unknown as TeamMember[];
}

export async function createTeamMember(name: string): Promise<number> {
  const result = await client.execute({
    sql: 'INSERT INTO team_members (name) VALUES (?)',
    args: [name]
  });
  return Number(result.lastInsertRowid);
}

export async function deleteTeamMember(id: number) {
  await client.execute({
    sql: 'DELETE FROM team_members WHERE id = ?',
    args: [id]
  });
}

export default client;
