import { prisma } from '../lib/prisma.js'
import type { User } from '../generated/prisma/client.js'

interface UserRepository {
  findByEmail: (email: string)                                 => Promise<User | null>
  findById:    (id: number)                                    => Promise<User | null>
  create:      (data: { email: string; passwordHash: string }) => Promise<User>
}

export const usersRepository: UserRepository = {
  findByEmail: (email) =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id) =>
    prisma.user.findUnique({ where: { id } }),

  create: (data) =>
    prisma.user.create({ data })
}
