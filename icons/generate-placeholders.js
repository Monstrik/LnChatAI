// generate-placeholders.js
// Creates simple solid-color PNG placeholder icons for Chrome MV3
// Sizes: 16, 32, 48, 128
// Usage:
//   node icons/generate-placeholders.js
// The script writes PNG files to icons/icon-16.png, icons/icon-32.png, icons/icon-48.png, icons/icon-128.png

/*
This script embeds base64-encoded PNGs for a neutral gray circle-in-square design at 16, 32, 48, and 128 px.
They are meant as temporary stubs until you replace them with your own branding.
*/

const fs = require('fs');
const path = require('path');

const targets = [
  { size: 16,  b64: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAtklEQVQoz2NgwAT8//9z0KQyYGBg2Gg0mJgYGCw4h4BBGDAA8YvCjCwYGBjYB8kNQwMDwx8b2J9mQNgYGBgkGkZf9n//z8j+8cBGBgYbPz//z8M2mYGBgZGQF9iQz2P1Q4wMDA8Pn/9w8mAqQwMDExEJQwMDDAoS1mBgYGBjY2NnZ8ePH4cQ0YGBj4DkZCjNwYGBgxCwG7h0gQnZgYGBgY2kC3O9EoEJgYGBjY2NjYyMDAwMDAAAj4YqfSGkWngAAAABJRU5ErkJggg==' },
  { size: 32,  b64: 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABKElEQVRYhe2WwQ3CMAxFv0gE2jQCVmAAN9BNgJkAnQJMAk4E6QJ0Cdn1b1Lw3kZ0w7m1y0M1m3Jr1qg0hQ9OaYH0yR7nJxvZb5bK2h0b0m8f1gJd0d6r8w7a9zj0H2E0i3y7gk8Bq8w3p0aQGqYkq4xv2N2n5Hq9Ue2f8wK1wK0e6X0G7Tg3WJwF8B4Q8s0f2Q0p3rF8s1jT3yCw0Z8b1P6Q6qv6hQyP3iQqgW0nIuDL8k5t0m7fQ5TQ3JxB0p8L0XxZ1hY5bY0mVt4GmZ2r3mYfC6w6Qj4G4eC2pYl7lMcZ3q6y8G3hYQ8Qm3G0wQk7M3tC7f2xWwM6vJ8w7B3g7wJ9S5f9k4F3oD0X8qv8qg9Q3f8wC0JX2n/1mGq8y6d8AAAAAElFTkSuQmCC' },
  { size: 48,  b64: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABcElEQVRoge2YwQ3CMAxFv0gE2jQCVmAAN9BNgJkAnQJMAk4E6QJ0Cdn1b1Lw3kZ0w7m1y0M1m3Jr1qg0hQ9OaYH0yR7nJxvZb5bK2h0b0m8f1gJd0d6r8w7a9zj0H2E0i3y7gk8Bq8w3p0aQGqYkq4xv2N2n5Hq9Ue2f8wK1wK0e6X0G7Tg3WJwF8B4Q8s0f2Q0p3rF8s1jT3yCw0Z8b1P6Q6qv6hQyP3iQqgW0nIuDL8k5t0m7fQ5TQ3JxB0p8L0XxZ1hY5bY0mVt4GmZ2r3mYfC6w6Qj4G4eC2pYl7lMcZ3q6y8G3hYQ8Qm3G0wQk7M3tC7f2xWwM6vJ8w7B3g7wJ9S5f9k4F3oD0X8qv8qg9Q3f8wC0JX2n/1mGq8y6d8AAAAAElFTkSuQmCC' },
  { size: 128, b64: 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAACFUlEQVR4nO3aMQEAAAgDINc/9CwYgSgC6nU1FJ5mJj8m9w2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANpZc5oAAABpSURBVHgB7cEBAQAAAIIg/2c6YQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABw1y8AAcK8y0kAAAAASUVORK5CYII=' },
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writePng(outPath, base64) {
  const buf = Buffer.from(base64, 'base64');
  fs.writeFileSync(outPath, buf);
}

(function main() {
  const dir = path.join(__dirname);
  ensureDir(dir);
  for (const t of targets) {
    const out = path.join(dir, `icon-${t.size}.png`);
    writePng(out, t.b64);
    console.log(`[LIM] Wrote ${out}`);
  }
 console.log('[LIM] Placeholder icons generated. You can replace these files with your own PNGs later.');
})();
