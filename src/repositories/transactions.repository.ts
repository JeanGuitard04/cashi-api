import { prisma } from '../lib/prisma.js'
import type { CreateTransactionInput, UpdateTransactionInput } from '../schemas/transactions.schema.js'
import type { Transaction, Category, TransactionType } from '../generated/prisma/client.js'

export type TransactionWithCategory = Transaction & {
  category: Category
}

export type SumByType = Array<{ type: TransactionType; total: number }>

export type CreateTransactionData = CreateTransactionInput & { userId: number }

interface TransactionRepository {
  findAllByUser: (userId: number)                            => Promise<TransactionWithCategory[]>
  findById:      (id: number)                                => Promise<TransactionWithCategory | null>
  create:        (data: CreateTransactionData)               => Promise<TransactionWithCategory>
  update:        (id: number, data: UpdateTransactionInput)  => Promise<TransactionWithCategory>
  remove:        (id: number)                                => Promise<void>
  sumByTypeForUser: (userId: number)                         => Promise<SumByType>
}

const transactionInclude = { category: true } as const

export const transactionsRepository: TransactionRepository = {
  findAllByUser: (userId) =>
    prisma.transaction.findMany({ where: { userId }, include: transactionInclude }),

  findById: (id) =>
    prisma.transaction.findUnique({ where: { id }, include: transactionInclude }),

  create: (data) =>
    prisma.transaction.create({ data, include: transactionInclude }),

  update: (id, data) =>
    prisma.transaction.update({ where: { id }, data, include: transactionInclude }),

  remove: (id) =>
    prisma.transaction.delete({ where: { id } }).then(() => undefined),

  sumByTypeForUser: async (userId) => {
    const rows = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true }
    })
    return rows.map(r => ({ type: r.type, total: r._sum.amount ?? 0 }))
  }
}
