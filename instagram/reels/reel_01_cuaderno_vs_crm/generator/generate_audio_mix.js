const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIO_DIR = path.resolve(__dirname, '../audio');

// Helper to write a 16-bit Mono WAV file at 44100Hz
function writeWav(filename, samples, sampleRate = 44100) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data sub-chunk
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

// 1. Generate SFX: Glitch Whoosh (0.6s)
function generateGlitch() {
  const sr = 44100;
  const dur = 0.6;
  const total = Math.floor(sr * dur);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    const progress = t / dur;
    // Frequency sweep down from 1200Hz to 150Hz
    const freq = 1200 * Math.exp(-progress * 2.5);
    const sweep = Math.sin(2 * Math.PI * freq * t);
    // Noise burst
    const noise = (Math.random() * 2 - 1) * 0.4;
    // Glitch amplitude chop
    const chop = Math.sin(2 * Math.PI * 40 * t) > 0 ? 1 : 0.2;
    // Envelope: quick attack, smooth decay
    const env = Math.sin(Math.PI * progress);
    samples[i] = (sweep * 0.6 + noise) * env * chop * 0.8;
  }
  return writeWav('sfx_glitch.wav', samples, sr);
}

// 2. Generate SFX: Cash Register / Bell Chime (0.8s)
function generateCashChime() {
  const sr = 44100;
  const dur = 0.8;
  const total = Math.floor(sr * dur);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    // Bell frequencies
    const f1 = 1760; // A6
    const f2 = 2637; // E7
    const tone = Math.sin(2 * Math.PI * f1 * t) * 0.6 + Math.sin(2 * Math.PI * f2 * t) * 0.4;
    const decay = Math.exp(-t * 5); // Exponential decay
    samples[i] = tone * decay * 0.7;
  }
  return writeWav('sfx_cash.wav', samples, sr);
}

// 3. Generate Upbeat Modern Tech / Lo-Fi Electronic Beat (14.0s)
function generateMusicBed() {
  const sr = 44100;
  const dur = 14.0;
  const total = Math.floor(sr * dur);
  const samples = new Float32Array(total);
  const bpm = 124;
  const beatDur = 60 / bpm; // ~0.484s

  // Chords: Dm7 -> Bbmaj7 -> Gm7 -> C
  const chordRoots = [146.83, 116.54, 98.00, 130.81]; // D3, Bb2, G2, C3

  for (let i = 0; i < total; i++) {
    const t = i / sr;
    const beatIndex = Math.floor(t / beatDur);
    const beatPhase = (t % beatDur) / beatDur;

    // Chord index (changes every 4 beats)
    const barIndex = Math.floor(beatIndex / 4) % chordRoots.length;
    const root = chordRoots[barIndex];

    // Synth Bass (subtle sine + square blend)
    const bass = (Math.sin(2 * Math.PI * root * t) * 0.7 + (Math.sin(2 * Math.PI * root * 2 * t) * 0.3)) * Math.exp(-beatPhase * 2.2);

    // Warm Rhodes/Pluck Chord (root, minor 3rd, 5th, 7th)
    const chord = (
      Math.sin(2 * Math.PI * root * 2 * t) * 0.3 +
      Math.sin(2 * Math.PI * root * 2.4 * t) * 0.25 +
      Math.sin(2 * Math.PI * root * 3.0 * t) * 0.2
    ) * Math.exp(-beatPhase * 3.0);

    // Drum Kick on every 1st and 3rd beat of bar (or four on floor)
    let kick = 0;
    if (beatIndex % 2 === 0) {
      const kickT = beatPhase * beatDur;
      if (kickT < 0.15) {
        const kickFreq = 120 * Math.exp(-kickT * 30);
        kick = Math.sin(2 * Math.PI * kickFreq * kickT) * Math.exp(-kickT * 18) * 0.7;
      }
    }

    // Hi-hat shaker on off-beats
    let hihat = 0;
    if (beatPhase > 0.45 && beatPhase < 0.55) {
      hihat = (Math.random() * 2 - 1) * 0.15 * Math.exp(-(beatPhase - 0.45) * 40);
    }

    // Master sample mix
    const mix = bass * 0.45 + chord * 0.35 + kick * 0.5 + hihat * 0.2;
    // Smooth intro & outro fades
    const fadeIn = Math.min(1, t / 0.5);
    const fadeOut = Math.min(1, (dur - t) / 0.8);
    samples[i] = mix * fadeIn * fadeOut * 0.4;
  }
  return writeWav('music_bed.wav', samples, sr);
}

// 4. Combine all layers into master_audio.wav using FFmpeg
function assembleMasterAudio() {
  generateGlitch();
  generateCashChime();
  generateMusicBed();

  const l1 = path.join(AUDIO_DIR, 'line1_cuaderno.wav');
  const l2 = path.join(AUDIO_DIR, 'line2_crm.wav');
  const l3 = path.join(AUDIO_DIR, 'line3_cta.wav');
  const glitch = path.join(AUDIO_DIR, 'sfx_glitch.wav');
  const cash = path.join(AUDIO_DIR, 'sfx_cash.wav');
  const music = path.join(AUDIO_DIR, 'music_bed.wav');
  const masterWav = path.join(AUDIO_DIR, 'master_audio.wav');

  // Timings:
  // t=0.2s: Line 1 (atempo=1.1) -> ~3.0s (ends ~3.2s)
  // t=3.3s: Glitch whoosh transition (0.6s) -> ends ~3.9s
  // t=3.8s: Line 2 (atempo=1.15) -> ~5.0s (ends ~8.8s)
  // t=4.0s: Cash chime
  // t=9.0s: Line 3 (atempo=1.2) -> ~5.8s (ends ~14.8s)
  // Music bed: volume=0.2 (low background volume for dynamism without masking voice)

  console.log('Mixing audio layers with FFmpeg...');
  const cmd = `ffmpeg -y ` +
    `-i "${l1}" -i "${l2}" -i "${l3}" -i "${glitch}" -i "${cash}" -i "${music}" ` +
    `-filter_complex "` +
    `[0:a]atempo=1.1,adelay=200|200,volume=1.0[v1];` +
    `[3:a]adelay=3300|3300,volume=0.9[s_glitch];` +
    `[1:a]atempo=1.15,adelay=3800|3800,volume=1.0[v2];` +
    `[4:a]adelay=4000|4000,volume=0.8[s_cash];` +
    `[2:a]atempo=1.2,adelay=9000|9000,volume=1.0[v3];` +
    `[5:a]volume=0.22[bgm];` +
    `[v1][s_glitch][v2][s_cash][v3][bgm]amix=inputs=6:duration=longest:dropout_transition=2,volume=1.8[out]" ` +
    `-map "[out]" -ar 44100 -ac 2 "${masterWav}"`;

  execSync(cmd, { stdio: 'inherit' });
  console.log('Master audio generated successfully:', masterWav);
}

assembleMasterAudio();
