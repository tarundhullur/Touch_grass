const catalog = {
  noticing: [
    ['Find a tiny wild detail', 'Look for something smaller than your thumb. Observe its shape, color, and what is happening around it.'],
    ['Follow a patch of sunlight', 'Find one patch of sun and watch it land on three different surfaces. Notice how each changes the light.'],
    ['Spot a color that does not belong', 'Choose a color in your surroundings and find three natural things that carry a version of it.'],
  ],
  plants: [
    ['Meet three leaf shapes', 'Find three different leaf shapes without picking them. Compare their edges and the shade each one makes.'],
    ['Find a plant making a home', 'Look for a plant growing somewhere unexpected. Notice what the surface gives it to hold on to.'],
    ['Trace a branch with your eyes', 'Choose a tree and follow one branch from trunk to tip. Look for the smallest new growth.'],
  ],
  textures: [
    ['Build a texture map', 'Find one rough, one smooth, and one soft-looking surface. Notice what weather or time might have changed them.'],
    ['Find a natural pattern', 'Look for a repeating pattern in bark, stone, water, or leaves. Follow it until it changes.'],
    ['Notice an edge', 'Find where two natural surfaces meet. Watch the boundary closely for a small detail you missed at first.'],
  ],
  sounds: [
    ['Collect three outside sounds', 'Stand still and listen for a near sound, a far sound, and a sound that comes and goes.'],
    ['Find the quietest corner', 'Walk slowly until the soundscape changes. Pause there and name the smallest sound you can hear.'],
    ['Listen for a rhythm', 'Find a repeating sound outdoors. Notice its pace, then listen for something that interrupts it.'],
  ],
  movement: [
    ['Take the slower path', 'Walk at half your usual pace for five minutes. Notice how many details appear when you stop rushing.'],
    ['Find a place to stretch', 'Choose a safe, level patch and stretch gently. Look up between movements and notice the nearest tree or cloud.'],
    ['Walk to a green thing', 'Choose a patch of green in the distance and walk toward it without checking your phone. Notice what you pass.'],
  ],
};
const categoryLabels = { noticing: 'Noticing', plants: 'Plants', textures: 'Textures', sounds: 'Sounds', movement: 'Movement' };
const durations = { easy: 5, steady: 10, wander: 15 };

export function generateMission({ category = 'any', difficulty = 'steady' } = {}) {
  const categories = category === 'any' || !catalog[category] ? Object.keys(catalog) : [category];
  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
  const choices = catalog[selectedCategory];
  const [title, prompt] = choices[Math.floor(Math.random() * choices.length)];
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `mission-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title, prompt, category: selectedCategory, categoryLabel: categoryLabels[selectedCategory],
    difficulty: Object.hasOwn(durations, difficulty) ? difficulty : 'steady',
    minutes: durations[difficulty] ?? durations.steady,
  };
}

export const missionCategories = [
  { value: 'any', label: 'Surprise me' }, { value: 'noticing', label: 'Noticing' },
  { value: 'plants', label: 'Plants' }, { value: 'textures', label: 'Textures' },
  { value: 'sounds', label: 'Sounds' }, { value: 'movement', label: 'Movement' },
];