const puppeteer = require('D:/ProyectosIA/caribia-labs-site/node_modules/puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_PATH = path.resolve(__dirname, 'reel_scene.html');
const AUDIO_PATH = path.resolve(__dirname, '../audio/master_audio.wav');
const RENDERS_DIR = path.resolve(__dirname, '../renders');
const OUTPUT_VIDEO = path.join(RENDERS_DIR, 'reel_06_entrega_rapida.mp4');
const POSTER_IMAGE = path.join(RENDERS_DIR, 'reel_06_poster.jpg');

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 25;
const TOTAL_FRAMES = 344; // Exactly 13.76 seconds

async function main() {
  console.log(`Starting Reel #06 render (${WIDTH}x${HEIGHT} @ ${FPS}fps, ${TOTAL_FRAMES} frames)...`);

  if (!fs.existsSync(RENDERS_DIR)) {
    fs.mkdirSync(RENDERS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
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
  console.log('Navigating to scene:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Save high-converting cover poster for Instagram
  console.log('Capturing high-converting poster cover...');
  await page.evaluate(() => window.renderFrame('poster'));
  await page.screenshot({ path: POSTER_IMAGE, type: 'jpeg', quality: 94 });
  console.log('Saved poster image at:', POSTER_IMAGE);

  // Copy poster to artifacts directory
  const artifactPoster = 'C:/Users/Everth/.gemini/antigravity/brain/a36dc656-c3c6-4fb0-a2d2-110f2cb6faca/reel_06_poster.jpg';
  try {
    fs.copyFileSync(POSTER_IMAGE, artifactPoster);
    console.log('Copied poster to artifacts:', artifactPoster);
  } catch (err) {
    console.warn('Could not copy to artifacts:', err.message);
  }

  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'png',
    '-r', String(FPS),
    '-i', '-',
    '-i', AUDIO_PATH,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-level', '4.2',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    OUTPUT_VIDEO
  ];

  console.log('Spawning FFmpeg encoder...');
  const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  ffmpeg.on('error', (err) => {
    console.error('FFmpeg process error:', err);
  });

  const startTime = Date.now();

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    await page.evaluate((f) => window.renderFrame(f), frame);
    const screenshotBuffer = await page.screenshot({ type: 'png', omitBackground: false });

    const canWrite = ffmpeg.stdin.write(screenshotBuffer);
    if (!canWrite) {
      await new Promise(resolve => ffmpeg.stdin.once('drain', resolve));
    }

    if (frame % 25 === 0 || frame === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((frame / TOTAL_FRAMES) * 100).toFixed(1);
      console.log(`Frame ${frame}/${TOTAL_FRAMES} (${pct}%) - ${elapsed}s elapsed`);
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  await browser.close();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 RENDER FINISHED in ${totalTime}s!`);
  console.log(`Master Video: ${OUTPUT_VIDEO}`);

  // Copy to artifacts
  const artifactVideo = 'C:/Users/Everth/.gemini/antigravity/brain/a36dc656-c3c6-4fb0-a2d2-110f2cb6faca/reel_06_entrega_rapida.mp4';
  try {
    fs.copyFileSync(OUTPUT_VIDEO, artifactVideo);
    console.log('Copied video to artifacts:', artifactVideo);
  } catch (err) {
    console.warn('Could not copy video to artifacts:', err.message);
  }
}

main().catch(err => {
  console.error('Render error:', err);
  process.exit(1);
});
