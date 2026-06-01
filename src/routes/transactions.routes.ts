import { Hono } from 'hono'
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBalance,
  uploadReceipt
} from '../controllers/transactions.controller.js'
import type { AppEnv } from '../lib/hono-env.js'

const transactionsRouter = new Hono<AppEnv>()

transactionsRouter.get('/balance',  getBalance)
transactionsRouter.post('/upload',  uploadReceipt)

transactionsRouter.get('/',       getTransactions)
transactionsRouter.get('/:id',    getTransactionById)
transactionsRouter.post('/',      createTransaction)
transactionsRouter.patch('/:id',  updateTransaction)
transactionsRouter.delete('/:id', deleteTransaction)

export default transactionsRouter
