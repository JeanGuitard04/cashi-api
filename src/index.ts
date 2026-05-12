import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import categoriesRouter   from './routes/categories.routes.js'
import transactionsRouter from './routes/transactions.routes.js'

const app = new Hono()

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'Cashi API — Unidad 2' }))

// Montar routers por recurso
app.route('/categories',   categoriesRouter)
app.route('/transactions', transactionsRouter)

const PORT = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
