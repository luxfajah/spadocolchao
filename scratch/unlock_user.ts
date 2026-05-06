import { PrismaClient } from '@prisma/client'
import { randomBytes, scryptSync } from "crypto"

const prisma = new PrismaClient()

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt$${salt}$${hash}`
}

async function main() {
  const email = 'dev@spadocolchao.com.br'
  const newPassword = 'Loba1507@'
  const newHash = hashPassword(newPassword)

  console.log(`Atualizando usuário: ${email}`)

  const updatedUser = await prisma.user.update({
    where: { email: email },
    data: {
      passwordHash: newHash,
      status: 'ACTIVE',
      blockedAt: null,
      blockedReason: null,
      failedLoginAttempts: 0,
      mustChangePassword: false // Opcional, mas garante acesso imediato
    }
  })

  console.log('Usuário atualizado com sucesso!')
  console.log({
    Nome: updatedUser.name,
    Username: updatedUser.username,
    Email: updatedUser.email,
    Status: updatedUser.status,
    'Tentativas Resetadas': updatedUser.failedLoginAttempts
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Erro ao atualizar usuário:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
