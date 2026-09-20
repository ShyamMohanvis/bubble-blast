const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const outputDir = path.join(__dirname, 'public', 'assets', 'scraped');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const downloadedUrls = new Set();

function downloadFile(url, dest) {
  if (downloadedUrls.has(url)) return;
  downloadedUrls.add(url);
  
  const file = fs.createWriteStream(dest);
  const client = url.startsWith('https') ? https : http;
  
  client.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded: ${path.basename(dest)}`);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading ${url}: ${err.message}`);
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async (response) => {
    const url = response.url();
    if (response.status() === 200) {
      console.log(`URL: ${url}`);
      
      if (
        url.endsWith('.png') || 
        url.endsWith('.jpg') || 
        url.endsWith('.atlas') || 
        url.endsWith('.json') ||
        url.endsWith('.mp3') ||
        url.endsWith('.wav') ||
        url.includes('sprite') ||
        url.includes('asset')
      ) {
        if (url.includes('google-analytics') || url.includes('ads')) return;
        
        try {
          const parsedUrl = new URL(url);
          let filename = path.basename(parsedUrl.pathname);
          if (filename === 'index.json' || filename === 'data.json') {
             filename = `${parsedUrl.hostname}_${Date.now()}_${filename}`;
          }
          const dest = path.join(outputDir, filename);
          downloadFile(url, dest);
        } catch (e) {
          console.log(`Error parsing URL: ${url}`);
        }
      }
    }
  });

  console.log('Navigating to game wrapper...');
  await page.goto('https://www.crazygames.com/game/bubble-blast-pwd', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log('Waiting for iframe to appear...');
  await page.waitForSelector('iframe#game-iframe', { timeout: 30000 }).catch(() => console.log('iframe#game-iframe not found'));
  
  const iframes = await page.$$('iframe');
  console.log(`Found ${iframes.length} frames.`);
  
  for (const iframe of iframes) {
    const src = await iframe.getAttribute('src');
    console.log(`Iframe src: ${src}`);
    
    if (src && !src.includes('google') && !src.includes('ads')) {
       console.log(`Navigating directly to iframe source: ${src}`);
       await page.goto(src, { waitUntil: 'load', timeout: 60000 });
       
       console.log('Clicking to bypass play screen...');
       await page.mouse.click(500, 300); // Click near center to trigger play
       await page.waitForTimeout(2000);
       await page.mouse.click(500, 300); // Double click
       
       console.log('Waiting inside iframe for assets to load...');
       await page.waitForTimeout(15000);
       break;
    }
  }

  console.log('Closing browser...');
  await browser.close();
})();
