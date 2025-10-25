import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_PATH = path.join(__dirname, '../public/audio/experience.wav');
const OUTPUT_PATH = path.join(__dirname, '../public/audio/experience-data.json');
const BAR_COUNT = 30;
const FPS = 60;

function generatePlaceholderData() {
  const duration = 45;
  const totalFrames = Math.floor(duration * FPS);
  const frames = [];

  for (let i = 0; i < totalFrames; i++) {
    const time = i / FPS;
    const barValues = [];

    for (let bar = 0; bar < BAR_COUNT; bar++) {
      const frequency = 0.5 + (bar / BAR_COUNT) * 2;
      const phase = (bar / BAR_COUNT) * Math.PI * 2;
      const wave1 = Math.sin(time * frequency * 2 + phase);
      const wave2 = Math.sin(time * frequency * 0.5 + phase * 1.3);
      const wave3 = Math.sin(time * frequency * 3 + phase * 0.7);

      const combined = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
      const normalized = (combined + 1) / 2;
      const scaled = 0.3 + (normalized * 0.7);
      const smoothed = Math.pow(scaled, 0.8);

      barValues.push(Math.round(smoothed * 1000) / 1000);
    }

    frames.push(barValues);
  }

  return {
    version: '1.0',
    duration,
    fps: FPS,
    barCount: BAR_COUNT,
    frames,
  };
}

async function analyzeAudio() {
  console.log('🎵 Analyzing audio file...');

  try {
    const stats = fs.statSync(AUDIO_PATH);

    if (stats.size < 1000) {
      console.log('⚠️  Audio file appears to be a placeholder. Generating sample visualization data...');
      const data = generatePlaceholderData();

      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
      console.log(`✅ Generated ${data.frames.length} frames of sample data`);
      console.log(`📊 Duration: ${data.duration}s at ${data.fps} FPS`);
      console.log(`💾 Saved to: ${OUTPUT_PATH}`);

      return;
    }

    console.log('📝 Real audio file detected. For actual audio analysis:');
    console.log('   1. Install: npm install --save-dev node-wav');
    console.log('   2. Update this script to process real WAV data');
    console.log('   3. Extract FFT frequency data for each time segment');
    console.log('   4. Map frequencies to 30 bars with proper scaling');
    console.log('\n   For now, generating placeholder data...');

    const data = generatePlaceholderData();
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Generated ${data.frames.length} frames of sample data`);

  } catch (error) {
    console.error('❌ Error analyzing audio:', error.message);
    process.exit(1);
  }
}

analyzeAudio();
