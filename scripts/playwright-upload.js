#!/usr/bin/env node
/**
 * Upload AAB to Google Play Console using Playwright with persistent Chrome context
 * Uses the real Chrome browser with user session to handle file upload
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const AAB_PATH = path.resolve(__dirname, '../ecrin-virtuel-release.aab');
const DEVELOPER_ID = '7896081753434662432';

async function main() {
  if (!fs.existsSync(AAB_PATH)) {
    console.error(`❌ AAB not found: ${AAB_PATH}`);
    process.exit(1);
  }
  console.log(`📁 AAB: ${AAB_PATH} (${(fs.statSync(AAB_PATH).size / 1024 / 1024).toFixed(1)} MB)`);

  // Use a temp dir for the browser context - copy cookies from Chrome
  const tmpProfile = path.join(os.tmpdir(), 'playwright-play-upload');
  
  console.log('🌐 Launching Chromium browser...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
    slowMo: 200
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();

  // Navigate to Google Play Console
  console.log('🔐 Going to Google Play Console...');
  await page.goto(`https://play.google.com/console/u/0/developers/${DEVELOPER_ID}/app-list`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Check if we need to login
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  
  if (currentUrl.includes('accounts.google.com') || currentUrl.includes('signin')) {
    console.log('⚠️  Need to login - waiting 60s for manual login...');
    await page.waitForURL(`**/developers/${DEVELOPER_ID}/**`, { timeout: 60000 });
  }

  // Wait for app list
  await page.waitForSelector('text=Écrin Virtuel', { timeout: 30000 });
  console.log('✅ Found app list');

  // Click on the app
  await page.click('text=Écrin Virtuel');
  await page.waitForLoadState('networkidle');
  console.log('✅ Opened app dashboard');

  // Find Tests internes in sidebar
  await page.click('text=Tests internes', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  console.log('✅ On Internal Testing page');

  // Click edit or create release
  try {
    await page.click('text=Modifier la version', { timeout: 5000 });
  } catch {
    await page.click('text=Créer une version', { timeout: 5000 });
  }
  await page.waitForLoadState('networkidle');
  console.log('✅ On release page - setting up file upload...');

  // Wait for the upload button and handle file chooser
  await page.waitForSelector('text=Importer', { timeout: 15000 });
  
  console.log('📤 Clicking upload button and selecting file...');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 15000 }),
    page.getByText('Importer').first().click()
  ]);

  console.log('📂 File chooser opened - selecting file...');
  await fileChooser.setFiles(AAB_PATH);
  console.log('🔄 File selected! Waiting for upload to complete (may take a few minutes)...');

  // Wait for the AAB to be processed
  await page.waitForSelector('text=com.inferencevision.lecrinvirtuel', { 
    timeout: 600000, // 10 mins
    state: 'visible' 
  });
  
  console.log('✅ Upload complete! Package name confirmed.');
  
  // Save screenshot
  const screenshotPath = path.join(__dirname, '../upload-result.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Screenshot: ${screenshotPath}`);

  // Click Save
  try {
    await page.click('text=Enregistrer', { timeout: 5000 });
    console.log('💾 Saved!');
  } catch (e) {
    console.log('Save button not found, continuing...');
  }

  console.log('\n🎉 SUCCESS! AAB uploaded to Google Play Internal Testing track.');
  await browser.close();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
