import type { MiddlewareHandler } from 'hono'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken'
import type { AppEnv } from '../lib/hono-env.js'

const { verify } = jwt

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Token requerido' }, 401)
  }

  const token = authHeader.slice(7).trim()
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return c.json({ error: 'JWT_SECRET no configurado' }, 500)
  }

  try {
    const payload = verify(token, secret) as JwtPayload
    const userId = Number(payload.sub)
    if (!userId || Number.isNaN(userId)) {
      return c.json({ error: 'Token inválido' }, 401)
    }
    c.set('userId', userId)
    await next()
  } catch {
    return c.json({ error: 'Token inválido o expirado' }, 401)
  }
}
