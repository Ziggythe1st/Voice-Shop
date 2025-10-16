import Database from 'better-sqlite3';


const db = new Database(process.env.VOICE_DB_PATH ?? 'voice_shop.db');
db.pragma('journal_mode = WAL');
db.exec(`
Create TABLE IF NOT EXISTS conversations(
  id TEXT PRIMARY KEY,
  user_id TEXT, 
  created_at INTEGER
  );
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  role TEXT,
  text TEXT,
  ts INTEGER,
  meta TEXT
  );
  `)

export function ensureConversation(sessionId: string, userId?: string){
    db.prepare(
        `INSERT OR IGNORE conversations(id, user_id, created_at) VALUES(?, ?, ?)`
    ).run(sessionId, userId ?? null, Date.now());
}

export function addMessage(
    m: { sessionId: string; role: 'user' | 'assistant' | 'system'; text: string; ts: number; meta?: any }
){
    db.prepare(
        `INSERT INTO messages(id, session_id, role, text, ts, meta) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(crypto.randomUUID(), m.sessionId, m.role, m.text, m.ts, m.meta ? JSON.stringify(m.meta) : null)
}

export function getMessages(session_id: string){
    return db.prepare(
        `SELECT role, text, ts FROM messages WHERE session_id = ? ORDER BY ts ASC`
    ).all(session_id);
}