import { prisma } from '../lib/prisma.js'
import type { CreateTransactionInput, UpdateTransactionInput } from '../schemas/transactions.schema.js'
import type { Transaction, Category } from '../generated/prisma/client.js'

export type TransactionWithCategory = Transaction & {
  category: Category
}

interface TransactionRepository {
  findAll:  ()                                          => Promise<TransactionWithCategory[]>
  findById: (id: number)                                => Promise<TransactionWithCategory | null>
  create:   (data: CreateTransactionInput)              => Promise<TransactionWithCategory>
  update:   (id: number, data: UpdateTransactionInput)  => Promise<TransactionWithCategory>
  remove:   (id: number)                                => Promise<void>
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
    prisma.transaction.delete({ where: { id } }).then(() => undefined)
}
