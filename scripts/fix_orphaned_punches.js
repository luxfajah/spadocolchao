const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- Iniciando Reparo de Batidas Órfãs ---')

  // 1. Buscar batidas sem funcionário
  const orphanedPunches = await prisma.timePunch.findMany({
    where: { employeeId: null },
    select: { id: true, enNo: true }
  })

  console.log(`Encontradas ${orphanedPunches.length} batidas sem vínculo.`)
  if (orphanedPunches.length === 0) return

  // 2. Extrair IDs de máquina únicos
  const uniqueEnNos = Array.from(new Set(orphanedPunches.map(p => p.enNo)))
  const numericIds = uniqueEnNos.filter(id => !isNaN(Number(id))).map(id => parseInt(id))

  console.log(`IDs de máquina únicos para cruzar: ${uniqueEnNos.length}`)

  // 3. Buscar funcionários pelo serialId
  const employees = await prisma.employee.findMany({
    where: { 
      serialId: { in: numericIds }
    },
    select: { id: true, serialId: true }
  })

  console.log(`Encontrados ${employees.length} funcionários correspondentes via serialId.`)

  const empMap = new Map(employees.map(e => [e.serialId.toString(), e.id]))

  // 4. Atualizar as batidas
  let count = 0
  for (const enNo of uniqueEnNos) {
    const employeeId = empMap.get(enNo)
    if (employeeId) {
       const result = await prisma.timePunch.updateMany({
         where: { enNo, employeeId: null },
         data: { employeeId }
       })
       count += result.count
       console.log(`Vinculadas ${result.count} batidas para o ID Máquina ${enNo} -> Funcionario ${employeeId}`)
    }
  }

  console.log(`--- Reparo Concluído: ${count} batidas vinculadas com sucesso ---`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
