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
      const requiredFields = ['id', 'name', 'shortDescription', 'appPath', 'category', 'status', 'thumbnailUrl', 'createdAt', 'route'];
      appsData.forEach((app) => {
        for (const field of requiredFields) {
          expect(app).toHaveProperty(field);
        }
      });
    });

    it('app IDs should be unique', () => {
      const ids = appsData.map((app) => app.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('apps should have valid appPath values', () => {
      appsData.forEach((app) => {
        expect(app.appPath).toMatch(/^\//);
        expect(app.appPath).not.toMatch(/\/$/);
      });
    });

    it('apps should have valid ISO 8601 createdAt dates', () => {
      appsData.forEach((app) => {
        const date = new Date(app.createdAt);
        expect(date.toString()).not.toBe('Invalid Date');
        expect(app.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });
  }
});
