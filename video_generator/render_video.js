const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function render() {
  console.log('🚀 Iniciando renderizado de video en alta definición...');
  const framesDir = path.join(__dirname, 'frames');
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 540, height: 760, deviceScaleFactor: 1 });

  const sceneUrl = 'file:///' + path.join(__dirname, 'scene.html').replace(/\\/g, '/');
  console.log(`Cargando escena: ${sceneUrl}`);
  await page.goto(sceneUrl, { waitUntil: 'networkidle0' });

  const fps = 25;
  const duration = 22.0;
  const totalFrames = Math.floor(duration * fps); // 550 frames

  console.log(`📸 Capturando ${totalFrames} fotogramas a ${fps} fps (${duration}s)...`);
  const startTime = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    await page.evaluate((time) => window.seekToTime(time), t);

    const frameFile = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`);
    await page.screenshot({ path: frameFile, type: 'png' });

    // Guardar poster en el frame 200 (~8s) donde ya se ve el análisis
    if (i === 200) {
      const posterPath = path.join(__dirname, '..', 'assets', 'demo_automatizacion_poster.jpg');
      fs.copyFileSync(frameFile, posterPath);
      console.log(`🖼️ Poster generado en: ${posterPath}`);
    }

    if (i % 50 === 0 || i === totalFrames - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   Fotograma ${i}/${totalFrames} (${t.toFixed(1)}s / ${duration}s) - ${elapsed}s transcurridos`);
    }
  }

  await browser.close();
  console.log('✅ Todos los fotogramas capturados con éxito.');

  // Codificar con ffmpeg
  const outputMp4 = path.join(__dirname, '..', 'assets', 'demo_automatizacion_hero.mp4');
  console.log(`🎞️ Codificando MP4 H.264 con ffmpeg hacia: ${outputMp4}`);

  const ffmpegCmd = `ffmpeg -y -framerate 25 -i "${path.join(framesDir, 'frame_%04d.png')}" -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p -crf 20 -movflags +faststart "${outputMp4}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  console.log('✨ Video MP4 generado exitosamente.');

  // Limpiar fotogramas
  console.log('🧹 Limpiando fotogramas temporales...');
  const files = fs.readdirSync(framesDir);
  for (const file of files) {
    fs.unlinkSync(path.join(framesDir, file));
  }
  fs.rmdirSync(framesDir);

  console.log('🎉 PROCESO COMPLETADO AL 100%');
}

render().catch(err => {
  console.error('❌ Error en el render:', err);
  process.exit(1);
});
