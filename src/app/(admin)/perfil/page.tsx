import Link from "next/link"
import { ArrowRight, Building2, KeyRound, Mail, PencilLine, Phone, ShieldCheck, UserRound } from "lucide-react"
import { requireAuthenticatedUser } from "@/lib/auth"
import { getUserAccessProfile } from "@/lib/access-control"
import { getUserAvatarUrl } from "@/lib/user-avatar"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function formatDate(date?: Date | null) {
  if (!date) {
    return "Ainda sem registro"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date))
}

export default async function PerfilPage() {
  const user = await requireAuthenticatedUser()
  const avatarUrl = await getUserAvatarUrl(user.id)
  const accessProfile = await getUserAccessProfile(user)
  const visibleAreas = accessProfile.allowedAreas.filter((area) => area !== "dashboard")
  const userInitials = (user.name || user.username)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Meu Perfil"
        subtitle="DADOS DA CONTA, PERFIL DE ACESSO, IDENTIFICAÇÃO E CONTEXTO OPERACIONAL DO USUÁRIO LOGADO."
        icon={<UserRound className="h-8 w-8" />}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/perfil/editar">
              <Button
                variant="outline"
                className="h-12 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em]"
              >
                Editar perfil <PencilLine className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={accessProfile.defaultRoute}>
              <Button className="h-12 rounded-full px-6 text-xs font-black uppercase tracking-[0.14em]">
                Voltar ao painel <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <Card className="overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-lahomes">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_28%),linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[2rem] bg-slate-950 text-2xl font-black text-white shadow-xl shadow-slate-950/15">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={`Foto de perfil de ${user.name}`} className="h-full w-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>

                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    Conta logada
                  </span>
                  <div>
                    <h1 className="font-outfit text-3xl font-black uppercase italic tracking-tight text-primary">
                      {user.name}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">{user.email || `@${user.username}`}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                      {accessProfile.roleNames.join(" | ") || user.jobTitle || "Usuário do sistema"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Último acesso</p>
                <p className="mt-2 text-sm font-black uppercase tracking-tight text-slate-900">
                  {formatDate(user.lastLoginAt)}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="grid gap-5 p-8 md:grid-cols-2 xl:grid-cols-3 md:p-10">
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Nome de usuário</p>
              <p className="mt-3 text-lg font-black uppercase tracking-tight text-slate-900">{user.username}</p>
            </div>
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">E-mail</p>
              <p className="mt-3 text-lg font-black tracking-tight text-slate-900">{user.email || "Não informado"}</p>
            </div>
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Telefone</p>
              <p className="mt-3 text-lg font-black tracking-tight text-slate-900">{user.phone || "Não informado"}</p>
            </div>
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Nome social</p>
              <p className="mt-3 text-lg font-black tracking-tight text-slate-900">
                {user.socialName || "Não informado"}
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Cargo</p>
              <p className="mt-3 text-lg font-black uppercase tracking-tight text-slate-900">
                {user.jobTitle || "Não informado"}
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Setor</p>
              <p className="mt-3 text-lg font-black uppercase tracking-tight text-slate-900">
                {user.department || "Não informado"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[2.5rem] border border-slate-100 shadow-lahomes">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
                <ShieldCheck className="h-5 w-5" />
                Acesso liberado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-8 pt-0">
              <div className="rounded-[1.8rem] border border-primary/10 bg-primary/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Rota inicial</p>
                <p className="mt-3 text-lg font-black uppercase tracking-tight text-slate-900">
                  {accessProfile.defaultRoute}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {visibleAreas.length === 0 ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                    Somente dashboard
                  </span>
                ) : (
                  visibleAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600"
                    >
                      {area}
                    </span>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border border-slate-100 shadow-lahomes">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
                Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-8 pt-0">
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Contato</p>
                  <p className="text-sm font-semibold text-slate-700">{user.email || "Sem e-mail cadastrado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <Phone className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Telefone</p>
                  <p className="text-sm font-semibold text-slate-700">{user.phone || "Sem telefone cadastrado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <Building2 className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Departamento</p>
                  <p className="text-sm font-semibold text-slate-700">{user.department || "Não informado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <KeyRound className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Senha</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {user.mustChangePassword ? "Alteração obrigatória pendente" : "Senha em situação regular"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
