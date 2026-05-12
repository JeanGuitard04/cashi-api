import * as z from 'zod'

export const createTransactionSchema = z.object({
  amount:      z.number().int().positive(),
  type:        z.enum(['income', 'expense']),
  description: z.string().max(255).optional(),
  date:        z.coerce.date(),
  categoryId:  z.number().int().positive()
})

export const updateTransactionSchema = z.object({
  amount:      z.number().int().positive().optional(),
  type:        z.enum(['income', 'expense']).optional(),
  description: z.string().max(255).optional(),
  date:        z.coerce.date().optional(),
  categoryId:  z.number().int().positive().optional()
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
