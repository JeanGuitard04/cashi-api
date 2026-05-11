import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'Cashi API — Unidad 2' }))

// Los routers de categories y transactions se montan en las fases 1, 2 y 3.

const PORT = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
