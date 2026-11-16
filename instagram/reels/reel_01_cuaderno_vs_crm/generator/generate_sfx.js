const fs = require('fs');
const path = require('path');

function writeWav(filename, samples, sampleRate = 44100) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    let val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(val), offset);
    offset += 2;
  }

  const outPath = path.join(__dirname, '../audio', filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated SFX: ${outPath}`);
  return outPath;
}

// Generate a very crisp, short classic "Cha-Ching" cash register sound (0.45s)
function generateCrispCashRegister() {
  const sr = 44100;
  const dur = 0.45;
  const total = Math.floor(sr * dur);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    
    // 1. Initial metallic drawer lever "clack" (0 to 0.04s)
    let click = 0;
    if (t < 0.04) {
      const clickEnv = Math.exp(-t * 120);
      click = (Math.random() * 2 - 1) * 0.4 * clickEnv + Math.sin(2 * Math.PI * 800 * t) * 0.3 * clickEnv;
    }

    // 2. Dual bell chime (starts at t=0.03s)
    let bell = 0;
    if (t >= 0.02) {
      const tb = t - 0.02;
      const f1 = 2093; // C7
      const f2 = 3136; // G7
      const f3 = 4186; // C8 harmonic shimmer
      const decay = Math.exp(-tb * 7.5); // fast, clean decay
      bell = (Math.sin(2 * Math.PI * f1 * tb) * 0.5 + Math.sin(2 * Math.PI * f2 * tb) * 0.35 + Math.sin(2 * Math.PI * f3 * tb) * 0.15) * decay;
    }

    samples[i] = (click * 0.6 + bell * 0.85);
  }

  writeWav('sfx_cash_short.wav', samples, sr);
}

generateCrispCashRegister();
