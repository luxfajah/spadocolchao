const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function test() {
  try {
    console.log("Testing JobTitles...")
    const jobTitles = await prisma.jobTitle.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
    console.log(`Found ${jobTitles.length} job titles.`)

    console.log("Testing DepartmentRows...")
    const departmentRows = await prisma.employee.findMany({
      where: { department: { not: null } },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    })
    console.log(`Found ${departmentRows.length} department rows.`)

    console.log("Testing FuncionariosRaw...")
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const funcionariosRaw = await prisma.employee.findMany({
      where: {
        AND: [
          {},
          {
            OR: [
              { fullName: { contains: "" } },
              { socialName: { contains: "" } },
              { cpf: { contains: "" } },
              { email: { contains: "" } },
            ],
          },
        ],
      },
      include: {
        jobTitle: true,
        costCenter: true,
        vacations: {
          orderBy: { periodEnd: "desc" },
          take: 1
        },
        notesHistory: {
          where: {
            content: { contains: `[BIRTHDAY_NOTED_${now.getFullYear()}]` }
          },
          take: 1
        }
      },
      orderBy: { fullName: "asc" },
    })
    console.log(`Found ${funcionariosRaw.length} employees.`)
    
    console.log("Success!")
  } catch (error) {
    console.error("Error during test:", error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
