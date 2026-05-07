import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { formatDocument } from "@/lib/utils"
import Link from "next/link"
import {
  Plus,
  Users,
  Crown,
  UserRound,
  Building2,
  Handshake,
} from "lucide-react"
import { ClientesListClient } from "./ClientesListClient"
import { Suspense } from "react"

const PAGE_SIZE = 20

type CustomerWithMetrics = {
  id: string
  fullName: string
  tradeName: string | null
  document: string | null
  personType: string
  isActive: boolean
  creditLimit: number | null
  leadSource: {
    name: string
    category: string
  } | null
  addresses: Array<{
    city: string | null
    state: string | null
  }>
  sales: Array<{
    saleDate: Date
  }>
  _count: {
    sales: number
  }
  totalPurchased: number
  purchasesCount: number
  lastPurchaseDate: Date | null
}

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(value?: Date | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "Sem compra confirmada"
}

function getTopCustomer(
  customers: CustomerWithMetrics[],
  predicate?: (customer: CustomerWithMetrics) => boolean
) {
  const eligibleCustomers = predicate ? customers.filter(predicate) : customers

  return eligibleCustomers
    .filter(customer => customer.totalPurchased > 0)
    .sort((left, right) => {
      if (right.totalPurchased !== left.totalPurchased) {
        return right.totalPurchased - left.totalPurchased
      }

      if (right.purchasesCount !== left.purchasesCount) {
        return right.purchasesCount - left.purchasesCount
      }

      return (right.lastPurchaseDate?.getTime() || 0) - (left.lastPurchaseDate?.getTime() || 0)
    })[0] || null
}

export default async function ClientesList({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string; sort?: string }
}) {
  const q = searchParams?.q || ""
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10))
  const sort = searchParams?.sort || "date_desc"
  const skip = (page - 1) * PAGE_SIZE

  // Only filter by name or CPF/CNPJ (as requested)
  const customerWhere = q.trim()
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" as const } },
          { tradeName: { contains: q, mode: "insensitive" as const } },
          { document: { contains: q } },
        ],
      }
    : {}

  // Sort mapping
  const orderBy =
    sort === "alpha_asc"
      ? { fullName: "asc" as const }
      : sort === "date_asc"
        ? { createdAt: "asc" as const }
        : { createdAt: "desc" as const }

  // Parallel: paginated list + total count
  const [clientesBase, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where: customerWhere,
      include: {
        addresses: {
          where: { isMain: true },
          take: 1,
          select: {
            city: true,
            state: true,
          },
        },
        leadSource: {
          select: {
            name: true,
            category: true,
          },
        },
        sales: {
          where: { status: "CONFIRMED" },
          orderBy: { saleDate: "desc" },
          take: 1,
          select: {
            saleDate: true,
          },
        },
        _count: {
          select: {
            sales: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
      orderBy,
      skip,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where: customerWhere }),
  ])

  const customerIds = clientesBase.map(customer => customer.id)

  const salesMetrics = customerIds.length
    ? await prisma.sale.groupBy({
        by: ["customerId"],
        where: {
          status: "CONFIRMED",
          customerId: { in: customerIds },
        },
        _sum: { totalAmount: true },
        _count: { _all: true },
        _max: { saleDate: true },
      })
    : []

  const salesMetricsMap = new Map(
    salesMetrics.map(metric => [
      metric.customerId,
      {
        totalPurchased: metric._sum.totalAmount || 0,
        purchasesCount: metric._count._all,
        lastPurchaseDate: metric._max.saleDate || null,
      },
    ])
  )

  const clientes: CustomerWithMetrics[] = clientesBase.map(customer => {
    const metrics = salesMetricsMap.get(customer.id)

    return {
      ...customer,
      totalPurchased: metrics?.totalPurchased || 0,
      purchasesCount: metrics?.purchasesCount || 0,
      lastPurchaseDate: metrics?.lastPurchaseDate || customer.sales[0]?.saleDate || null,
    }
  })

  // Highlight cards always pull from the full (unpaginated) top customers
  // For performance, load top 100 for the highlights (only when no query filter)
  let highlightCustomers: CustomerWithMetrics[] = clientes
  if (!q.trim()) {
    const topBase = await prisma.customer.findMany({
      include: {
        addresses: { where: { isMain: true }, take: 1, select: { city: true, state: true } },
        leadSource: { select: { name: true, category: true } },
        sales: {
          where: { status: "CONFIRMED" },
          orderBy: { saleDate: "desc" },
          take: 1,
          select: { saleDate: true },
        },
        _count: { select: { sales: { where: { status: "CONFIRMED" } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    const topIds = topBase.map(c => c.id)
    const topMetrics = topIds.length
      ? await prisma.sale.groupBy({
          by: ["customerId"],
          where: { status: "CONFIRMED", customerId: { in: topIds } },
          _sum: { totalAmount: true },
          _count: { _all: true },
          _max: { saleDate: true },
        })
      : []

    const topMetricsMap = new Map(
      topMetrics.map(m => [
        m.customerId,
        {
          totalPurchased: m._sum.totalAmount || 0,
          purchasesCount: m._count._all,
          lastPurchaseDate: m._max.saleDate || null,
        },
      ])
    )

    highlightCustomers = topBase.map(customer => {
      const m = topMetricsMap.get(customer.id)
      return {
        ...customer,
        totalPurchased: m?.totalPurchased || 0,
        purchasesCount: m?.purchasesCount || 0,
        lastPurchaseDate: m?.lastPurchaseDate || customer.sales[0]?.saleDate || null,
      }
    })
  }

  const overallTopCustomer = getTopCustomer(highlightCustomers)
  const pfTopCustomer = getTopCustomer(highlightCustomers, c => c.personType === "INDIVIDUAL")
  const pjTopCustomer = getTopCustomer(highlightCustomers, c => c.personType === "COMPANY")
  const referralTopCustomer = getTopCustomer(
    highlightCustomers,
    c => normalizeText(c.leadSource?.category) === "indicacao"
  )

  const highlightCards = [
    {
      title: "Melhor cliente da base",
      description: "Maior faturamento confirmado entre todos os clientes listados.",
      customer: overallTopCustomer,
      icon: Crown,
      tone: "bg-slate-950 text-white border-slate-900",
      badgeTone: "bg-white/10 text-cyan-200 border-white/10",
    },
    {
      title: "Destaque PF",
      description: "Cliente pessoa física com maior valor acumulado em compras.",
      customer: pfTopCustomer,
      icon: UserRound,
      tone: "bg-emerald-50 text-emerald-950 border-emerald-100",
      badgeTone: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    {
      title: "Destaque PJ",
      description: "Cliente pessoa jurídica com maior geração de receita.",
      customer: pjTopCustomer,
      icon: Building2,
      tone: "bg-sky-50 text-sky-950 border-sky-100",
      badgeTone: "bg-sky-100 text-sky-700 border-sky-200",
    },
    {
      title: "Líder em indicações",
      description: "Cliente de origem indicação com maior resultado comercial.",
      customer: referralTopCustomer,
      icon: Handshake,
      tone: "bg-violet-50 text-violet-950 border-violet-100",
      badgeTone: "bg-violet-100 text-violet-700 border-violet-200",
    },
  ]

  // Serialize dates for client component
  const serializedClientes = clientes.map(c => ({
    ...c,
    lastPurchaseDate: c.lastPurchaseDate ? new Date(c.lastPurchaseDate) : null,
    sales: c.sales.map(s => ({ ...s, saleDate: new Date(s.saleDate) })),
  }))

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Gestão de Clientes"
        subtitle="Administração completa da base de clientes, relacionamento e destaques comerciais."
        icon={<Users className="h-8 w-8" />}
        actions={
          <Link href="/vendas-clientes/clientes/new">
            <Button className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]">
              <Plus className="h-4 w-4" /> Novo Cliente
            </Button>
          </Link>
        }
      />

      {/* Highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
        {highlightCards.map(card => {
          const Icon = card.icon
          const customer = card.customer

          return (
            <div
              key={card.title}
              className={`rounded-[2.4rem] border p-7 shadow-lahomes ${card.tone}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
                    {card.title}
                  </p>
                  <h3 className="text-xl font-black uppercase tracking-tight font-outfit italic">
                    {customer?.fullName || "Sem destaque ainda"}
                  </h3>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-white/70 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 min-h-[2.5rem] text-sm leading-relaxed opacity-80">
                {customer
                  ? `${customer.tradeName || formatDocument(customer.document) || "Cadastro ativo"}`
                  : card.description}
              </p>

              {customer ? (
                <>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${card.badgeTone}`}
                    >
                      {formatCurrency(customer.totalPurchased)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${card.badgeTone}`}
                    >
                      {customer.purchasesCount} compras
                    </Badge>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        Última compra
                      </p>
                      <p className="mt-1 font-black">{formatDate(customer.lastPurchaseDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                        Origem
                      </p>
                      <p className="mt-1 font-black">
                        {customer.leadSource?.name || "Não informada"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-[1.4rem] border border-dashed border-current/15 px-4 py-5 text-sm opacity-70">
                  Nenhum cliente com compra confirmada se encaixa neste recorte.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Live search + table + pagination */}
      <Suspense>
        <ClientesListClient
          initialCustomers={serializedClientes}
          initialQuery={q}
          initialPage={page}
          initialSort={sort}
          totalCount={totalCount}
        />
      </Suspense>
    </main>
  )
}
