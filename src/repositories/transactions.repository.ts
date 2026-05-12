import { prisma } from '../lib/prisma.js'
import type { CreateTransactionInput, UpdateTransactionInput } from '../schemas/transactions.schema.js'
import type { Transaction, Category, TransactionType } from '../generated/prisma/client.js'

export type TransactionWithCategory = Transaction & {
  category: Category
}

export type SumByType = Array<{ type: TransactionType; total: number }>

interface TransactionRepository {
  findAll:   ()                                          => Promise<TransactionWithCategory[]>
  findById:  (id: number)                                => Promise<TransactionWithCategory | null>
  create:    (data: CreateTransactionInput)              => Promise<TransactionWithCategory>
  update:    (id: number, data: UpdateTransactionInput)  => Promise<TransactionWithCategory>
  remove:    (id: number)                                => Promise<void>
  sumByType: ()                                          => Promise<SumByType>
}

const transactionInclude = { category: true } as const

export const transactionsRepository: TransactionRepository = {
  findAll: () =>
    prisma.transaction.findMany({ include: transactionInclude }),

  findById: (id) =>
    prisma.transaction.findUnique({ where: { id }, include: transactionInclude }),

  create: (data) =>
    prisma.transaction.create({ data, include: transactionInclude }),

  update: (id, data) =>
    prisma.transaction.update({ where: { id }, data, include: transactionInclude }),

  remove: (id) =>
    prisma.transaction.delete({ where: { id } }).then(() => undefined),

  sumByType: async () => {
    const rows = await prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true }
    })
    return rows.map(r => ({ type: r.type, total: r._sum.amount ?? 0 }))
  }
}
