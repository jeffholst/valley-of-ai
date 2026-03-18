import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return Response.json({ error: 'appId is required' }, { status: 400 });
    }

    let logFilePath = null;

    // appId format: YYYY/MM/DD/app-name
    // First, try direct path lookup if appId contains date structure
    if (appId.includes('/')) {
      const publicAppPath = path.join(process.cwd(), 'public', 'apps', appId, 'log.jsonl');
      const sourceAppPath = path.join(process.cwd(), 'apps', appId, 'log.jsonl');

      if (fs.existsSync(publicAppPath)) {
        logFilePath = publicAppPath;
      } else if (fs.existsSync(sourceAppPath)) {
        logFilePath = sourceAppPath;
      }
    }

    // Fallback: search through directory structure if direct lookup failed
    if (!logFilePath) {
      try {
        const publicAppsDir = path.join(process.cwd(), 'public', 'apps');
        const dirs = fs.readdirSync(publicAppsDir);
        for (const year of dirs) {
          const yearPath = path.join(publicAppsDir, year);
          if (!fs.statSync(yearPath).isDirectory()) {
            continue;
          }

          const monthDirs = fs.readdirSync(yearPath);
          for (const month of monthDirs) {
            const monthPath = path.join(yearPath, month);
            if (!fs.statSync(monthPath).isDirectory()) {
              continue;
            }

            const dayDirs = fs.readdirSync(monthPath);
            for (const day of dayDirs) {
              const dayPath = path.join(monthPath, day);
              if (!fs.statSync(dayPath).isDirectory()) {
                continue;
              }

              // Extract just the app name from appId
              const appName = appId.includes('/') ? appId.split('/').pop() : appId;
              const appPath = path.join(dayPath, appName);
              if (fs.existsSync(appPath)) {
                const potentialLogPath = path.join(appPath, 'log.jsonl');
                if (fs.existsSync(potentialLogPath)) {
                  logFilePath = potentialLogPath;
                  break;
                }
              }
            }
            if (logFilePath) {
              break;
            }
          }
          if (logFilePath) {
            break;
          }
        }
      } catch {
        // Continue to check source directory
        console.warn('Public apps directory check skipped');
      }

      // If not found in public, check source apps directory
      if (!logFilePath) {
        try {
          const appsDir = path.join(process.cwd(), 'apps');
          const dirs = fs.readdirSync(appsDir);
          for (const year of dirs) {
            const yearPath = path.join(appsDir, year);
            if (!fs.statSync(yearPath).isDirectory()) {
              continue;
            }

            const monthDirs = fs.readdirSync(yearPath);
            for (const month of monthDirs) {
              const monthPath = path.join(yearPath, month);
              if (!fs.statSync(monthPath).isDirectory()) {
                continue;
              }

              const dayDirs = fs.readdirSync(monthPath);
              for (const day of dayDirs) {
                const dayPath = path.join(monthPath, day);
                if (!fs.statSync(dayPath).isDirectory()) {
                  continue;
                }

                // Extract just the app name from appId
                const appName = appId.includes('/') ? appId.split('/').pop() : appId;
                const appPath = path.join(dayPath, appName);
                if (fs.existsSync(appPath)) {
                  const potentialLogPath = path.join(appPath, 'log.jsonl');
                  if (fs.existsSync(potentialLogPath)) {
                    logFilePath = potentialLogPath;
                    break;
                  }
                }
              }
              if (logFilePath) {
                break;
              }
            }
            if (logFilePath) {
              break;
            }
          }
        } catch {
          // Directory doesn't exist yet
          console.warn('Source apps directory check skipped');
        }
      }
    }

    if (!logFilePath || !fs.existsSync(logFilePath)) {
      return Response.json({ error: 'Log file not found' }, { status: 404 });
    }

    // Read and parse the JSONL file
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
