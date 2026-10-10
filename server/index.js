import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMission } from './missions.js';
import { missionCategories } from '../shared/missions.js';

const app = express();
const port = Number(process.env.PORT) || 3000;
const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builtFiles = path.join(projectDirectory, 'dist');
const allowedCategories = new Set(missionCategories.map(({ value }) => value));
const allowedDifficulties = new Set(['easy', 'steady', 'wander']);
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (_request, response) => response.json({ ok: true, aiMode: process.env.OLLAMA_MODEL ? 'ollama' : 'local-rules' }));
app.post('/api/mission', async (request, response) => {
  const category = allowedCategories.has(request.body?.category) ? request.body.category : 'any';
  const difficulty = allowedDifficulties.has(request.body?.difficulty) ? request.body.difficulty : 'steady';
  response.json(await createMission({ category, difficulty }));
});
app.use(express.static(builtFiles, { index: false, maxAge: '1h' }));
app.get('*', (_request, response, next) => response.sendFile(path.join(builtFiles, 'index.html'), (error) => error && next()));
app.listen(port, '0.0.0.0', () => console.log(`Touch Grass service listening on http://localhost:${port}`));