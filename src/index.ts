import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middlewares/auth.middleware.js'
import type { AppEnv } from './lib/hono-env.js'
import authRouter         from './routes/auth.routes.js'
import categoriesRouter   from './routes/categories.routes.js'
import transactionsRouter from './routes/transactions.routes.js'

const app = new Hono<AppEnv>()

app.use('*', cors())

app.use('/uploads/*', serveStatic({ root: './' }))

app.use('/categories/*',   authMiddleware)
app.use('/transactions/*', authMiddleware)

// Health check (público)
app.get('/', (c) => c.json({ status: 'ok', message: 'Cashi API — Unidad 3' }))

// Montar routers por recurso
app.route('/auth',         authRouter)
app.route('/categories',   categoriesRouter)
app.route('/transactions', transactionsRouter)

const PORT = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
