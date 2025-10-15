import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'songs.json');

function readJson() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify({}), 'utf8');
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

function writeJson(obj) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(obj, null, 2), 'utf8');
}

const app = express();
app.use(cors());
app.use(express.json());

// Get all folders and songs
app.get('/api/folders', (req, res) => {
  return res.json(readJson());
});

// Create folder
app.post('/api/folders', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const data = readJson();
  if (!data[name]) data[name] = [];
  writeJson(data);
  res.json({ ok: true, folders: data });
});

// Delete folder
app.delete('/api/folders/:name', (req, res) => {
  const { name } = req.params;
  const data = readJson();
  delete data[name];
  writeJson(data);
  res.json({ ok: true, folders: data });
});

// Add song to folder
app.post('/api/folders/:name/songs', (req, res) => {
  const { name } = req.params;
  const song = req.body || {};
  const data = readJson();
  if (!data[name]) data[name] = [];
  data[name].push(song);
  writeJson(data);
  res.json({ ok: true, folders: data });
});

// Update song
app.put('/api/folders/:name/songs/:index', (req, res) => {
  const { name, index } = req.params;
  const i = Number(index);
  const song = req.body || {};
  const data = readJson();
  if (!Array.isArray(data[name]) || !(i in data[name])) return res.status(404).json({ error: 'not found' });
  data[name][i] = song;
  writeJson(data);
  res.json({ ok: true, folders: data });
});

// Delete song
app.delete('/api/folders/:name/songs/:index', (req, res) => {
  const { name, index } = req.params;
  const i = Number(index);
  const data = readJson();
  if (!Array.isArray(data[name]) || !(i in data[name])) return res.status(404).json({ error: 'not found' });
  data[name] = data[name].filter((_, idx) => idx !== i);
  writeJson(data);
  res.json({ ok: true, folders: data });
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));


