const puppeteer = require('puppeteer-core');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_PATH = path.resolve(__dirname, 'reel_scene.html');
const OUTPUT_VIDEO = path.resolve(__dirname, '../renders/reel_04_error_solucion.mp4');
const POSTER_IMAGE = path.resolve(__dirname, '../renders/reel_04_poster.jpg');
const AUDIO_BED = path.resolve(__dirname, '../audio/master_audio.wav');

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 25;
const DURATION = 12; // seconds
const TOTAL_FRAMES = FPS * DURATION; // 300

async function generateAudio() {
  if (fs.existsSync(AUDIO_BED)) {
    console.log('Using existing Master Audio mix:', AUDIO_BED);
    return true;
  }
  console.log('Generating background music bed (dark tech pulse, 12s)...');
  // Create a dark pulsing synth bed with FFmpeg lavfi
  const cmd = [
    'ffmpeg', '-y',
    '-f', 'lavfi', '-i',
    `sine=frequency=80:duration=${DURATION}`,
    '-f', 'lavfi', '-i',
    `sine=frequency=120:duration=${DURATION}`,
    '-f', 'lavfi', '-i',
    `anoisesrc=d=${DURATION}:c=pink:r=44100:a=0.02`,
    '-filter_complex',
    `[0]volume=0.15[bass];[1]volume=0.08,tremolo=f=4:d=0.6[mid];[2]volume=0.04[noise];[bass][mid][noise]amix=inputs=3:duration=first,aformat=sample_fmts=s16:sample_rates=44100:channel_layouts=stereo,afade=t=in:st=0:d=0.5,afade=t=out:st=${DURATION - 1.5}:d=1.5`,
    AUDIO_BED
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log('Audio bed generated:', AUDIO_BED);
  } catch (err) {
    console.error('Audio generation failed, continuing without audio:', err.message);
    return false;
  }
  return true;
}

async function main() {
  console.log(`\n=== REEL #04: ERROR VS SOLUCIÓN ===`);
  console.log(`Resolution: ${WIDTH}x${HEIGHT} @ ${FPS}fps`);
  console.log(`Duration: ${DURATION}s (${TOTAL_FRAMES} frames)\n`);

  // Ensure output dirs
  const rendersDir = path.dirname(OUTPUT_VIDEO);
  if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true });
  const audioDir = path.dirname(AUDIO_BED);
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  // Generate audio
  const hasAudio = await generateAudio();

  // Launch Chrome
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--hide-scrollbars',
      `--window-size=${WIDTH},${HEIGHT}`
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  const fileUrl = 'file:///' + HTML_PATH.replace(/\\/g, '/');
  console.log('Loading scene:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // FFmpeg args
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'png',
    '-r', String(FPS),
    '-i', '-'
  ];

  if (hasAudio) {
    ffmpegArgs.push('-i', AUDIO_BED);
  }

  ffmpegArgs.push(
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-level', '4.2',
    '-crf', '19',
    '-c:a', hasAudio ? 'aac' : 'copy',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    OUTPUT_VIDEO
  );

  console.log('Spawning FFmpeg encoder...');
  const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  ffmpeg.on('error', (err) => {
    console.error('FFmpeg error:', err);
  });

  const startTime = Date.now();

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    await page.evaluate((frameIndex) => {
      window.renderFrame(frameIndex);
    }, f);

    // Save poster at frame 30 (1.2s – problem phase with stats visible)
    if (f === 30) {
      await page.screenshot({ path: POSTER_IMAGE, type: 'jpeg', quality: 92 });
      console.log('Saved cover poster:', POSTER_IMAGE);
    }

    const frameBuffer = await page.screenshot({ type: 'png', omitBackground: false });
    const canWrite = ffmpeg.stdin.write(frameBuffer);

    if (!canWrite) {
      await new Promise((res) => ffmpeg.stdin.once('drain', res));
    }

    if (f % 50 === 0 || f === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const fpsReal = f > 0 ? (f / ((Date.now() - startTime) / 1000)).toFixed(1) : '0';
      console.log(`Frame ${f + 1}/${TOTAL_FRAMES} (${Math.round(((f + 1) / TOTAL_FRAMES) * 100)}%) - ${fpsReal} fps [${elapsed}s]`);
    }
  }

  ffmpeg.stdin.end();
  await browser.close();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const stats = fs.statSync(OUTPUT_VIDEO);
        console.log(`\n✅ Reel #03 rendered: ${OUTPUT_VIDEO}`);
        console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

main().catch((err) => {
  console.error('Fatal render error:', err);
  process.exit(1);
});
