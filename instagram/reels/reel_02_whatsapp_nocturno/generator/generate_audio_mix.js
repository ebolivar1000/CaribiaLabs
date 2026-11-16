const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIO_DIR = path.resolve(__dirname, '../audio');

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

  const outPath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated: ${outPath} (${(samples.length / sampleRate).toFixed(2)}s)`);
  return outPath;
}

// 1. Generate SFX: Glitch Whoosh (0.5s)
function generateGlitch() {
  const sr = 44100;
  const dur = 0.55;
  const total = Math.floor(sr * dur);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    const progress = t / dur;
    const freq = 1200 * Math.exp(-progress * 2.5);
    const sweep = Math.sin(2 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * 0.4;
    const chop = Math.sin(2 * Math.PI * 40 * t) > 0 ? 1 : 0.2;
    const env = Math.sin(Math.PI * progress);
    samples[i] = (sweep * 0.6 + noise) * env * chop * 0.8;
  }
  return writeWav('sfx_glitch.wav', samples, sr);
}

// 2. Generate Crisp Cash Register (0.45s)
function generateCashChime() {
  const sr = 44100;
  const dur = 0.45;
  const total = Math.floor(sr * dur);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    let click = 0;
    if (t < 0.04) {
      const clickEnv = Math.exp(-t * 120);
      click = (Math.random() * 2 - 1) * 0.4 * clickEnv + Math.sin(2 * Math.PI * 800 * t) * 0.3 * clickEnv;
    }
    let bell = 0;
    if (t >= 0.02) {
      const tb = t - 0.02;
      const f1 = 2093; // C7
      const f2 = 3136; // G7
      const f3 = 4186; // C8
      const decay = Math.exp(-tb * 7.5);
      bell = (Math.sin(2 * Math.PI * f1 * tb) * 0.5 + Math.sin(2 * Math.PI * f2 * tb) * 0.35 + Math.sin(2 * Math.PI * f3 * tb) * 0.15) * decay;
    }
    samples[i] = (click * 0.6 + bell * 0.85);
  }
  return writeWav('sfx_cash_short.wav', samples, sr);
}

// 3. Upbeat Lo-Fi Tech Beat (24.5s)
function generateMusicBed() {
  const sr = 44100;
  const dur = 24.5;
  const total = Math.floor(sr * dur);
  const samples = new Float32Array(total);
  const bpm = 124;
  const beatDur = 60 / bpm; // ~0.484s

  const chordRoots = [146.83, 116.54, 98.00, 130.81]; // D3, Bb2, G2, C3

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    const beatIndex = Math.floor(t / beatDur);
    const beatPhase = (t % beatDur) / beatDur;

    const barIndex = Math.floor(beatIndex / 4) % chordRoots.length;
    const root = chordRoots[barIndex];

    const bass = (Math.sin(2 * Math.PI * root * t) * 0.7 + (Math.sin(2 * Math.PI * root * 2 * t) * 0.3)) * Math.exp(-beatPhase * 2.2);

    const chord = (
      Math.sin(2 * Math.PI * root * 2 * t) * 0.3 +
      Math.sin(2 * Math.PI * root * 2.4 * t) * 0.25 +
      Math.sin(2 * Math.PI * root * 3.0 * t) * 0.2
    ) * Math.exp(-beatPhase * 3.0);

    let kick = 0;
    if (beatIndex % 2 === 0) {
      const kickT = beatPhase * beatDur;
      if (kickT < 0.15) {
        const kickFreq = 120 * Math.exp(-kickT * 30);
        kick = Math.sin(2 * Math.PI * kickFreq * kickT) * Math.exp(-kickT * 18) * 0.7;
      }
    }

    let hihat = 0;
    if (beatPhase > 0.45 && beatPhase < 0.55) {
      hihat = (Math.random() * 2 - 1) * 0.15 * Math.exp(-(beatPhase - 0.45) * 40);
    }

    const mix = bass * 0.45 + chord * 0.35 + kick * 0.5 + hihat * 0.2;
    const fadeIn = Math.min(1, t / 0.5);
    const fadeOut = Math.min(1, (dur - t) / 0.8);
    samples[i] = mix * fadeIn * fadeOut * 0.4;
  }
  return writeWav('music_bed.wav', samples, sr);
}

// 4. Mix Master Audio
function assembleReel2Master() {
  generateGlitch();
  generateCashChime();
  generateMusicBed();

  const diegoVoice = path.join(AUDIO_DIR, 'video2.mp3');
  const glitch = path.join(AUDIO_DIR, 'sfx_glitch.wav');
  const cashShort = path.join(AUDIO_DIR, 'sfx_cash_short.wav');
  const music = path.join(AUDIO_DIR, 'music_bed.wav');
  const masterWav = path.join(AUDIO_DIR, 'master_audio.wav');

  // Timings:
  // video2.mp3 total: 23.56s
  // Line 1 ends at 8.36s -> Glitch SFX at 8.40s
  // Line 2 ends at 16.51s -> Cash SFX at 16.55s
  // Line 3 starts at 16.91s ("CaribIA Labs...")
  // BGM volume: 0.18

  console.log('Mixing Reel 2 audio layers...');
  const cmd = `ffmpeg -y ` +
    `-i "${diegoVoice}" -i "${glitch}" -i "${cashShort}" -i "${music}" ` +
    `-filter_complex "` +
    `[0:a]volume=1.05[voice];` +
    `[1:a]adelay=8400|8400,volume=0.85[s_glitch];` +
    `[2:a]adelay=16550|16550,volume=0.9[s_cash];` +
    `[3:a]volume=0.18[bgm];` +
    `[voice][s_glitch][s_cash][bgm]amix=inputs=4:duration=first:dropout_transition=2,volume=1.5[out]" ` +
    `-map "[out]" -ar 44100 -ac 2 "${masterWav}"`;

  execSync(cmd, { stdio: 'inherit' });
  console.log('Master audio generated successfully:', masterWav);
}

assembleReel2Master();
