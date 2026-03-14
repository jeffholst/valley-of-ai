#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import http from 'http';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const appsRoot = path.join(root, 'apps');

const args = process.argv.slice(2);
const argMap = new Map();
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      argMap.set(a, next);
      i += 1;
    } else {
      argMap.set(a, true);
    }
  }
}

const LIMIT = argMap.get('--limit') ? Number(argMap.get('--limit')) : null;
const ONLY = argMap.get('--only') ? String(argMap.get('--only')) : null;
const REPORT_PATH = path.join(root, 'logs', 'responsive-validation.json');

const VIEWPORTS = [
  { id: 'mobile-portrait', width: 390, height: 844, mobile: true, hasTouch: true },
  { id: 'tablet', width: 768, height: 1024, mobile: true, hasTouch: true },
  { id: 'desktop', width: 1366, height: 768, mobile: false, hasTouch: false },
];

function walkIndexFiles(dir, found = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkIndexFiles(full, found);
    } else if (entry.isFile() && entry.name === 'index.html') {
      found.push(full);
    }
  }
  return found;
}

function mimeType(file) {
  if (file.endsWith('.html')) {return 'text/html; charset=utf-8';}
  if (file.endsWith('.js')) {return 'application/javascript; charset=utf-8';}
  if (file.endsWith('.css')) {return 'text/css; charset=utf-8';}
  if (file.endsWith('.json')) {return 'application/json; charset=utf-8';}
  if (file.endsWith('.svg')) {return 'image/svg+xml';}
  if (file.endsWith('.png')) {return 'image/png';}
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {return 'image/jpeg';}
  if (file.endsWith('.webp')) {return 'image/webp';}
  return 'application/octet-stream';
}

function createServer(baseDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = decodeURIComponent((req.url || '/').split('?')[0]);
        let filePath = path.join(baseDir, url);

        if (!filePath.startsWith(baseDir)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        if (url === '/' || fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }

        if (!fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }

        const data = fs.readFileSync(filePath);
        res.setHeader('Content-Type', mimeType(filePath));
        res.end(data);
      } catch (e) {
        res.statusCode = 500;
        res.end(`Server error: ${e.message}`);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind server'));
        return;
      }
      resolve({ server, port: addr.port });
    });
  });
}

function findInteractiveSelector(page) {
  return page.evaluate(() => {
    const selectors = [
      'button',
      '[role="button"]',
      'input[type="button"]',
      'input[type="submit"]',
      'a[href]',
      'canvas',
      '.tile',
      '.slot'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {return sel;}
    }
    return null;
  });
}

async function runChecks(page, viewportId) {
  const results = {
    viewport: viewportId,
    errors: [],
    warnings: [],
    details: {},
  };

  // Required viewport meta for responsive behavior
  const viewportMeta = await page.evaluate(() => {
    const m = document.querySelector('meta[name="viewport"]');
    return m ? m.getAttribute('content') || '' : '';
  });
  if (!viewportMeta || !/width\s*=\s*device-width/i.test(viewportMeta)) {
    results.errors.push('missing/invalid viewport meta (requires width=device-width)');
  }

  const dims = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    innerHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  results.details.dimensions = dims;

  if (dims.scrollWidth > dims.innerWidth + 2) {
    results.errors.push(`horizontal overflow detected (${dims.scrollWidth}px > ${dims.innerWidth}px)`);
  }

  const hasVisibleMain = await page.evaluate(() => {
    const candidates = [document.querySelector('main'), document.querySelector('#app'), document.querySelector('canvas'), document.body];
    for (const el of candidates) {
      if (!el) {continue;}
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {return true;}
    }
    return false;
  });
  if (!hasVisibleMain) {
    results.errors.push('no visible primary app container found');
  }

  const firstInteractiveSelector = await findInteractiveSelector(page);
  if (!firstInteractiveSelector) {
    results.warnings.push('no interactive control found');
  } else {
    const interactiveInfo = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) {return null;}
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        selector: sel,
        width: rect.width,
        height: rect.height,
        touchAction: style.touchAction,
      };
    }, firstInteractiveSelector);

    if (interactiveInfo) {
      results.details.firstInteractive = interactiveInfo;

      if (viewportId !== 'desktop' && interactiveInfo.height < 44) {
        results.warnings.push(`first interactive control is smaller than 44px high (${Math.round(interactiveInfo.height)}px)`);
      }

      try {
        await page.locator(firstInteractiveSelector).first().click({ timeout: 1500 });
      } catch {
        results.warnings.push(`could not tap/click first interactive control (${firstInteractiveSelector})`);
      }
    }
  }

  return results;
}

async function main() {
  if (!fs.existsSync(appsRoot)) {
    console.error('ERROR: apps directory not found.');
    process.exit(1);
  }

  let files = walkIndexFiles(appsRoot).map((f) => path.relative(root, f));
  if (ONLY) {files = files.filter((f) => f.includes(ONLY));}
  if (LIMIT && Number.isFinite(LIMIT)) {files = files.slice(0, LIMIT);}

  const { server, port } = await createServer(root);
  const browser = await chromium.launch({ headless: true });

  const report = {
    generatedAt: new Date().toISOString(),
    totalApps: files.length,
    failures: 0,
    warnings: 0,
    apps: [],
  };

  try {
    for (const relPath of files) {
      const appPath = '/' + relPath.replace(/\\/g, '/');
      const appResult = {
        app: relPath,
        failed: false,
        viewports: [],
      };

      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.mobile,
          hasTouch: vp.hasTouch,
        });
        const page = await context.newPage();

        const pageErrors = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        const url = `http://127.0.0.1:${port}${appPath}`;
        const nav = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const check = {
          viewport: vp.id,
          errors: [],
          warnings: [],
        };

        if (!nav || nav.status() >= 400) {
          check.errors.push(`failed to load (${nav ? nav.status() : 'no response'})`);
        } else {
          const run = await runChecks(page, vp.id);
          check.errors.push(...run.errors);
          check.warnings.push(...run.warnings);
          check.details = run.details;
        }

        if (pageErrors.length) {
          check.errors.push(...pageErrors.map((e) => `pageerror: ${e}`));
        }

        if (check.errors.length) {appResult.failed = true;}
        report.warnings += check.warnings.length;

        appResult.viewports.push(check);
        await context.close();
      }

      if (appResult.failed) {report.failures += 1;}
      report.apps.push(appResult);
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  if (report.failures > 0) {
    console.error(`Responsive validation failed for ${report.failures}/${report.totalApps} app(s).`);
    console.error(`Full report: ${REPORT_PATH}`);

    for (const app of report.apps.filter((a) => a.failed).slice(0, 10)) {
      console.error(`- ${app.app}`);
      for (const vp of app.viewports) {
        if (!vp.errors.length) {continue;}
        console.error(`  [${vp.viewport}]`);
        for (const e of vp.errors) {console.error(`    - ${e}`);}
      }
    }

    process.exit(1);
  }

  console.log(`Responsive validation passed for ${report.totalApps} app(s).`);
  if (report.warnings > 0) {
    console.log(`Warnings: ${report.warnings} (see ${REPORT_PATH})`);
  }
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
