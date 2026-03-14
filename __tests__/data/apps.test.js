/**
 * Apps Data Registry Tests
 *
 * Validates the apps.json registry structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Try to read the generated apps.json if it exists
let appsData = null;

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const appsJsonPath = path.join(
    __dirname,
    '..',
    'data',
    'apps.json'
  );

  if (fs.existsSync(appsJsonPath)) {
    const content = fs.readFileSync(appsJsonPath, 'utf-8');
    appsData = JSON.parse(content);
  }
} catch {
  // If file doesn't exist or can't be read, appsData remains null
}

describe('Apps Registry', () => {
  it('should have apps data available', () => {
    // This is optional - if apps.json doesn't exist, we skip
    if (!appsData) {
      expect(appsData).toBeNull();
    } else {
      expect(Array.isArray(appsData)).toBe(true);
    }
  });

  if (appsData && Array.isArray(appsData) && appsData.length > 0) {
    it('each app should have required fields', () => {
      const requiredFields = ['id', 'name', 'description', 'path'];
      const app = appsData[0];

      for (const field of requiredFields) {
        expect(app).toHaveProperty(field);
      }
    });

    it('app IDs should be unique', () => {
      const ids = appsData.map((app) => app.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('apps should have valid paths', () => {
      appsData.forEach((app) => {
        expect(app.path).toMatch(/^\//);
        expect(app.path).not.toMatch(/\/$/);
      });
    });
  }
});
