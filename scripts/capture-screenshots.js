import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';

const PORT = 8877;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.resolve(process.cwd(), '.' + reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-webgl',
        '--use-gl=angle',
        '--ignore-gpu-blocklist',
        '--window-size=1600,1050'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1.5 });

    console.log('Navigating to local site...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

    // Wait for the 3D model loader to hide
    console.log('Waiting for 3D model to load...');
    await page.waitForFunction(() => {
      const loader = document.getElementById('viewport-loader');
      return loader && loader.classList.contains('hidden');
    }, { timeout: 20000 });

    // Wait an extra second for Three.js scene and shaders to settle
    await new Promise(r => setTimeout(r, 1500));

    // 1. Capture Hero Stage (3D Viewport, Arrows, Codex, and Bottom Character Deck)
    console.log('Capturing Hero Showcase...');
    const heroEl = await page.$('#hero-stage');
    if (heroEl) {
      await heroEl.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'hero-showcase.png'),
        type: 'png'
      });
      console.log('✓ Saved screenshots/hero-showcase.png');
    }

    // 2. Capture Bottom Selection Deck close-up
    console.log('Capturing Selection Deck...');
    const deckEl = await page.$('.character-deck-panel');
    if (deckEl) {
      await deckEl.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'bottom-selection-deck.png'),
        type: 'png'
      });
      console.log('✓ Saved screenshots/bottom-selection-deck.png');
    }

    // 3. Capture Curio Cabinet Grid
    console.log('Capturing Curio Cabinet...');
    const cabinetEl = await page.$('#curio-cabinet');
    if (cabinetEl) {
      await cabinetEl.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'curio-cabinet-grid.png'),
        type: 'png'
      });
      console.log('✓ Saved screenshots/curio-cabinet-grid.png');
    }

    // 4. Capture Alchemist's Forge Studio
    console.log('Capturing Alchemist Forge...');
    const forgeEl = await page.$('#forge-studio');
    if (forgeEl) {
      await forgeEl.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'alchemist-forge.png'),
        type: 'png'
      });
      console.log('✓ Saved screenshots/alchemist-forge.png');
    }

    // 5. Capture Lore Modal
    console.log('Opening Lore Modal...');
    await page.evaluate(() => {
      const btn = document.querySelector('.btn-lore-modal');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const modalEl = await page.$('.modal-card');
    if (modalEl) {
      await modalEl.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'lore-modal.png'),
        type: 'png'
      });
      console.log('✓ Saved screenshots/lore-modal.png');
    }

    // Close modal
    await page.evaluate(() => {
      const close = document.getElementById('modal-close');
      if (close) close.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 6. Capture Full Page Overview
    console.log('Capturing Full Header & Hero Overview...');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'overview-desktop.png'),
      type: 'png'
    });
    console.log('✓ Saved screenshots/overview-desktop.png');

    await browser.close();
    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Screenshot capture failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
