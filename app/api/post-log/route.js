import fs from 'fs';
import path from 'path';

const SLUG_PATTERN = /^[a-z0-9-]+$/;

function safeResolvePath(base, filename) {
  const resolved = path.resolve(base, filename);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    return null;
  }
  return resolved;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return Response.json({ error: 'slug is required' }, { status: 400 });
    }

    if (!SLUG_PATTERN.test(slug)) {
      return Response.json({ error: 'Invalid slug format' }, { status: 400 });
    }

    const logsBase = path.join(process.cwd(), 'content', 'posts', 'logs');
    const logPath = safeResolvePath(logsBase, `${slug}.jsonl`);

    if (!logPath || !fs.existsSync(logPath)) {
      return Response.json({ error: 'Log file not found' }, { status: 404 });
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const logs = content
      .split('\n')
      .filter((line) => line.trim())
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
    console.error('Error fetching post log:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
