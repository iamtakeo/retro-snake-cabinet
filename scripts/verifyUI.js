const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// Target brain review output directory for the Antigravity workspace
const outputDir = 'C:\\Users\\Craig\\.gemini\\antigravity\\brain\\6833670c-3827-4fb2-878e-3116db65c4b8\\ui_review';

// Locate standard Google Chrome executable paths on Windows
function findChromeExecutable() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ];

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }

  throw new Error('Google Chrome installation could not be found on this system. Please check your path.');
}

async function runUIReview() {
  console.log('🚀 Starting Cabinet UI/UX Headless Review System...');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created review outputs directory: ${outputDir}`);
  }

  const chromePath = findChromeExecutable();
  console.log(`🔍 Detected Google Chrome path: ${chromePath}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  try {
    console.log('📡 Connecting to local cabinet dev server at http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 });
    
    // State 1: Capture Main Menu
    console.log('📷 Capturing State 1: Main Menu...');
    await page.waitForSelector('#menu-config-btn', { timeout: 5000 });
    await page.screenshot({ path: path.join(outputDir, '01_main_menu.png') });

    // State 2: Trigger Settings configuration
    console.log('⚙ Clicking Config Settings button...');
    await page.click('#menu-config-btn');
    await page.waitForSelector('#close-settings-btn', { timeout: 5000 });
    await page.waitForTimeout(500); // Wait for transition fade-in
    console.log('📷 Capturing State 2: Config Settings View...');
    await page.screenshot({ path: path.join(outputDir, '02_settings_view.png') });

    // State 3: Exit settings and enter Customs shop
    console.log('🚪 Returning to main menu...');
    await page.click('#close-settings-btn');
    await page.waitForSelector('#menu-shop-btn', { timeout: 5000 });
    await page.waitForTimeout(300);

    console.log('🛒 Clicking Customs Shop button...');
    await page.click('#menu-shop-btn');
    await page.waitForSelector('#shop-close-btn', { timeout: 5000 });
    await page.waitForTimeout(500); // Shop preview transition bleep
    console.log('📷 Capturing State 3: Customs Locker Shop...');
    await page.screenshot({ path: path.join(outputDir, '03_shop_locker.png') });

    // State 4: Exit shop and start active gameplay session
    console.log('🚪 Confirming customization parts...');
    await page.click('#shop-close-btn');
    await page.waitForSelector('#menu-start-btn', { timeout: 5000 });
    await page.waitForTimeout(300);

    console.log('🎮 Starting Game run session...');
    await page.click('#menu-start-btn');
    // Wait for the countdown ticks to fade and the first couple of gameplay steps to execute
    await page.waitForTimeout(2000); 
    console.log('📷 Capturing State 4: Gameplay Live Session...');
    await page.screenshot({ path: path.join(outputDir, '04_gameplay_live.png') });

    // State 5: Trigger game loop pause bleep
    console.log('⏸ Pressing Spacebar to pause loop...');
    await page.keyboard.press(' ');
    await page.waitForTimeout(500);
    console.log('📷 Capturing State 5: Gameplay Paused View...');
    await page.screenshot({ path: path.join(outputDir, '05_gameplay_paused.png') });

    console.log('🎉 Verification screenshots generated successfully!');
    console.log(`🖼 Saved files located at: ${outputDir}`);

  } catch (err) {
    console.error('❌ Headless review session failed:', err);
  } finally {
    await browser.close();
    console.log('🏁 Headless session closed.');
  }
}

runUIReview();
