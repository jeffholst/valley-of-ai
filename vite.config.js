import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const deployVersion = process.env.DEPLOY_VERSION || `${pkg.version}+local`

function appPlaceholderRewritePlugin(gaId, mainSiteUrl, mainSiteName) {
  const rewriteRequest = (req, res, next) => {
    const url = (req.url || '').split('?')[0]

    // Rewrite standalone app HTML files served directly from /apps in local dev/preview.
    if (!url.startsWith('/apps/') || !url.endsWith('/index.html')) return next()

    const filePath = path.join(process.cwd(), url.slice(1))
    if (!existsSync(filePath)) return next()

    const html = readFileSync(filePath, 'utf-8')
      .replaceAll('__GA_MEASUREMENT_ID__', gaId || '__GA_MEASUREMENT_ID__')
      .replaceAll('__MAIN_SITE_URL__', mainSiteUrl || '__MAIN_SITE_URL__')
      .replaceAll('__MAIN_SITE_NAME__', mainSiteName || '__MAIN_SITE_NAME__')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html)
  }

  return {
    name: 'app-placeholder-rewrite',
    transformIndexHtml(html) {
      return html
        .replaceAll('__GA_MEASUREMENT_ID__', gaId || '__GA_MEASUREMENT_ID__')
        .replaceAll('__MAIN_SITE_URL__', mainSiteUrl || '__MAIN_SITE_URL__')
        .replaceAll('__MAIN_SITE_NAME__', mainSiteName || '__MAIN_SITE_NAME__')
    },
    configureServer(server) {
      server.middlewares.use(rewriteRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteRequest)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gaMeasurementId = env.VITE_GA_MEASUREMENT_ID || process.env.VITE_GA_MEASUREMENT_ID || '__GA_MEASUREMENT_ID__'
  const mainSiteUrl = env.VITE_MAIN_SITE_URL || process.env.VITE_MAIN_SITE_URL || 'https://www.valleyofai.com'
  const mainSiteName = env.VITE_MAIN_SITE_NAME || process.env.VITE_MAIN_SITE_NAME || 'Valley of AI'

  return {
    plugins: [react(), appPlaceholderRewritePlugin(gaMeasurementId, mainSiteUrl, mainSiteName)],
    base: '/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __DEPLOY_VERSION__: JSON.stringify(deployVersion),
    },
  }
})
