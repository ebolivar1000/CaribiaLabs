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
  const dur = 0.5;
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

// 2. Generate Upbeat Modern Tech / Lo-Fi Electronic Beat (16.5s)
function generateMusicBed() {
  const sr = 44100;
  const dur = 16.5;
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

    // Synth Bass
    const bass = (Math.sin(2 * Math.PI * root * t) * 0.7 + (Math.sin(2 * Math.PI * root * 2 * t) * 0.3)) * Math.exp(-beatPhase * 2.2);

    // Warm Rhodes/Pluck Chord
    const chord = (
      Math.sin(2 * Math.PI * root * 2 * t) * 0.3 +
      Math.sin(2 * Math.PI * root * 2.4 * t) * 0.25 +
      Math.sin(2 * Math.PI * root * 3.0 * t) * 0.2
    ) * Math.exp(-beatPhase * 3.0);

    // Drum Kick
    let kick = 0;
    if (beatIndex % 2 === 0) {
      const kickT = beatPhase * beatDur;
      if (kickT < 0.15) {
        const kickFreq = 120 * Math.exp(-kickT * 30);
        kick = Math.sin(2 * Math.PI * kickFreq * kickT) * Math.exp(-kickT * 18) * 0.7;
      }
    }

    // Hi-hat shaker
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

// 3. Combine Diego Voice + Glitch SFX + Short Cash SFX + Music Bed
function assembleDiegoMaster() {
  generateGlitch();
  generateMusicBed();

  const diegoVoice = path.join(AUDIO_DIR, 'ElevenLabs_2026-11-16T19_28_34_Diego - Engaging, Energetic, Confident_pvc_s50_sim75_v4.mp3');
  const glitch = path.join(AUDIO_DIR, 'sfx_glitch.wav');
  const cashShort = path.join(AUDIO_DIR, 'sfx_cash_short.wav');
  const music = path.join(AUDIO_DIR, 'music_bed.wav');
  const masterWav = path.join(AUDIO_DIR, 'master_audio.wav');

  // Timings based on silencedetect:
  // Diego total: 15.72s
  // Line 1 ends at 3.12s -> Glitch SFX placed at 3.15s (adelay=3150|3150)
  // Line 2 ends at 9.76s ("en un solo clic.")
  // Line 3 starts at 10.19s ("CaribIA Labs...")
  // Silence window: 9.76s to 10.19s (430ms) -> Cash SFX placed right at 9.78s (adelay=9780|9780)
  // Background music: volume=0.18 (soft subtle energy)

  console.log('Mixing Diego voiceover with SFX and background music...');
  const cmd = `ffmpeg -y ` +
    `-i "${diegoVoice}" -i "${glitch}" -i "${cashShort}" -i "${music}" ` +
    `-filter_complex "` +
    `[0:a]volume=1.05[voice];` +
    `[1:a]adelay=3150|3150,volume=0.85[s_glitch];` +
    `[2:a]adelay=9780|9780,volume=0.9[s_cash];` +
    `[3:a]volume=0.18[bgm];` +
    `[voice][s_glitch][s_cash][bgm]amix=inputs=4:duration=first:dropout_transition=2,volume=1.5[out]" ` +
    `-map "[out]" -ar 44100 -ac 2 "${masterWav}"`;

  execSync(cmd, { stdio: 'inherit' });
  console.log('Master audio generated successfully:', masterWav);
}

assembleDiegoMaster();
