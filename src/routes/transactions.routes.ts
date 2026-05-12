import { Hono } from 'hono'
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBalance
} from '../controllers/transactions.controller.js'

const transactionsRouter = new Hono()

transactionsRouter.get('/balance', getBalance)

transactionsRouter.get('/',       getTransactions)
transactionsRouter.get('/:id',    getTransactionById)
transactionsRouter.post('/',      createTransaction)
transactionsRouter.patch('/:id',  updateTransaction)
transactionsRouter.delete('/:id', deleteTransaction)

export default transactionsRouter
