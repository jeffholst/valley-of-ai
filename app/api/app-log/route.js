import fs from 'fs';
import path from 'path';

// Valid appId must be exactly YYYY/MM/DD/slug (slug: lowercase letters, digits, hyphens)
const APP_ID_PATTERN = /^\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/;

function safeResolvePath(base, ...segments) {
  const resolved = path.resolve(base, ...segments);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    return null;
  }
  return resolved;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return Response.json({ error: 'appId is required' }, { status: 400 });
    }

    if (!APP_ID_PATTERN.test(appId)) {
      return Response.json({ error: 'Invalid appId format' }, { status: 400 });
    }

    const cwd = process.cwd();
    const publicBase = path.join(cwd, 'public', 'apps');
    const sourceBase = path.join(cwd, 'apps');

    const publicAppPath = safeResolvePath(publicBase, appId, 'log.jsonl');
    const sourceAppPath = safeResolvePath(sourceBase, appId, 'log.jsonl');

    let logFilePath = null;
    if (publicAppPath && fs.existsSync(publicAppPath)) {
      logFilePath = publicAppPath;
    } else if (sourceAppPath && fs.existsSync(sourceAppPath)) {
      logFilePath = sourceAppPath;
    }

    if (!logFilePath) {
      return Response.json({ error: 'Log file not found' }, { status: 404 });
    }

    const content = fs.readFileSync(logFilePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());
    const logs = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return Response.json(logs);
  } catch (error) {
    console.error('Error fetching log:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
