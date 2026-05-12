import { Hono } from 'hono'
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transactions.controller.js'

const transactionsRouter = new Hono()

transactionsRouter.get('/',       getTransactions)
transactionsRouter.get('/:id',    getTransactionById)
transactionsRouter.post('/',      createTransaction)
transactionsRouter.patch('/:id',  updateTransaction)
transactionsRouter.delete('/:id', deleteTransaction)

export default transactionsRouter
