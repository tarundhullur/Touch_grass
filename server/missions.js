import { generateMission } from '../shared/missions.js';

function validModelMission(content, options) {
  let parsed;
  try { parsed = JSON.parse(content); } catch { return null; }
  if (typeof parsed.title !== 'string' || typeof parsed.prompt !== 'string') return null;
  const title = parsed.title.trim();
  const prompt = parsed.prompt.trim();
  if (!title || !prompt || title.length > 90 || prompt.length > 500) return null;
  return { ...generateMission(options), title, prompt };
}

export async function createMission(options) {
  const model = process.env.OLLAMA_MODEL?.trim();
  if (!model) return { mission: generateMission(options), source: 'local-rules' };
  try {
    const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, stream: false, format: 'json', messages: [
        { role: 'system', content: 'Create one safe, short outdoor observation mission. Return JSON only with string fields title and prompt. Do not ask the user to touch, eat, pick, or approach wildlife or plants. The mission should take about 5 to 15 minutes.' },
        { role: 'user', content: `Category: ${options.category}. Difficulty: ${options.difficulty}. Generate one mission.` },
      ], options: { temperature: 0.8 } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const result = await response.json();
    const mission = validModelMission(result.message?.content ?? '', options);
    if (!mission) throw new Error('Ollama returned an invalid mission');
    return { mission, source: `ollama:${model}` };
  } catch { return { mission: generateMission(options), source: 'local-rules' }; }
}