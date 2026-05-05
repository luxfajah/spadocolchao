import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Plus, 
  Edit, 
  Eye, 
  Users, 
  Cake, 
  CalendarClock, 
  Palmtree, 
  Phone, 
  MessageSquare, 
  Mail, 
  Briefcase, 
  Building2, 
  Clock, 
  Calendar,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { formatDocument } from "@/lib/utils"
import { EmployeeSearch } from "./components/EmployeeSearch"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BirthdayDialog } from "./components/BirthdayDialog"
import { 
  format, 
  differenceInDays, 
  getMonth, 
  differenceInMonths, 
  addMonths,
  addDays,
  isBefore,
  isAfter
} from "date-fns"
import { ptBR } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function FuncionariosList({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const q = typeof searchParams?.q === 'string' ? searchParams.q : ""
  const jobTitleId = typeof searchParams?.jobTitleId === 'string' ? searchParams.jobTitleId : ""
  const department = typeof searchParams?.department === 'string' ? searchParams.department : ""

  const now = new Date()
  const currentMonth = getMonth(now)

  try {
    const [jobTitles, departmentRows, funcionariosRaw] = await Promise.all([
      prisma.jobTitle.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.employee.findMany({
        where: { department: { not: null } },
        select: { department: true },
        distinct: ["department"],
        orderBy: { department: "asc" },
      }),
      prisma.employee.findMany({
        where: {
          AND: [
            ...(q
              ? [{
                  OR: [
                    { fullName: { contains: q, mode: "insensitive" as any } },
                    { socialName: { contains: q, mode: "insensitive" as any } },
                    { cpf: { contains: q, mode: "insensitive" as any } },
                    { email: { contains: q, mode: "insensitive" as any } },
                  ],
                }]
              : []),
            ...(jobTitleId ? [{ jobTitleId }] : []),
            ...(department ? [{ department }] : []),
          ],
        },
        include: {
          jobTitle: true,
          costCenter: true,
          workSchedule: true,
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
      }),
    ])

    // Processamento de dados enriquecidos para o RH
    const funcionariosItems = funcionariosRaw.map(f => {
      // Só é considerado aniversariante pendente se não houver nota de processamento este ano
      const isBirthdayMonth = f.birthDate ? getMonth(f.birthDate) === currentMonth : false
      const isBirthdayPending = isBirthdayMonth && f.notesHistory.length === 0
      
      // Lógica de Experiência (45 e 90 dias)
      let experienceStatus = null
      if (f.admissionDate && f.status === 'ACTIVE') {
        const daysSinceAdmission = differenceInDays(now, f.admissionDate)
        if (daysSinceAdmission >= 38 && daysSinceAdmission <= 45) experienceStatus = "45 DIAS"
        else if (daysSinceAdmission >= 83 && daysSinceAdmission <= 90) experienceStatus = "90 DIAS"
        else if (daysSinceAdmission > 90) experienceStatus = "EFETIVADO"
      }

      // Lógica de Férias Vencidas (Simplificada)
      let hasExpiredVacations = false
      if (f.admissionDate && f.status === 'ACTIVE') {
        const monthsSinceAdmission = differenceInMonths(now, f.admissionDate)
        if (monthsSinceAdmission >= 22) { 
          const lastVacation = f.vacations[0]
          if (!lastVacation || (lastVacation.status !== 'TAKEN' && isBefore(lastVacation.periodEnd, now))) {
            hasExpiredVacations = true
          }
        }
      }

      return {
        ...f,
        isBirthdayMonth,
        isBirthdayPending,
        experienceStatus,
        hasExpiredVacations,
        timeAtCompany: f.admissionDate ? format(f.admissionDate, "PPP", { locale: ptBR }) : "---",
        initials: (f.socialName || f.fullName || "??").split(" ").map(n => n[0] || "").join("").substring(0, 2).toUpperCase()
      }
    })

  const departments = departmentRows
    .map(item => item.department)
    .filter((item): item is string => Boolean(item))

  // Métricas para o Spotlight
  const metrics = {
    total: funcionariosRaw.length,
    active: funcionariosRaw.filter(f => f.status === 'ACTIVE').length,
    birthdays: funcionariosItems.filter(f => f.isBirthdayPending).length,
    expiringContracts: funcionariosItems.filter(f => f.experienceStatus === "45 DIAS" || f.experienceStatus === "90 DIAS").length,
    expiredVacations: funcionariosItems.filter(f => f.hasExpiredVacations).length
  }

  const birthdayEmployees = funcionariosItems
    .filter(f => f.isBirthdayPending)
    .map(f => ({
      id: f.id,
      fullName: f.fullName,
      socialName: f.socialName,
      birthDate: f.birthDate,
      photoUrl: f.photoUrl,
      initials: f.initials
    }))

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Gestão de Funcionários"
        subtitle="BASE DE TALENTOS DA EMPRESA. CONTROLE DE CARGOS, JORNADAS, CONTRATOS E ALERTAS OPERACIONAIS."
        icon={<Users className="h-8 w-8 text-blue-600" />}
        actions={
          <div className="flex gap-3">
             <Link href="/rh/funcionarios/novo">
              <Button className="rounded-full gap-2 bg-slate-900 hover:bg-black text-white shadow-lg transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.14em]">
                <Plus className="h-4 w-4" /> Novo Funcionário
              </Button>
            </Link>
          </div>
        }
      />

      {/* Spotlight Section */}
      <section className="relative overflow-hidden rounded-[2.75rem] border-0 bg-slate-950 text-white shadow-[0_36px_90px_-48px_rgba(15,23,42,0.85)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_36%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.94),_rgba(15,23,42,0.82))]" />
        
        <CardContent className="relative p-8 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1fr_auto] xl:items-center">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-100">
                Resumo Operacional de Pessoal
              </span>
              <div className="space-y-4">
                <h2 className="max-w-3xl font-outfit text-4xl font-black uppercase italic tracking-tight md:text-5xl">
                   Sua equipe em um relance estratégico.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  Acompanhe aniversariantes do mês, contratos de experiência vencendo e alertas de férias acumuladas. 
                  O RH proativo começa com dados claros e acessíveis.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-full py-1.5 px-4 font-black text-[10px] uppercase tracking-widest">
                  {metrics.active} Colaboradores Ativos
                </Badge>
                {metrics.birthdays > 0 && (
                  <BirthdayDialog 
                    employees={birthdayEmployees}
                    trigger={
                      <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/20 rounded-full py-1.5 px-4 font-black text-[10px] uppercase tracking-widest gap-2 cursor-pointer hover:bg-pink-500/20 transition-all">
                        <Cake className="h-3 w-3" /> {metrics.birthdays} Aniversariantes
                      </Badge>
                    }
                  />
                )}
                {metrics.expiredVacations > 0 && (
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 rounded-full py-1.5 px-4 font-black text-[10px] uppercase tracking-widest gap-2">
                    <AlertCircle className="h-3 w-3" /> {metrics.expiredVacations} Férias Vencidas
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
               <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm min-w-[220px]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contratos</p>
                <p className="mt-3 text-2xl font-black italic tracking-tight text-white">{metrics.expiringContracts}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">experiência vencendo</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm min-w-[220px]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Geral</p>
                <p className="mt-3 text-2xl font-black italic tracking-tight text-white">{metrics.total}</p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">colaboradores na base</p>
              </div>
            </div>
          </div>
        </CardContent>
      </section>

      {/* Filtros e Busca */}
      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-lahomes border border-slate-50">
        <div className="flex-1 w-full">
           <EmployeeSearch jobTitles={jobTitles} departments={departments} />
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {funcionariosItems.map((f) => (
          <Link key={f.id} href={`/rh/funcionarios/${f.id}`} className="group h-full">
            <Card className="relative h-full overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-lahomes transition-all duration-500 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl">
              <div className={`absolute top-0 right-0 h-32 w-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-colors duration-500 ${
                f.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
              
              <CardContent className="relative p-7 space-y-6">
                {/* Header do Card: Avatar e Identificação */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16 rounded-[1.25rem] border-2 border-white shadow-md">
                      <AvatarImage src={f.photoUrl || ""} alt={f.fullName} />
                      <AvatarFallback className="bg-slate-100 text-slate-500 font-black text-xl">{f.initials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 mt-1">
                      <h3 className="font-outfit font-black text-lg text-slate-900 leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">
                        {f.socialName || f.fullName}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        #{f.serialId?.toString().padStart(4, '0') ?? "----"} • {formatDocument(f.cpf) || "SEM CPF"}
                      </p>
                    </div>
                  </div>
                  <Badge className={`rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest border-none ${
                    f.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 
                    f.status === 'VACATION' ? 'bg-amber-50 text-amber-600' :
                    f.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-600' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {f.status === 'ACTIVE' ? 'Ativo' :
                     f.status === 'VACATION' ? 'Em Férias' :
                     f.status === 'SUSPENDED' ? 'Afastado' : 'Inativo'}
                  </Badge>
                </div>

                {/* Info de Trabalho */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50">
                    <div className="h-9 w-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary border border-slate-100">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo</span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">
                        {f.jobTitle?.name || "NÃO DEFINIDO"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50">
                    <div className="h-9 w-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 border border-slate-100">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento</span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">
                        {f.department || "INDIFERIDO"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alertas e Datas Especiais */}
                <div className="flex flex-wrap gap-2">
                  {f.isBirthdayMonth && (
                    <Badge className="bg-pink-50 text-pink-600 border-pink-100 rounded-full py-1 px-3 font-black text-[9px] uppercase tracking-tighter gap-1.5 shadow-sm">
                      <Cake className="h-3.5 w-3.5" /> Aniversariante
                    </Badge>
                  )}
                  {f.experienceStatus && (f.experienceStatus === "45 DIAS" || f.experienceStatus === "90 DIAS") && (
                    <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-full py-1 px-3 font-black text-[9px] uppercase tracking-tighter gap-1.5 shadow-sm">
                      <CalendarClock className="h-3.5 w-3.5" /> {f.experienceStatus} VENCENDO
                    </Badge>
                  )}
                  {f.hasExpiredVacations && (
                    <Badge className="bg-rose-50 text-rose-600 border-rose-100 rounded-full py-1 px-3 font-black text-[9px] uppercase tracking-tighter gap-1.5 shadow-sm">
                      <Palmtree className="h-3.5 w-3.5" /> Férias Acumuladas
                    </Badge>
                  )}
                  {!f.isBirthdayMonth && !f.experienceStatus && !f.hasExpiredVacations && (
                     <Badge className="bg-slate-50 text-slate-400 border-slate-100 rounded-full py-1 px-3 font-black text-[9px] uppercase tracking-tighter gap-1.5">
                        <CheckCircle className="h-3 w-3" /> Ficha Atualizada
                     </Badge>
                  )}
                </div>

                {/* Quick Actions & Contact */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100/80">
                  <div className="flex gap-1.5">
                    {f.phone && (
                       <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 text-slate-400 hover:text-emerald-500">
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {f.whatsapp && (
                       <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 text-slate-400 hover:text-emerald-600">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                    {f.email && (
                       <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-white border border-slate-100 text-slate-400 hover:text-blue-500">
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-900 border-slate-800 text-white hover:bg-black transition-all group-hover:px-10 group-hover:w-auto overflow-hidden relative">
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all group-hover:opacity-0">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                       Ver Perfil
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {funcionariosItems.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300">
            <Users className="h-10 w-10" />
          </div>
          <div className="space-y-1">
             <h3 className="font-outfit font-black text-xl text-slate-900 uppercase">Nenhum colaborador encontrado</h3>
             <p className="text-sm text-slate-500">Tente ajustar seus filtros para encontrar quem procura.</p>
          </div>
          <Button variant="outline" className="rounded-full h-11 px-8 font-black text-[10px] uppercase tracking-widest mt-4" onClick={() => window.location.href = '/rh/funcionarios'}>
             Limpar Filtros
          </Button>
        </div>
      )}
    </main>
    )
  } catch (error) {
    console.error("Erro ao carregar lista de funcionários:", error)
    return (
      <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-[2.5rem] p-10 text-center">
          <h2 className="text-2xl font-black text-rose-700 uppercase font-outfit mb-4">Erro ao carregar dados</h2>
          <p className="text-rose-600 font-medium mb-6">
            Não foi possível carregar a lista de funcionários. Verifique a conexão com o banco de dados.
          </p>
          <pre className="bg-white/50 p-4 rounded-xl text-[10px] text-rose-500 overflow-x-auto text-left">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </main>
    )
  }
}
