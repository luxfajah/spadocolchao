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
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-10">Funcionários ({funcionariosItems.length})</h1>
        <div className="space-y-4">
          {funcionariosItems.map(f => (
            <div key={f.id} className="p-4 border rounded-xl bg-white shadow-sm">
              <p className="font-bold">{f.fullName}</p>
              <p className="text-sm text-slate-500">{f.jobTitle?.name || "Sem cargo"}</p>
              <p className="text-xs text-slate-400">ID: {f.serialId ?? "---"}</p>
            </div>
          ))}
        </div>
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
