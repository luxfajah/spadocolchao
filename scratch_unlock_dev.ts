import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

const PASSWORD_PREFIX = "scrypt";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${PASSWORD_PREFIX}$${salt}$${hash}`;
}

async function main() {
  const email = 'dev@spadocolchao.com.br';
  const newPassword = 'Loba1507#';
  const newHash = hashPassword(newPassword);

  console.log(`Buscando usuário: ${email}...`);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { username: email }
      ]
    }
  });

  if (!user) {
    console.error(`Usuário ${email} não encontrado.`);
    return;
  }

  console.log(`Usuário encontrado: ${user.username} (ID: ${user.id})`);
  console.log(`Status atual: ${user.status}`);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      blockedAt: null,
      blockedReason: null,
      passwordHash: newHash,
      mustChangePassword: false // Garantindo que não peça troca imediata se não quiserem
    }
  });

  console.log(`Usuário ${updatedUser.username} desbloqueado e senha alterada com sucesso!`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
