import type { Context } from 'hono'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { usersRepository } from '../repositories/users.repository.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { parsePrismaError } from '../lib/prisma-error.js'

const SALT_ROUNDS = 10
const { sign } = jwt

const issueToken = (userId: number): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET no está definida')
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  return sign({ sub: String(userId) }, secret, { expiresIn } as jwt.SignOptions)
}

// POST /auth/register
export const register = async (c: Context) => {
  const body = await c.req.json()
  const result = registerSchema.safeParse(body)
  if (!result.success) return c.json({ errors: result.error.issues }, 400)

  const passwordHash = await bcrypt.hash(result.data.password, SALT_ROUNDS)
  try {
    const user = await usersRepository.create({
      email: result.data.email,
      passwordHash
    })
    const token = issueToken(user.id)
    return c.json({ token, user: { id: user.id, email: user.email } }, 201)
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}

// POST /auth/login
export const login = async (c: Context) => {
  const body = await c.req.json()
  const result = loginSchema.safeParse(body)
  if (!result.success) return c.json({ errors: result.error.issues }, 400)

  // Mismo mensaje para "email no existe" y "password incorrecta" — no revelar qué emails están registrados
  const user = await usersRepository.findByEmail(result.data.email)
  if (!user) return c.json({ error: 'Credenciales inválidas' }, 401)

  const valid = await bcrypt.compare(result.data.password, user.passwordHash)
  if (!valid) return c.json({ error: 'Credenciales inválidas' }, 401)

  const token = issueToken(user.id)
  return c.json({ token, user: { id: user.id, email: user.email } })
}
