import { VideoPlan, BrowserAction, BrowserType } from './config.js';

export interface BrowserConfig {
  browser: BrowserType;
  headless: boolean;
  viewport: { width: number; height: number };
  slowMo: number;
  profileDir?: string;
}

export const DEFAULT_BROWSER_CONFIG: BrowserConfig = {
  browser: 'chromium',
  headless: true,
  viewport: { width: 1920, height: 1080 },
  slowMo: 0,
};

export function checkPlaywrightInstalled(): boolean {
  try {
    require.resolve('playwright');
    return true;
  } catch {
    return false;
  }
}

export function checkPlaywrightBrowsers(): boolean {
  try {
    const { execSync } = require('node:child_process');
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function buildPlaywrightScript(
  actions: BrowserAction[],
  config: BrowserConfig
): string {
  const lines: string[] = [
    "const { chromium } = require('playwright');",
    '',
    '(async () => {',
    `  const browser = await chromium.launch({ headless: ${config.headless} });`,
    `  const context = await browser.newContext({`,
    `    viewport: { width: ${config.viewport.width}, height: ${config.viewport.height} }`,
    '  });',
    '  const page = await context.newPage();',
    '',
  ];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    lines.push(`  // Action ${i + 1}: ${action.label || action.type}`);

    switch (action.type) {
      case 'goto':
        lines.push(`  await page.goto('${action.url}');`);
        break;
      case 'click':
        lines.push(`  await page.click('${action.selector}');`);
        break;
      case 'type':
        lines.push(`  await page.keyboard.type(${JSON.stringify(action.text)}, { delay: 50 });`);
        break;
      case 'wait':
        lines.push(`  await page.waitForTimeout(${action.timeoutMs || 1000});`);
        break;
      case 'screenshot':
        lines.push(`  await page.screenshot({ path: 'screenshot-${i}.png' });`);
        break;
      case 'scroll':
        lines.push(`  await page.evaluate(() => window.scrollBy(0, 500));`);
        break;
      case 'press':
        lines.push(`  await page.keyboard.press('${action.selector || 'Enter'}');`);
        break;
      case 'eval':
        lines.push(`  await page.evaluate(() => { ${action.text || ''} });`);
        break;
    }
    lines.push('');
  }

  lines.push('  await browser.close();');
  lines.push('})();');

  return lines.join('\n');
}

export function generateManualInstructions(actions: BrowserAction[]): string[] {
  const instructions: string[] = [];
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    switch (a.type) {
      case 'goto':
        instructions.push(`${i + 1}. Open ${a.url}`);
        break;
      case 'click':
        instructions.push(`${i + 1}. Click ${a.label || a.selector || 'the element'}`);
        break;
      case 'type':
        instructions.push(`${i + 1}. Type: "${(a.text || '').slice(0, 60)}"`);
        break;
      case 'wait':
        instructions.push(`${i + 1}. Wait ${a.timeoutMs || 1000}ms`);
        break;
      case 'screenshot':
        instructions.push(`${i + 1}. Take a screenshot`);
        break;
      case 'press':
        instructions.push(`${i + 1}. Press ${a.selector || 'Enter'}`);
        break;
      default:
        instructions.push(`${i + 1}. ${a.type}`);
    }
  }
  return instructions;
}
