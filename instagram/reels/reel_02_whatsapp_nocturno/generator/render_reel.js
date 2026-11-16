const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML_PATH = path.resolve(__dirname, 'reel_scene.html');
const AUDIO_PATH = path.resolve(__dirname, '../audio/master_audio.wav');
const OUTPUT_VIDEO = path.resolve(__dirname, '../renders/reel_01_cuaderno_vs_crm.mp4');
const POSTER_IMAGE = path.resolve(__dirname, '../renders/reel_01_poster.jpg');

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 25;
const TOTAL_FRAMES = 393; // 15.72 seconds

async function main() {
  console.log(`Starting Reel #01 render (${WIDTH}x${HEIGHT} @ ${FPS}fps, ${TOTAL_FRAMES} frames)...`);

  // Ensure renders directory exists
  const rendersDir = path.dirname(OUTPUT_VIDEO);
  if (!fs.existsSync(rendersDir)) {
    fs.mkdirSync(rendersDir, { recursive: true });
  }

  // Launch Chrome Headless
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
  console.log('Navigating to scene:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Spawn FFmpeg to receive piped PNG frames and merge with audio
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
    '-crf', '19',
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

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    await page.evaluate((frameIndex) => {
      window.renderFrame(frameIndex);
    }, f);

    // Save frame 50 as cover poster
    if (f === 50) {
      await page.screenshot({ path: POSTER_IMAGE, type: 'jpeg', quality: 90 });
      console.log('Saved cover poster:', POSTER_IMAGE);
    }

    const frameBuffer = await page.screenshot({ type: 'png', omitBackground: false });
    const canWrite = ffmpeg.stdin.write(frameBuffer);

    if (!canWrite) {
      await new Promise((res) => ffmpeg.stdin.once('drain', res));
    }

    if (f % 50 === 0 || f === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const fpsReal = (f / ((Date.now() - startTime) / 1000)).toFixed(1);
      console.log(`Rendered frame ${f + 1}/${TOTAL_FRAMES} (${Math.round(((f + 1) / TOTAL_FRAMES) * 100)}%) - ${fpsReal} fps [${elapsed}s]`);
    }
  }

  ffmpeg.stdin.end();
  await browser.close();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Reel #01 successfully encoded to:', OUTPUT_VIDEO);
        const stats = fs.statSync(OUTPUT_VIDEO);
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
