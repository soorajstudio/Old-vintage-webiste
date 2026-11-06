import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { RELICS_DATA } from '../src/modelsData.js';

const PORT = 8899;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const THUMBNAILS_DIR = path.resolve(process.cwd(), 'thumbnails');

if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

// 1. Simple static server for the workspace
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/scripts/thumb-renderer.html';
  const filePath = path.resolve(process.cwd(), '.' + reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Thumbnail server listening on http://localhost:${PORT}`);

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-webgl',
        '--use-gl=angle',
        '--ignore-gpu-blocklist'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 320, height: 320 });

    await page.goto(`http://localhost:${PORT}/scripts/thumb-renderer.html`, { waitUntil: 'networkidle0' });
    console.log('Renderer page loaded successfully.');

    for (let i = 0; i < RELICS_DATA.length; i++) {
      const relic = RELICS_DATA[i];
      const outPath = path.join(THUMBNAILS_DIR, `${relic.id}.png`);

      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
        console.log(`[${i+1}/${RELICS_DATA.length}] ${relic.title} already exists, skipping.`);
        continue;
      }

      console.log(`[${i+1}/${RELICS_DATA.length}] Rendering ${relic.title} (${relic.file})...`);
      try {
        const dataUrl = await page.evaluate(async (file) => {
          return window.renderModelThumbnail(file);
        }, relic.file);

        if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
          console.log(`✓ Saved ${relic.id}.png (${fs.statSync(outPath).size} bytes)`);
        } else {
          console.warn(`Failed to render ${relic.id}: dataUrl is empty or invalid.`);
        }
      } catch (err) {
        console.error(`Error rendering ${relic.id}:`, err);
      }
    }

    await browser.close();
    console.log('All thumbnails rendered successfully!');
  } catch (err) {
    console.error('Fatal thumbnail generation error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
