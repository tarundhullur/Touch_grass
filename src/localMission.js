import { generateMission } from '../shared/missions.js';

export async function getMission(options) {
  if (!navigator.onLine) return { mission: generateMission(options), source: 'offline' };
  try {
    const response = await fetch('/api/mission', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options), signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Local mission service unavailable');
    const result = await response.json();
    return { mission: result.mission, source: result.source };
  } catch {
    return { mission: generateMission(options), source: 'offline' };
  }
}