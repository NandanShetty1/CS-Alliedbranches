import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(USERS_FILE);
  } catch (err) {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
  }
}

async function readUsers() {
  await ensureDataFile();
  const raw = await fs.readFile(USERS_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function findByUsername(username) {
  const users = await readUsers();
  return users.find(u => u.username.toLowerCase() === String(username).toLowerCase()) || null;
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function createUser({ username, password, displayName }) {
  if (!username || !password) {
    throw new Error('username and password are required');
  }
  const users = await readUsers();
  const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    throw new Error('Username already exists');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: randomUUID(),
    username,
    displayName: displayName || username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);
  return sanitizeUser(user);
}

export async function validateUser(username, password) {
  const user = await findByUsername(username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? sanitizeUser(user) : null;
}

