import { Fingerprint, LockKeyhole, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfigSection, ConfigShell, StatusBadge } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldSelect, FieldTextarea, TwoColumnGrid } from "@/components/configuracoes/ConfigForm"
import { createCustomPermissionAction } from "../actions"
import { getPermissionsData } from "@/lib/configuration-queries"

export default async function PermissoesPage() {
  const data = await getPermissionsData()
  const customPermissions = data.permissions.filter((permission) => permission.isCustom).length
  const overriddenUsers = new Set(data.overrides.map((override) => override.userId)).size

  const groupedPermissions = data.permissions.reduce<Record<string, typeof data.permissions>>((accumulator, permission) => {
    accumulator[permission.module] = [...(accumulator[permission.module] || []), permission]
    return accumulator
  }, {})

  return (
    <ConfigShell
      title="Permissões"
      subtitle="MOTOR DE ACESSO POR MÓDULO E AÇÃO, COM SOBRESCRITAS ESPECÍFICAS POR USUÁRIO E REGRA DE PRECEDÊNCIA."
      icon={<Fingerprint className="h-8 w-8 text-primary" />}
      badges={["DENY vence ALLOW", "Catálogo central", "Sobrescrita por usuário"]}
      stats={[
        { label: "Permissões totais", value: data.permissions.length, hint: "catálogo ativo", tone: "blue" },
        { label: "Customizadas", value: customPermissions, hint: "fora do padrão inicial", tone: "amber" },
        { label: "Usuários com override", value: overriddenUsers, hint: "sobrescritas individuais", tone: "green" },
        { label: "Overrides recentes", value: data.overrides.length, hint: "últimos registros listados", tone: "slate" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ConfigSection
          title="Criar permissão customizada"
          description="ESTENDA O CATÁLOGO SEM ALTERAR O NÚCLEO PADRÃO DE MÓDULOS."
          actions={<ShieldAlert className="h-5 w-5 text-blue-600" />}
        >
          <form action={createCustomPermissionAction} className="grid gap-4">
            <TwoColumnGrid>
              <FieldGroup label="Código">
                <FieldInput name="code" placeholder="configuracoes.aprovar_exportacao" required />
              </FieldGroup>
              <FieldGroup label="Nome">
                <FieldInput name="name" placeholder="Configurações - Aprovar exportação" required />
              </FieldGroup>
              <FieldGroup label="Módulo">
                <FieldSelect name="module" defaultValue="Configurações">
                  {["Comercial", "Pedidos", "Financeiro", "Suprimentos", "RH", "Configurações"].map((moduleName) => (
                    <option key={moduleName} value={moduleName}>
                      {moduleName}
                    </option>
                  ))}
                </FieldSelect>
              </FieldGroup>
              <FieldGroup label="Ação">
                <FieldInput name="action" placeholder="approve_export" />
              </FieldGroup>
            </TwoColumnGrid>
            <FieldGroup label="Descrição">
              <FieldTextarea name="description" />
            </FieldGroup>
            <div className="flex justify-end">
              <Button className="rounded-2xl px-6">Adicionar permissão</Button>
            </div>
          </form>
        </ConfigSection>

        <ConfigSection
          title="Sobrescritas recentes"
          description="REGRAS APLICADAS DIRETAMENTE EM USUÁRIOS, FORA DO PERFIL BASE."
          actions={<LockKeyhole className="h-5 w-5 text-blue-600" />}
        >
          <div className="grid gap-3">
            {data.overrides.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma sobrescrita manual registrada.</p>
            ) : (
              data.overrides.map((override) => (
                <div key={override.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{override.user.name}</p>
                      <p className="text-sm text-slate-600">{override.permission.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={override.effect} />
                      <span className="text-xs text-slate-500">
                        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(override.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ConfigSection>
      </div>

      <ConfigSection
        title="Catálogo por módulo"
        description="VISUALIZAÇÃO DA MATRIZ COMPLETA COM VÍNCULOS A PERFIS E SOBRESCRITAS."
        actions={<Fingerprint className="h-5 w-5 text-blue-600" />}
      >
        <div className="grid gap-6">
          {Object.entries(groupedPermissions).map(([moduleName, permissions]) => (
            <div key={moduleName} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">{moduleName}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Perfis</TableHead>
                    <TableHead>Overrides</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{permission.name}</div>
                        <div className="text-xs text-slate-500">{permission.description || "Sem descrição"}</div>
                      </TableCell>
                      <TableCell>{permission.code}</TableCell>
                      <TableCell>{permission.action || "-"}</TableCell>
                      <TableCell>{permission.roles.length}</TableCell>
                      <TableCell>{permission.userOverrides.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </ConfigSection>
    </ConfigShell>
  )
}
