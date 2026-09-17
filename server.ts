import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gesalones-super-secret-key-change-in-prod';

app.use(express.json({ limit: '10mb' }));

// Built-in SQLite Setup (Node >= 22.5)
const db = new DatabaseSync('./database.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    passwordHash TEXT,
    role TEXT
  );
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

// Seed default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const defaultHash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)').run(
    crypto.randomUUID(),
    'admin',
    defaultHash,
    'admin'
  );
  console.log('Created default admin user: admin / admin123');
}

// Authentication Middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ user: (req as any).user });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.id;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(newHash, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// --- USER MANAGEMENT ROUTES ---
app.get('/api/users', requireAuth, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', requireAuth, (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO users (id, username, passwordHash, role) VALUES (?, ?, ?, ?)').run(id, username, hash, role || 'user');
    res.json({ id, username, role: role || 'user' });
  } catch (err) {
    res.status(400).json({ error: 'Username may already exist' });
  }
});

app.delete('/api/users/:id', requireAuth, (req, res) => {
  const id = String(req.params.id);
  if (id === (req as any).user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// --- EXISTING APP ROUTES (Protected) ---
app.get('/api/state', requireAuth, (req, res) => {
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

app.post('/api/state', requireAuth, (req, res) => {
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
