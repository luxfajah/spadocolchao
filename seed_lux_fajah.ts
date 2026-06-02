// Script: criar/vincular Lux Fajah como funcionária e vendedora
// Executar: npx tsx seed_lux_fajah.ts

import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Buscando usuário Lux Fajah...")

  // 1. Buscar o User pelo username ou nome
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { contains: "lux", mode: "insensitive" } },
        { name: { contains: "Lux", mode: "insensitive" } },
      ],
    },
  })

  if (!user) {
    console.error("❌ Usuário não encontrado. Verifique o nome/username.")
    return
  }

  console.log(`✅ Usuário encontrado: ${user.name} (id: ${user.id})`)

  // 2. Garantir que o JobTitle "Gerente Administrativo(a)" existe com isPdvSellerRole: true
  let jobTitle = await prisma.jobTitle.findFirst({
    where: { name: { contains: "Gerente", mode: "insensitive" } },
  })

  if (!jobTitle) {
    jobTitle = await prisma.jobTitle.create({
      data: {
        name: "Gerente Administrativo",
        department: "Administração",
        isPdvSellerRole: true,
        isActive: true,
      },
    })
    console.log(`✅ Cargo criado: ${jobTitle.name}`)
  } else {
    // Garantir que pode ser vendedor no PDV
    if (!jobTitle.isPdvSellerRole) {
      jobTitle = await prisma.jobTitle.update({
        where: { id: jobTitle.id },
        data: { isPdvSellerRole: true },
      })
      console.log(`✅ Cargo atualizado para isPdvSellerRole: ${jobTitle.name}`)
    } else {
      console.log(`✅ Cargo já existe: ${jobTitle.name}`)
    }
  }

  // 3. Verificar se já existe Employee vinculado ao user
  let employee = user.employeeId
    ? await prisma.employee.findUnique({ where: { id: user.employeeId } })
    : null

  if (!employee) {
    // Tentar achar por nome
    employee = await prisma.employee.findFirst({
      where: { fullName: { contains: "Lux", mode: "insensitive" } },
    })
  }

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        fullName: user.name,
        socialName: user.name,
        email: user.email,
        phone: user.phone,
        status: "ACTIVE",
        isActive: true,
        jobTitleId: jobTitle.id,
      },
    })
    console.log(`✅ Funcionária criada: ${employee.fullName} (id: ${employee.id})`)
  } else {
    // Atualizar o cargo se necessário
    if (employee.jobTitleId !== jobTitle.id) {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: { jobTitleId: jobTitle.id, isActive: true, status: "ACTIVE" },
      })
    }
    console.log(`✅ Funcionária já existe: ${employee.fullName}`)
  }

  // 4. Vincular o Employee ao User (se ainda não estiver)
  if (user.employeeId !== employee.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { employeeId: employee.id },
    })
    console.log(`✅ Usuário vinculado ao Employee`)
  }

  // 5. Garantir que existe um Seller vinculado a esse Employee
  let seller = await prisma.seller.findFirst({
    where: { employeeId: employee.id },
  })

  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        name: user.name,
        type: "INTERNAL",
        email: user.email,
        phone: user.phone,
        employeeId: employee.id,
        isActive: true,
        defaultCommissionRate: 5.0,
      },
    })
    console.log(`✅ Seller criado: ${seller.name} (id: ${seller.id})`)
  } else {
    if (!seller.isActive) {
      await prisma.seller.update({ where: { id: seller.id }, data: { isActive: true } })
    }
    console.log(`✅ Seller já existe: ${seller.name} (id: ${seller.id})`)
  }

  console.log("\n🎉 Configuração concluída com sucesso!")
  console.log(`   Employee: ${employee.id}`)
  console.log(`   Seller:   ${seller.id}`)
  console.log(`   Cargo:    ${jobTitle.name} (isPdvSellerRole: ${jobTitle.isPdvSellerRole})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
