import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Built-in SQLite Setup (Node >= 22.5)
const db = new DatabaseSync('./database.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT,
    originalGroup TEXT,
    academicLevel TEXT,
    assignedRoomId TEXT
  );
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT,
    director TEXT,
    capacity INTEGER,
    academicLevel TEXT,
    assignedStudentIds TEXT
  );
`);

// API Routes
app.get('/api/state', (req, res) => {
  try {
    const rawStudents = db.prepare('SELECT * FROM students').all();
    const rawRooms = db.prepare('SELECT * FROM rooms').all();
    
    const students = rawStudents.map((s: any) => ({
      ...s,
      assignedRoomId: s.assignedRoomId || undefined
    }));
    
    const rooms = rawRooms.map((r: any) => ({
      ...r,
      assignedStudentIds: JSON.parse(r.assignedStudentIds || '[]')
    }));

    res.json({ students, rooms });
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

app.post('/api/state', (req, res) => {
  const { students, rooms } = req.body;
  
  if (!Array.isArray(students) || !Array.isArray(rooms)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    db.prepare('DELETE FROM students').run();
    db.prepare('DELETE FROM rooms').run();

    const insertStudent = db.prepare('INSERT INTO students (id, name, originalGroup, academicLevel, assignedRoomId) VALUES (?, ?, ?, ?, ?)');
    for (const s of students) {
      insertStudent.run(s.id, s.name, s.originalGroup, s.academicLevel, s.assignedRoomId || null);
    }

    const insertRoom = db.prepare('INSERT INTO rooms (id, name, director, capacity, academicLevel, assignedStudentIds) VALUES (?, ?, ?, ?, ?, ?)');
    for (const r of rooms) {
      insertRoom.run(r.id, r.name, r.director, r.capacity, r.academicLevel, JSON.stringify(r.assignedStudentIds));
    }

    db.exec('COMMIT');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving state:', error);
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// Vite Middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
