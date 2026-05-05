"use client"

import React, { useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { AlertTriangle, Clock, Filter, History, Lock, RotateCw, ShieldEllipsis, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ConfigSection, StatusBadge } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput } from "@/components/configuracoes/ConfigForm"
import { saveSettingsCollectionAction, terminateAllUserSessionsAction, terminateSessionAction, setUserStatusAction } from "@/app/(admin)/configuracoes/actions"

type SettingDefinition = {
  key: string
  description?: string
  valueType: string
}

type SecurityTabsProps = {
  actorId: string
  settingsByCategory: Record<string, Array<{ id: string; key: string; label: string; value: string; valueType: string }>>
  securityDefinitions: readonly { key: string; description?: string; valueType: string }[]
  data: any
}

function useDefinitionsMap(securityDefinitions: SecurityTabsProps["securityDefinitions"]) {
  return useMemo(
    () => new Map(securityDefinitions.map((definition) => [definition.key, definition as SettingDefinition])),
    [securityDefinitions],
  )
}

function BooleanField({ name, defaultValue, disabled }: { name: string; defaultValue: string; disabled?: boolean }) {
  const [checked, setChecked] = useState(defaultValue === "true")

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-900">{checked ? "Ativado" : "Desativado"}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">Sim</span>
        <Switch checked={checked} onCheckedChange={setChecked} disabled={disabled} aria-label="Alternar" />
        <span className="text-xs text-slate-500">Não</span>
      </div>
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
    </div>
  )
}

function FormSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="rounded-2xl px-6" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  )
}

function formatDate(value?: string | Date | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}

function summarizeUserAgent(userAgent?: string | null) {
  if (!userAgent) return "-"
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edg)\/([\d.]+)/)
  const osMatch = userAgent.match(/\(([^)]+)\)/)
  const os = osMatch ? osMatch[1].split(";").slice(0, 2).join("; ") : ""
  const browser = browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : "Navegador"
  return `${browser}${os ? ` - ${os}` : ""}`
}

function SessionsPanel({ actorId, sessions }: { actorId: string; sessions: any[] }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 8
  const [sessionToClose, setSessionToClose] = useState<any | null>(null)
  const [userToCloseAll, setUserToCloseAll] = useState<any | null>(null)

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return sessions
    return sessions.filter(
      (session) =>
        session.user.name.toLowerCase().includes(term) ||
        (session.user.email || "").toLowerCase().includes(term) ||
        (session.ipAddress || "").toLowerCase().includes(term),
    )
  }, [sessions, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter className="h-4 w-4 text-slate-500" />
          <span>Filtre por nome, e-mail ou IP.</span>
        </div>
        <Input
          placeholder="Buscar sessão..."
          value={search}
          onChange={(event) => {
            setPage(1)
            setSearch(event.target.value)
          }}
          className="w-full max-w-sm rounded-2xl"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Dispositivo</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Última atividade</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((session) => {
            const isSelf = session.userId === actorId
            return (
              <TableRow key={session.id} className={isSelf ? "bg-amber-50/60" : undefined}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">{session.user.name}</div>
                      <div className="text-xs text-slate-500">{session.user.email || `@${session.user.username}`}</div>
                    </div>
                    {isSelf ? <Badge className="rounded-full bg-amber-100 text-amber-700">Você</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={session.isActive ? "ACTIVE" : "INACTIVE"} />
                </TableCell>
                <TableCell>{session.ipAddress || "-"}</TableCell>
                <TableCell title={session.userAgent || undefined} className="max-w-[260px] truncate">
                  {summarizeUserAgent(session.userAgent)}
                </TableCell>
                <TableCell>{formatDate(session.startedAt)}</TableCell>
                <TableCell>{formatDate(session.lastActivityAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog open={sessionToClose?.id === session.id} onOpenChange={(open) => setSessionToClose(open ? session : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-2xl" disabled={isSelf}>
                          Encerrar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Encerrar sessão?</DialogTitle>
                          <DialogDescription>
                            {session.user.name} - IP {session.ipAddress || "desconhecido"} - {summarizeUserAgent(session.userAgent)}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="rounded-2xl">
                              Manter
                            </Button>
                          </DialogTrigger>
                          <form action={terminateSessionAction}>
                            <input type="hidden" name="sessionId" value={session.id} />
                            <FormSubmitButton label="Confirmar encerramento" pendingLabel="Encerrando..." />
                          </form>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={userToCloseAll?.userId === session.userId} onOpenChange={(open) => setUserToCloseAll(open ? session : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-2xl" disabled={isSelf}>
                          Encerrar todas
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Encerrar todas as sessões deste usuário?</DialogTitle>
                          <DialogDescription>{session.user.name} terá de acessar novamente.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="rounded-2xl">
                              Cancelar
                            </Button>
                          </DialogTrigger>
                          <form action={terminateAllUserSessionsAction}>
                            <input type="hidden" name="userId" value={session.userId} />
                            <FormSubmitButton label="Encerrar todas" pendingLabel="Encerrando..." />
                          </form>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Página {currentPage}/{totalPages} - {filtered.length} sessões
        </span>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Anterior
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}

function BlockListPanel({
  blockedList,
  pendingList,
}: {
  blockedList: Array<{ id: string; name: string; email?: string | null; username: string; blockedReason?: string | null; blockedAt?: string | Date | null }>
  pendingList: Array<{ id: string; name: string; email?: string | null; username: string; createdAt?: string | Date | null }>
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Lock className="h-4 w-4 text-slate-500" />
          <div>
            <p className="font-semibold">Usuários bloqueados</p>
            <p className="text-xs text-slate-500">Libere apenas quando o risco tiver sido resolvido.</p>
          </div>
        </div>
        <div className="space-y-3">
          {blockedList.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum usuário bloqueado.</p>
          ) : (
            blockedList.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email || `@${user.username}`}</p>
                    <p className="text-xs text-slate-600">
                      Desde {formatDate(user.blockedAt)} - {user.blockedReason || "Sem motivo informado"}
                    </p>
                  </div>
                  <form action={setUserStatusAction} className="flex-shrink-0">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="status" value="ACTIVE" />
                    <input type="hidden" name="reason" value="Desbloqueado manualmente" />
                    <FormSubmitButton label="Desbloquear" pendingLabel="Desbloqueando..." />
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center gap-2 text-slate-800">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <div>
            <p className="font-semibold">Pendentes de ativação</p>
            <p className="text-xs text-slate-500">Ative somente após confirmar identidade.</p>
          </div>
        </div>
        <div className="space-y-3">
          {pendingList.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum usuário pendente.</p>
          ) : (
            pendingList.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email || `@${user.username}`}</p>
                    <p className="text-xs text-slate-600">Solicitado em {formatDate(user.createdAt)}</p>
                  </div>
                  <form action={setUserStatusAction} className="flex-shrink-0">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="status" value="ACTIVE" />
                    <input type="hidden" name="reason" value="Ativado manualmente" />
                    <FormSubmitButton label="Ativar" pendingLabel="Ativando..." />
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function HistoryPanel({
  settingHistory,
  auditHistory,
}: {
  settingHistory: any[]
  auditHistory: any[]
}) {
  const items = useMemo(() => {
    const settingItems =
      settingHistory?.map((entry: any) => ({
        id: `setting-${entry.id}`,
        when: new Date(entry.changedAt),
        title: entry.setting?.label || entry.settingId,
        detail: entry.newValue ? `de ${entry.previousValue ?? "-"} para ${entry.newValue}` : entry.previousValue || "-",
        actor: entry.changedBy?.name || "Sistema",
        kind: "Configuração",
      })) ?? []

    const auditItems =
      auditHistory?.map((entry: any) => ({
        id: `audit-${entry.id}`,
        when: new Date(entry.createdAt),
        title: entry.description || entry.action,
        detail: entry.details || entry.entity,
        actor: entry.user?.name || "Sistema",
        kind: "Evento",
      })) ?? []

    return [...settingItems, ...auditItems].sort((a, b) => b.when.getTime() - a.when.getTime()).slice(0, 30)
  }, [settingHistory, auditHistory])

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum histórico recente.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{formatDate(item.when)}</span>
                  <Badge className="rounded-full bg-slate-100 text-slate-700">{item.kind}</Badge>
                </div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail || "Sem detalhes"}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{item.actor}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PoliciesPanel({
  settingsByCategory,
  definitionsMap,
}: {
  settingsByCategory: SecurityTabsProps["settingsByCategory"]
  definitionsMap: Map<string, SettingDefinition>
}) {
  return (
    <form action={saveSettingsCollectionAction} className="grid gap-6">
      <input type="hidden" name="redirectPath" value="/configuracoes/seguranca" />
      {Object.entries(settingsByCategory).map(([category, settings]) => (
        <div key={category} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{category}</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {settings.map((setting) => {
              const def = definitionsMap.get(setting.key)
              const controlName = `value:${setting.id}`

              return (
                <FieldGroup key={setting.id} label={setting.label} description={def?.description}>
                  <input type="hidden" name="settingId" value={setting.id} />
                  {setting.valueType === "boolean" || def?.valueType === "boolean" ? (
                    <BooleanField name={controlName} defaultValue={setting.value} />
                  ) : setting.valueType === "number" || def?.valueType === "number" ? (
                    <FieldInput type="number" name={controlName} defaultValue={setting.value} required min={0} step="1" />
                  ) : (
                    <FieldInput name={controlName} defaultValue={setting.value} required />
                  )}
                </FieldGroup>
              )
            })}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <FormSubmitButton label="Salvar políticas" pendingLabel="Salvando..." />
      </div>
    </form>
  )
}

export default function SecurityTabs({ actorId, settingsByCategory, securityDefinitions, data }: SecurityTabsProps) {
  const definitionsMap = useDefinitionsMap(securityDefinitions)

  return (
    <Tabs defaultValue="politicas" className="space-y-6">
      <TabsList className="flex w-full flex-wrap gap-2 rounded-2xl bg-slate-100/80 p-2">
        <TabsTrigger value="politicas" className="rounded-xl data-[state=active]:bg-white">
          Políticas
        </TabsTrigger>
        <TabsTrigger value="sessoes" className="rounded-xl data-[state=active]:bg-white">
          Sessões
        </TabsTrigger>
        <TabsTrigger value="bloqueios" className="rounded-xl data-[state=active]:bg-white">
          Bloqueios
        </TabsTrigger>
        <TabsTrigger value="historico" className="rounded-xl data-[state=active]:bg-white">
          Histórico
        </TabsTrigger>
      </TabsList>

      <TabsContent value="politicas">
        <ConfigSection
          title="Políticas de segurança"
          description="Regras de senha, tentativas, bloqueio e sessão com validação antes de salvar."
          actions={<ShieldEllipsis className="h-5 w-5 text-blue-600" />}
        >
          <PoliciesPanel settingsByCategory={settingsByCategory} definitionsMap={definitionsMap} />
        </ConfigSection>
      </TabsContent>

      <TabsContent value="sessoes">
        <ConfigSection
          title="Sessões ativas"
          description="IP, dispositivo, última atividade e encerramento com confirmação."
          actions={<RotateCw className="h-5 w-5 text-blue-600" />}
        >
          <SessionsPanel actorId={actorId} sessions={data.activeSessions} />
        </ConfigSection>
      </TabsContent>

      <TabsContent value="bloqueios">
        <ConfigSection
          title="Bloqueios e pendências"
          description="Usuários bloqueados ou aguardando ativação com ações rápidas."
          actions={<XCircle className="h-5 w-5 text-amber-600" />}
        >
          <BlockListPanel blockedList={data.blockedList || []} pendingList={data.pendingList || []} />
        </ConfigSection>
      </TabsContent>

      <TabsContent value="historico">
        <ConfigSection
          title="Histórico recente"
          description="Alterações de políticas e eventos de sessão para auditoria rápida."
          actions={<History className="h-5 w-5 text-slate-600" />}
        >
          <HistoryPanel settingHistory={data.settingHistory} auditHistory={data.auditHistory} />
        </ConfigSection>
      </TabsContent>
    </Tabs>
  )
}
