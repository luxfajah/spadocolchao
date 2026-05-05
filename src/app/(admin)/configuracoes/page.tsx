import Link from "next/link"
import {
  ArrowRight,
  BellRing,
  Building2,
  FileClock,
  Fingerprint,
  Hash,
  Printer,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react"
import { ConfigSection, ConfigShell } from "@/components/configuracoes/ConfigShell"
import { Card, CardContent } from "@/components/ui/card"
import { getConfigurationHubData } from "@/lib/configuration-queries"

const spotlightModuleDefinitions = [
  {
    title: "Usuários",
    href: "/configuracoes/usuarios",
    description: "Cadastro, status, vínculos, sessões e segurança por usuário.",
    icon: Users,
    eyebrow: "Equipe",
    accentClass: "from-blue-600/18 via-cyan-500/10 to-white",
    iconClass: "bg-blue-600 text-white",
  },
  {
    title: "Perfis de Acesso",
    href: "/configuracoes/perfis-de-acesso",
    description: "Perfis padrão, duplicação, ativação e matriz por perfil.",
    icon: ShieldCheck,
    eyebrow: "Governança",
    accentClass: "from-emerald-500/18 via-teal-400/10 to-white",
    iconClass: "bg-emerald-600 text-white",
  },
  {
    title: "Permissões",
    href: "/configuracoes/permissoes",
    description: "Motor por módulo e ação com sobrescrita por usuário.",
    icon: Fingerprint,
    eyebrow: "Regras",
    accentClass: "from-amber-500/18 via-orange-400/10 to-white",
    iconClass: "bg-amber-500 text-slate-950",
  },
  {
    title: "Numeração",
    href: "/configuracoes/numeracao",
    description: "Sequências automáticas por documento e tipo operacional.",
    icon: Hash,
    eyebrow: "Documentos",
    accentClass: "from-violet-500/18 via-fuchsia-400/10 to-white",
    iconClass: "bg-violet-600 text-white",
  },
  {
    title: "Impressão",
    href: "/configuracoes/impressao",
    description: "Perfis de impressora, templates, cabeçalho e rodapé.",
    icon: Printer,
    eyebrow: "Saída",
    accentClass: "from-slate-900/12 via-slate-700/6 to-white",
    iconClass: "bg-slate-900 text-white",
  },
] as const

const supportModules = [
  {
    title: "Empresa",
    href: "/configuracoes/empresa",
    description: "Dados fiscais, operacionais e identidade institucional.",
    icon: Building2,
    tag: "Institucional",
  },
  {
    title: "Segurança",
    href: "/configuracoes/seguranca",
    description: "Políticas de senha, tentativas, inatividade e sessões.",
    icon: ShieldCheck,
    tag: "Proteção",
  },
  {
    title: "Parâmetros do Sistema",
    href: "/configuracoes/parametros",
    description: "Grupos globais de comercial, financeiro, RH, PDV e mais.",
    icon: Settings2,
    tag: "Base operacional",
  },
  {
    title: "Automações",
    href: "/configuracoes/automacoes",
    description: "Rotinas automáticas, alertas e notificações internas.",
    icon: BellRing,
    tag: "Rotinas",
  },
  {
    title: "Auditoria",
    href: "/configuracoes/auditoria",
    description: "Rastreabilidade de eventos administrativos por usuário e módulo.",
    icon: FileClock,
    tag: "Histórico",
  },
  {
    title: "Backup",
    href: "/configuracoes/backup",
    description: "Políticas de retenção, geração manual, restauração e exportação.",
    icon: RefreshCcw,
    tag: "Continuidade",
  },
] as const

export default async function ConfiguracoesHubPage() {
  const data = await getConfigurationHubData()
  const lastBackupLabel = data.lastBackup
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(data.lastBackup.createdAt)
    : "Nenhum backup"

  const spotlightModules = [
    {
      ...spotlightModuleDefinitions[0],
      metricValue: data.activeUsers,
      metricLabel: "usuários ativos",
    },
    {
      ...spotlightModuleDefinitions[1],
      metricValue: data.activeRoles,
      metricLabel: "perfis configurados",
    },
    {
      ...spotlightModuleDefinitions[2],
      metricValue: data.customPermissions,
      metricLabel: "regras personalizadas",
    },
    {
      ...spotlightModuleDefinitions[3],
      metricValue: data.documentSequences,
      metricLabel: "sequências prontas",
    },
    {
      ...spotlightModuleDefinitions[4],
      metricValue: data.printerProfiles,
      metricLabel: "perfis de impressão",
    },
  ] as const

  const overviewCards = [
    {
      label: "Acesso em operação",
      value: `${data.activeUsers} usuários`,
      hint: `${data.activeRoles} perfis ativos hoje`,
    },
    {
      label: "Governança",
      value: `${data.customPermissions} regras`,
      hint: `${data.recentChanges} alterações nos últimos 7 dias`,
    },
    {
      label: "Continuidade",
      value: lastBackupLabel,
      hint: `${data.activeSessions} sessões online agora`,
    },
  ] as const

  return (
    <ConfigShell
      title="Configurações"
      subtitle="CENTRO DE ADMINISTRAÇÃO DO ERP COM GOVERNANÇA, ACESSO, SEGURANÇA, AUDITORIA E CONTINUIDADE OPERACIONAL."
      icon={<Settings2 className="h-8 w-8 text-primary" />}
      badges={["Administração do sistema", "Controle central", "Operação local segura"]}
    >
      <Card className="relative overflow-hidden rounded-[2.75rem] border-0 bg-slate-950 text-white shadow-[0_36px_90px_-48px_rgba(15,23,42,0.85)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_36%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.94),_rgba(15,23,42,0.82))]" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -left-14 top-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <CardContent className="relative p-8 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr] xl:items-end">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-100">
                Hub redesenhado para acessos prioritários
              </span>
              <div className="space-y-4">
                <h2 className="max-w-3xl font-heading text-4xl font-black uppercase italic tracking-tight text-white md:text-5xl">
                  As configurações mais usadas agora ficam na frente.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  Usuários, perfis de acesso, permissões, numeração e impressão agora são chamados direto por este hub.
                  O restante continua acessível na navegação e também segue disponível aqui como apoio.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {["Navbar mais limpa", "Botões diretos no hub", "Fluxo centralizado de configurações"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {overviewCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
                  <p className="mt-4 text-2xl font-black italic tracking-tight text-white md:text-3xl">{item.value}</p>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfigSection
        title="Acessos Prioritários"
        description="Essas páginas deixam de poluir a navegação principal e agora viram botões diretos dentro do hub."
      >
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-5">
          {spotlightModules.map((moduleItem) => (
            <Link key={moduleItem.href} href={moduleItem.href} className="group h-full">
              <Card className="relative h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_26px_70px_-52px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-[0_34px_80px_-48px_rgba(37,99,235,0.35)]">
                <div className={`absolute inset-0 bg-gradient-to-br ${moduleItem.accentClass}`} />
                <CardContent className="relative flex h-full flex-col justify-between gap-8 p-6">
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[1.5rem] shadow-lg shadow-slate-900/10 ${moduleItem.iconClass}`}>
                        <moduleItem.icon className="h-6 w-6" />
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 backdrop-blur">
                        {moduleItem.eyebrow}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-2xl font-black uppercase italic tracking-tight text-slate-950">
                        {moduleItem.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{moduleItem.description}</p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-slate-200/80 pt-5">
                    <div>
                      <p className="text-3xl font-black italic tracking-tight text-slate-950">{moduleItem.metricValue}</p>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {moduleItem.metricLabel}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-transform duration-300 group-hover:translate-x-1">
                      Abrir
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ConfigSection>

      <ConfigSection
        title="Módulos Complementares"
        description="Esses módulos seguem com link próprio na navegação, mas continuam disponíveis aqui para manter o hub completo."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {supportModules.map((moduleItem) => (
            <Link key={moduleItem.href} href={moduleItem.href} className="group">
              <Card className="h-full rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_20px_55px_-45px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_70px_-48px_rgba(37,99,235,0.32)]">
                <CardContent className="flex h-full items-start gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-slate-100 text-slate-700 transition-colors duration-300 group-hover:bg-blue-50 group-hover:text-blue-700">
                    <moduleItem.icon className="h-5 w-5" />
                  </div>
                  <div className="flex min-h-[7.5rem] flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading text-xl font-black uppercase italic tracking-tight text-slate-950">
                        {moduleItem.title}
                      </h3>
                      <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600" />
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{moduleItem.description}</p>
                    <span className="mt-4 inline-flex w-fit rounded-full border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {moduleItem.tag}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ConfigSection>
    </ConfigShell>
  )
}
