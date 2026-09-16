import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'node:buffer'

// Dev-only middleware that lets `npm run dev` serve api/*.js the same way
// Vercel's serverless functions run in production, so the /reservar flow
// can be tested locally without the Vercel CLI.
function apiDevMiddleware() {
  return {
    name: 'ota-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()

        const [pathname, queryString] = req.url.split('?')
        const fileName = pathname.replace('/api/', '') + '.js'
        const modulePath = new URL(`./api/${fileName}`, import.meta.url).pathname

        let handler
        try {
          const mod = await server.ssrLoadModule(modulePath)
          handler = mod.default
        } catch {
          return next()
        }

        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const rawBody = Buffer.concat(chunks).toString()

        req.query = Object.fromEntries(new URLSearchParams(queryString ?? ''))
        req.body = rawBody ? JSON.parse(rawBody) : undefined

        const response = {
          status(code) {
            res.statusCode = code
            return response
          },
          json(payload) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(payload))
          },
        }

        try {
          await handler(req, response)
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, errors: [err.message] }))
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevMiddleware()],
  build: {
    rollupOptions: {
      output: {
        // Bibliotecas de terceiros mudam muito menos que o site. Separadas,
        // elas ficam no cache do navegador entre um deploy e outro em vez de
        // serem rebaixadas junto com qualquer ajuste de copy.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          swiper: ['swiper', 'swiper/react', 'swiper/modules'],
        },
      },
    },
  },
})
