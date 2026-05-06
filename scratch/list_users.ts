import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      passwordHash: true,
      status: true
    }
  })

  console.log('--- Usuários do Sistema Spa do Colchão ---')
  console.table(users.map(u => ({
    Nome: u.name,
    Username: u.username,
    Email: u.email,
    'Hash da Senha': u.passwordHash,
    Status: u.status
  })))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
