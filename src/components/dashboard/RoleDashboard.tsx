import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderKanban } from "@/components/pedidos/OrderKanban"
import { OrdersTable } from "@/components/pedidos/OrdersTable"
import { getUserSellerScopeContext, hasAreaAccess, type UserAccessProfile } from "@/lib/access-control"
import { prisma } from "@/lib/prisma"
import { getOrdersDashboardData } from "@/lib/services/orders"
import {
  Briefcase,
  ClipboardList,
  DollarSign,
  Layers,
  Store,
  UserRound,
  Users,
  Wallet,
} from "lucide-react"

type RoleDashboardProps = {
  user: {
    id: string
    name: string
    email: string | null
    username: string
    employeeId?: string | null
  }
  accessProfile: UserAccessProfile
}

const quickLinkDefinitions = [
  { area: "pdv", href: "/pdv", label: "Abrir PDV", icon: Store },
  { area: "customers", href: "/vendas-clientes/clientes", label: "Clientes", icon: Users },
  { area: "orders", href: "/vendas-clientes/pedidos", label: "Pedidos", icon: ClipboardList },
  { area: "kanban", href: "/vendas-clientes/kanban", label: "Kanban", icon: Layers },
  { area: "financial", href: "/financeiro/dashboard", label: "Financeiro", icon: Wallet },
  { area: "hr", href: "/rh/dashboard", label: "RH", icon: Briefcase },
] as const

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function Header({
  title,
  subtitle,
  userName,
}: {
  title: string
  subtitle: string
  userName: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
        Painel personalizado
      </p>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="font-outfit text-4xl font-black uppercase italic tracking-tight text-primary">
            {title}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Usuário conectado</p>
          <p className="mt-2 text-sm font-black uppercase tracking-tight text-slate-900">{userName}</p>
        </div>
      </div>
    </div>
  )
}

function QuickLinks({ accessProfile }: { accessProfile: UserAccessProfile }) {
  const links = quickLinkDefinitions.filter((item) =>
    hasAreaAccess(accessProfile, item.area),
  )

  if (links.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="rounded-[2rem] border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Acesso rápido</p>
                <p className="mt-2 text-sm font-black uppercase tracking-tight text-slate-900">{link.label}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <link.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

async function SalesDashboard({ user, accessProfile }: RoleDashboardProps) {
  const sellerScope = await getUserSellerScopeContext(user, accessProfile)
  const dashboard = await getOrdersDashboardData({
    sellerId: sellerScope.restrictToOwnPortfolio ? sellerScope.sellerId || "__UNLINKED_SELLER__" : undefined,
  })

  return (
    <div className="space-y-8">
      <Header
        title="Operação Comercial"
        subtitle="Visão enxuta para acompanhar carteira, pedidos ativos e movimentação do kanban."
        userName={user.name}
      />
      <QuickLinks accessProfile={accessProfile} />

      {sellerScope.restrictToOwnPortfolio && !sellerScope.sellerLinked ? (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Seu usuário ainda não está vinculado a um vendedor do PDV. Vincule o colaborador ou o vendedor para filtrar apenas sua carteira.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Pedidos ativos</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">
              {dashboard.metrics.activeCount}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Valor em carteira</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">
              {formatCurrency(dashboard.metrics.backlogValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Pedidos atrasados</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">
              {dashboard.metrics.delayedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border border-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase italic tracking-tight text-primary">
            Kanban da carteira
          </CardTitle>
          <CardDescription>Movimente os pedidos dentro do fluxo permitido para o seu perfil.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <OrderKanban
            initialOrders={dashboard.orders}
            currentUserRole={accessProfile.orderFlowRole}
            kanbanMode={accessProfile.kanbanMode}
          />
        </CardContent>
      </Card>

      <Card className="rounded-[2.5rem] border border-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase italic tracking-tight text-primary">
            Lista de pedidos
          </CardTitle>
          <CardDescription>Fila operacional resumida da carteira visível para o seu usuário.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <OrdersTable orders={dashboard.orders} />
        </CardContent>
      </Card>
    </div>
  )
}

async function KanbanDashboard({ user, accessProfile }: RoleDashboardProps) {
  const dashboard = await getOrdersDashboardData()

  return (
    <div className="space-y-8">
      <Header
        title="Kanban de Produção"
        subtitle="Painel focado no fluxo operacional. Seu perfil pode mover apenas as etapas permitidas no quadro."
        userName={user.name}
      />
      <QuickLinks accessProfile={accessProfile} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Aguardando preparo</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">
              {dashboard.summary.waitingPreparation}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Em produção</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">
              {dashboard.summary.inProduction}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Aguardando entrega</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">
              {dashboard.summary.waitingDelivery}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border border-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase italic tracking-tight text-primary">
            Quadro operacional
          </CardTitle>
          <CardDescription>Movimentação restrita às etapas de produção previstas para o seu cargo.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <OrderKanban
            initialOrders={dashboard.orders}
            currentUserRole={accessProfile.orderFlowRole}
            kanbanMode={accessProfile.kanbanMode}
          />
        </CardContent>
      </Card>
    </div>
  )
}

async function HrDashboard({ user, accessProfile }: RoleDashboardProps) {
  const [employees, openJobs, activeCandidates, activeTerminations] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.jobOpening.count({ where: { status: "OPEN" } }),
    prisma.candidate.count({
      where: {
        status: {
          in: ["NEW", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED"],
        },
      },
    }),
    prisma.terminationProcess.count({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
    }),
  ])

  return (
    <div className="space-y-8">
      <Header
        title="Painel de RH"
        subtitle="Acesso exclusivo ao módulo de recursos humanos com atalhos para rotina de pessoas."
        userName={user.name}
      />
      <QuickLinks accessProfile={accessProfile} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Colaboradores ativos</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">{employees}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Vagas abertas</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">{openJobs}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Candidatos ativos</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">{activeCandidates}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Desligamentos em aberto</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">{activeTerminations}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/rh/funcionarios">
          <Button className="h-14 w-full rounded-[1.8rem] text-sm font-black uppercase tracking-[0.12em]">
            <Users className="mr-2 h-4 w-4" /> Abrir funcionários
          </Button>
        </Link>
        <Link href="/rh/ponto">
          <Button variant="outline" className="h-14 w-full rounded-[1.8rem] text-sm font-black uppercase tracking-[0.12em]">
            <Briefcase className="mr-2 h-4 w-4" /> Abrir espelho de ponto
          </Button>
        </Link>
      </div>
    </div>
  )
}

async function FinancialDashboard({ user, accessProfile }: RoleDashboardProps) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [entries, exits, openCashSessions, recentTransactions] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: {
        transactionDate: { gte: monthStart, lte: monthEnd },
        type: "ENTRY",
        status: "CONFIRMED",
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.financialTransaction.aggregate({
      where: {
        transactionDate: { gte: monthStart, lte: monthEnd },
        type: "EXIT",
        status: "CONFIRMED",
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.cashRegisterSession.count({
      where: {
        status: "OPEN",
      },
    }),
    prisma.financialTransaction.count({
      where: {
        transactionDate: { gte: monthStart, lte: monthEnd },
        status: "CONFIRMED",
      },
    }),
  ])

  const totalEntries = entries._sum.amount || 0
  const totalExits = exits._sum.amount || 0

  return (
    <div className="space-y-8">
      <Header
        title="Painel Financeiro"
        subtitle="Leitura rápida da movimentação financeira com atalhos para contas e caixa."
        userName={user.name}
      />
      <QuickLinks accessProfile={accessProfile} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Entradas do mês</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">
              {formatCurrency(totalEntries)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Saídas do mês</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">
              {formatCurrency(totalExits)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Caixas abertos</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">{openCashSessions}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Lançamentos confirmados</p>
            <p className="mt-3 text-3xl font-black italic tracking-tight text-primary">{recentTransactions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/financeiro/contas-a-receber">
          <Button className="h-14 w-full rounded-[1.8rem] text-sm font-black uppercase tracking-[0.12em]">
            <DollarSign className="mr-2 h-4 w-4" /> Contas a receber
          </Button>
        </Link>
        <Link href="/financeiro/contas-a-pagar">
          <Button variant="outline" className="h-14 w-full rounded-[1.8rem] text-sm font-black uppercase tracking-[0.12em]">
            <Wallet className="mr-2 h-4 w-4" /> Contas a pagar
          </Button>
        </Link>
      </div>
    </div>
  )
}

export async function RoleDashboard(props: RoleDashboardProps) {
  switch (props.accessProfile.dashboardVariant) {
    case "sales":
      return <SalesDashboard {...props} />
    case "kanban":
      return <KanbanDashboard {...props} />
    case "hr":
      return <HrDashboard {...props} />
    case "financial":
      return <FinancialDashboard {...props} />
    default:
      return (
        <div className="space-y-8">
          <Header
            title="Painel Operacional"
            subtitle="Use os atalhos abaixo para acessar os módulos liberados para o seu perfil."
            userName={props.user.name}
          />
          <QuickLinks accessProfile={props.accessProfile} />
          <Card className="rounded-[2rem] border border-slate-100">
            <CardContent className="flex items-center gap-4 p-6 text-slate-600">
              <UserRound className="h-6 w-6 text-primary" />
              Seu perfil está com uma configuração personalizada. Os atalhos acima levam apenas aos módulos liberados para o seu acesso.
            </CardContent>
          </Card>
        </div>
      )
  }
}
