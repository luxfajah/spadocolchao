import { getEmployeePrimaryName } from "@/lib/employee-name"
import { prisma } from "@/lib/prisma"

type EmployeeSellerCandidate = {
  id: string
  fullName: string
  socialName: string | null
  cpf: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  status: string
  isActive: boolean
  jobTitle: {
    name: string
    department: string | null
    isPdvSellerRole: boolean
    isActive: boolean
  } | null
}

type SellerSnapshot = {
  id: string
  name: string
  type: string
  document: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  defaultCommissionRate: number | null
  employeeId: string | null
  isActive: boolean
}

export type PdvSellerOption = {
  id: string
  name: string
  defaultCommissionRate: number | null
  employeeId: string | null
  jobTitleName: string | null
  type: string
}

const SELLER_ROLE_KEYWORDS = [
  "vendedor",
  "vendedora",
  "vendas",
  "comercial",
  "consultor de vendas",
  "consultora de vendas",
  "representante comercial",
  "promotor de vendas",
]

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function normalizeDocument(value?: string | null) {
  const digits = (value || "").replace(/\D+/g, "")
  return digits || ""
}

function normalizeEmail(value?: string | null) {
  return (value || "").trim().toLowerCase()
}

export function isEmployeeEligibleForPdvSellerRole(employee: Pick<EmployeeSellerCandidate, "jobTitle">) {
  const jobTitle = employee.jobTitle

  if (!jobTitle || !jobTitle.isActive) {
    return false
  }

  if (jobTitle.isPdvSellerRole) {
    return true
  }

  const searchableText = normalizeText(`${jobTitle.name} ${jobTitle.department || ""}`)
  return SELLER_ROLE_KEYWORDS.some(keyword => searchableText.includes(keyword))
}

function buildSellerPayload(employee: EmployeeSellerCandidate) {
  return {
    employeeId: employee.id,
    name: getEmployeePrimaryName(employee),
    type: "INTERNAL",
    document: normalizeDocument(employee.cpf) || null,
    email: employee.email?.trim() || null,
    phone: employee.phone?.trim() || null,
    whatsapp: employee.whatsapp?.trim() || null,
    isActive: employee.isActive && employee.status === "ACTIVE",
  }
}

function shouldUpdateSeller(existingSeller: SellerSnapshot, nextPayload: ReturnType<typeof buildSellerPayload>) {
  return (
    existingSeller.employeeId !== nextPayload.employeeId ||
    existingSeller.name !== nextPayload.name ||
    normalizeDocument(existingSeller.document) !== normalizeDocument(nextPayload.document) ||
    normalizeEmail(existingSeller.email) !== normalizeEmail(nextPayload.email) ||
    (existingSeller.phone || "") !== (nextPayload.phone || "") ||
    (existingSeller.whatsapp || "") !== (nextPayload.whatsapp || "") ||
    existingSeller.type !== nextPayload.type ||
    existingSeller.isActive !== nextPayload.isActive
  )
}

function findMatchingSeller(employee: EmployeeSellerCandidate, sellers: SellerSnapshot[]) {
  const primaryName = normalizeText(getEmployeePrimaryName(employee))
  const legalName = normalizeText(employee.fullName)
  const cpf = normalizeDocument(employee.cpf)
  const email = normalizeEmail(employee.email)

  return (
    sellers.find(seller => seller.employeeId === employee.id) ||
    (cpf ? sellers.find(seller => normalizeDocument(seller.document) === cpf) : null) ||
    (email
      ? sellers.find(
          seller =>
            normalizeEmail(seller.email) === email &&
            (seller.type === "INTERNAL" || !seller.type)
        )
      : null) ||
    sellers.find(seller => {
      const sellerName = normalizeText(seller.name)
      if (seller.type !== "INTERNAL" && seller.employeeId !== employee.id) {
        return false
      }

      return sellerName === primaryName || (!!legalName && sellerName === legalName)
    }) ||
    null
  )
}

export async function syncPdvSellersFromEmployees() {
  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      jobTitle: {
        is: {
          isActive: true,
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      socialName: true,
      cpf: true,
      email: true,
      phone: true,
      whatsapp: true,
      status: true,
      isActive: true,
      jobTitle: {
        select: {
          name: true,
          department: true,
          isPdvSellerRole: true,
          isActive: true,
        },
      },
    },
  })

  const eligibleEmployees = employees.filter(
    employee =>
      employee.status === "ACTIVE" && isEmployeeEligibleForPdvSellerRole(employee)
  )

  const existingSellers = await prisma.seller.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      document: true,
      email: true,
      phone: true,
      whatsapp: true,
      defaultCommissionRate: true,
      employeeId: true,
      isActive: true,
    },
  })

  const mutableSellerList = [...existingSellers]

  for (const employee of eligibleEmployees) {
    const payload = buildSellerPayload(employee)
    const matchedSeller = findMatchingSeller(employee, mutableSellerList)

    if (matchedSeller) {
      if (shouldUpdateSeller(matchedSeller, payload)) {
        await prisma.seller.update({
          where: { id: matchedSeller.id },
          data: payload,
        })

        Object.assign(matchedSeller, payload)
      }

      continue
    }

    const createdSeller = await prisma.seller.create({
      data: payload,
      select: {
        id: true,
        name: true,
        type: true,
        document: true,
        email: true,
        phone: true,
        whatsapp: true,
        defaultCommissionRate: true,
        employeeId: true,
        isActive: true,
      },
    })

    mutableSellerList.push(createdSeller)
  }

  return eligibleEmployees
}

export async function getPdvSellerOptions(): Promise<PdvSellerOption[]> {
  const eligibleEmployees = await syncPdvSellersFromEmployees()
  const eligibleEmployeeIds = eligibleEmployees.map(employee => employee.id)

  const sellers = await prisma.seller.findMany({
    where: {
      isActive: true,
      OR: [
        ...(eligibleEmployeeIds.length > 0
          ? [{ employeeId: { in: eligibleEmployeeIds } }]
          : []),
        {
          NOT: {
            type: "INTERNAL",
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      type: true,
      defaultCommissionRate: true,
      employeeId: true,
      employee: {
        select: {
          fullName: true,
          socialName: true,
          jobTitle: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })

  return sellers.map(seller => ({
    id: seller.id,
    name: seller.employee ? getEmployeePrimaryName(seller.employee) : seller.name,
    defaultCommissionRate: seller.defaultCommissionRate ?? null,
    employeeId: seller.employeeId,
    jobTitleName: seller.employee?.jobTitle?.name || null,
    type: seller.type,
  }))
}
