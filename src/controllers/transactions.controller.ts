import type { Context } from 'hono'
import { transactionsRepository } from '../repositories/transactions.repository.js'
import {
  createTransactionSchema,
  updateTransactionSchema
} from '../schemas/transactions.schema.js'
import { parsePrismaError } from '../lib/prisma-error.js'
import { uploadFile } from '../lib/upload.js'
import type { AppEnv } from '../lib/hono-env.js'

type Ctx = Context<AppEnv>

// POST /transactions/upload — recibe multipart/form-data con campo "receipt", devuelve { url }
export const uploadReceipt = async (c: Ctx) => {
  const body = await c.req.parseBody()
  const file = body.receipt as File | undefined
  const result = await uploadFile(file)
  if (!result.ok) return c.json({ error: result.error }, result.status)
  return c.json({ url: result.url })
}

// GET /transactions
export const getTransactions = async (c: Ctx) => {
  const userId = c.get('userId')
  const transactions = await transactionsRepository.findAllByUser(userId)
  return c.json(transactions)
}

// GET /transactions/balance
export const getBalance = async (c: Ctx) => {
  const userId = c.get('userId')
  const sums = await transactionsRepository.sumByTypeForUser(userId)
  const totalIncome  = sums.find(s => s.type === 'income')?.total  ?? 0
  const totalExpense = sums.find(s => s.type === 'expense')?.total ?? 0
  const balance = totalIncome - totalExpense
  return c.json({ totalIncome, totalExpense, balance })
}

// GET /transactions/:id
export const getTransactionById = async (c: Ctx) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const transaction = await transactionsRepository.findById(id)
  if (!transaction) return c.json({ error: 'Transacción no encontrada' }, 404)
  if (transaction.userId !== userId) return c.json({ error: 'No autorizado' }, 403)
  return c.json(transaction)
}

// POST /transactions — userId NO viene del body; se toma del token.
export const createTransaction = async (c: Ctx) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const result = createTransactionSchema.safeParse(body)
  if (!result.success) return c.json({ errors: result.error.issues }, 400)
  try {
    const transaction = await transactionsRepository.create({ ...result.data, userId })
    return c.json(transaction, 201)
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}

// PATCH /transactions/:id — ownership check ANTES de modificar.
export const updateTransaction = async (c: Ctx) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const result = updateTransactionSchema.safeParse(body)
  if (!result.success) return c.json({ errors: result.error.issues }, 400)

  const existing = await transactionsRepository.findById(id)
  if (!existing) return c.json({ error: 'Transacción no encontrada' }, 404)
  if (existing.userId !== userId) return c.json({ error: 'No autorizado' }, 403)

  try {
    const transaction = await transactionsRepository.update(id, result.data)
    return c.json(transaction)
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}

// DELETE /transactions/:id — ownership check ANTES de borrar.
export const deleteTransaction = async (c: Ctx) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))

  const existing = await transactionsRepository.findById(id)
  if (!existing) return c.json({ error: 'Transacción no encontrada' }, 404)
  if (existing.userId !== userId) return c.json({ error: 'No autorizado' }, 403)

  try {
    await transactionsRepository.remove(id)
    return c.json({ message: 'Transacción eliminada' })
  } catch (error) {
    const { status, message } = parsePrismaError(error)
    return c.json({ error: message }, status)
  }
}
