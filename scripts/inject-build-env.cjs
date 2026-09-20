const fs = require('fs');
const path = require('path');

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.LITELLM_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  '';

const targetPath = path.join(__dirname, '..', 'worker-env.json');

if (apiKey) {
  fs.writeFileSync(targetPath, JSON.stringify({ GEMINI_API_KEY: apiKey.trim() }));
  console.log('✅ Injected GEMINI_API_KEY from build environment into worker-env.json');
} else {
  console.log('ℹ️ No GEMINI_API_KEY in build environment, keeping worker-env.json default');
}
