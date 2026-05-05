import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import {
  Plus,
  Search,
  Edit,
  Eye,
  Users,
  Crown,
  UserRound,
  Building2,
  Handshake,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClickableRow } from "@/components/ui/ClickableRow"
import { formatDocument } from "@/lib/utils"

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
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q || ""
  const normalizedQuery = q.trim()

  const customerWhere = normalizedQuery
    ? {
        OR: [
          { fullName: { contains: normalizedQuery } },
          { tradeName: { contains: normalizedQuery } },
          { document: { contains: normalizedQuery } },
          {
            addresses: {
              some: {
                OR: [
                  { city: { contains: normalizedQuery } },
                  { state: { contains: normalizedQuery } },
                  { street: { contains: normalizedQuery } },
                ],
              },
            },
          },
        ],
      }
    : {}

  const clientesBase = await prisma.customer.findMany({
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
    orderBy: { createdAt: "desc" },
  })

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

  const overallTopCustomer = getTopCustomer(clientes)
  const pfTopCustomer = getTopCustomer(clientes, customer => customer.personType === "INDIVIDUAL")
  const pjTopCustomer = getTopCustomer(clientes, customer => customer.personType === "COMPANY")
  const referralTopCustomer = getTopCustomer(
    clientes,
    customer => normalizeText(customer.leadSource?.category) === "indicacao"
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
                  ? `${customer.tradeName || customer.document || "Cadastro ativo"}`
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

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-lahomes border border-slate-50">
        <form method="GET" className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors font-bold" />
            <Input
              name="q"
              placeholder="Buscar por nome, CPF/CNPJ ou cidade..."
              defaultValue={q}
              className="pl-12 rounded-full border-slate-100 focus-visible:ring-primary h-12 text-sm font-medium shadow-inner bg-slate-50/30"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="rounded-full h-12 px-8 font-bold text-xs uppercase tracking-widest bg-slate-100/50 hover:bg-slate-100 transition-all"
          >
            Pesquisar Base
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">
                  Cliente / Documento
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Localização
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Limite Crédito
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                  Frequência
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Última Compra
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Status
                </TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map(c => {
                const mainAddress = c.addresses[0]
                const lastSale = c.lastPurchaseDate

                return (
                  <ClickableRow
                    key={c.id}
                    href={`/vendas-clientes/clientes/${c.id}`}
                    className="border-slate-50 h-20"
                  >
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-primary uppercase tracking-tight text-sm font-outfit">
                          {c.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                          {formatDocument(c.document) || "SEM DOCUMENTO"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-bold text-xs uppercase tracking-tight">
                      {mainAddress ? `${mainAddress.city} - ${mainAddress.state}` : "---"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-black text-primary font-outfit italic">
                        {c.creditLimit?.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }) || "R$ 0,00"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-slate-50 text-slate-500 font-black text-[10px] uppercase rounded-full border border-slate-100 h-6 px-3"
                      >
                        {c._count.sales} Compras
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-bold text-xs uppercase tracking-tight">
                      {lastSale ? new Date(lastSale).toLocaleDateString("pt-BR") : "Nunca Comprou"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${c.isActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-rose-100 text-rose-500"}`}
                      >
                        {c.isActive ? "Ativo" : "Bloqueado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Link href={`/vendas-clientes/clientes/${c.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-primary bg-slate-50 border border-slate-100 hover:bg-white shadow-sm"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Link href={`/vendas-clientes/clientes/${c.id}/editar`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-slate-400 border border-transparent hover:border-slate-100 hover:bg-white shadow-sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </ClickableRow>
                )
              })}
              {clientes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-40 text-slate-400 font-bold uppercase tracking-widest text-xs"
                  >
                    Nenhum cliente encontrado para sua pesquisa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}
