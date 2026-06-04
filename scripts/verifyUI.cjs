const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// Target brain review output directory using forward slashes
const outputDir = 'C:/Users/Craig/.gemini/antigravity/brain/6833670c-3827-4fb2-878e-3116db65c4b8/ui_review';

// Simple sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function findChromeExecutable() {
  const possiblePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  ];

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }

  throw new Error('Google Chrome installation could not be found.');
}

async function runUIReview() {
  console.log('🚀 Starting Expanded Cabinet UI/UX Headless Review System...');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const chromePath = findChromeExecutable();
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  try {
    console.log('📡 Connecting to local cabinet dev server...');
    await page.goto('http://localhost:3050', { waitUntil: 'networkidle2', timeout: 10000 });
    
    // State 1: Capture Main Menu
    console.log('📷 Capturing State 1: Main Menu...');
    await page.waitForSelector('#menu-config-btn', { timeout: 5000 });
    await page.screenshot({ path: path.join(outputDir, '01_main_menu.png') });

    // State 2: Trigger Settings configuration
    console.log('⚙ Clicking Config Settings button...');
    await page.click('#menu-config-btn');
    await page.waitForSelector('#close-settings-btn', { timeout: 5000 });
    await sleep(500);
    console.log('📷 Capturing State 2: Config Settings View...');
    await page.screenshot({ path: path.join(outputDir, '02_settings_view.png') });

    // State 3: Exit settings and enter Customs shop
    console.log('🚪 Returning to main menu...');
    await page.click('#close-settings-btn');
    await page.waitForSelector('#menu-shop-btn', { timeout: 5000 });
    await sleep(300);

    console.log('🛒 Clicking Customs Shop button...');
    await page.click('#menu-shop-btn');
    await page.waitForSelector('#shop-close-btn', { timeout: 5000 });
    await sleep(500);
    console.log('📷 Capturing State 3: Customs Locker Shop...');
    await page.screenshot({ path: path.join(outputDir, '03_shop_locker.png') });

    // State 4: Exit shop and start active gameplay session
    console.log('🚪 Confirming customization parts...');
    await page.click('#shop-close-btn');
    await page.waitForSelector('#menu-start-btn', { timeout: 5000 });
    await sleep(300);

    console.log('🎮 Starting Game run session...');
    await page.click('#menu-start-btn');
    // Wait briefly (400ms) so the snake moves slightly but stays safely on-screen
    await sleep(400); 
    console.log('📷 Capturing State 4: Gameplay Live Session...');
    await page.screenshot({ path: path.join(outputDir, '04_gameplay_live.png') });

    // State 5: Trigger game loop pause
    console.log('⏸ Pressing Spacebar to pause loop...');
    await page.keyboard.press(' ');
    await sleep(500);
    console.log('📷 Capturing State 5: Gameplay Paused View...');
    await page.screenshot({ path: path.join(outputDir, '05_gameplay_paused.png') });

    // State 6: Resume and wait to crash, entering Game Over state
    console.log('▶ Resuming game to trigger test crash...');
    await page.keyboard.press(' ');
    // Wait 3 seconds to let it crash and load Game Over view
    await sleep(3000); 
    console.log('📷 Capturing State 6: Game Over View...');
    await page.screenshot({ path: path.join(outputDir, '06_game_over.png') });

    console.log('🎉 Verification screenshots generated successfully!');

  } catch (err) {
    console.error('❌ Headless review session failed:', err);
    try {
      await page.screenshot({ path: path.join(outputDir, 'failure_diagnostic.png') });
      console.log('Saved diagnostic screenshot to failure_diagnostic.png');
    } catch (ssErr) {
      console.error('Failed to capture diagnostic screenshot:', ssErr);
    }
  } finally {
    await browser.close();
    console.log('🏁 Headless session closed.');
  }
}

runUIReview();
