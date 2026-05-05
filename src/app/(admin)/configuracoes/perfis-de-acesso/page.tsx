import Link from "next/link"
import { CopyPlus, Shield, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfigSection, ConfigShell, StatusBadge } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldSelect, FieldTextarea, TwoColumnGrid } from "@/components/configuracoes/ConfigForm"
import {
  archiveRoleAction,
  duplicateRoleAction,
  saveRoleAction,
  toggleRoleStatusAction,
  updateRolePermissionsAction,
} from "../actions"
import { getRolesData } from "@/lib/configuration-queries"

type PerfisPageProps = {
  searchParams?: {
    role?: string
  }
}

export default async function PerfisDeAcessoPage({ searchParams }: PerfisPageProps) {
  const data = await getRolesData(searchParams?.role)
  const selectedRole = data.selectedRole
  const activeRoles = data.roles.filter((role) => role.status === "ACTIVE").length
  const archivedRoles = data.roles.filter((role) => role.status === "ARCHIVED").length
  const systemRoles = data.roles.filter((role) => role.isSystem).length

  const groupedPermissions = data.permissions.reduce<Record<string, typeof data.permissions>>((accumulator, permission) => {
    accumulator[permission.module] = [...(accumulator[permission.module] || []), permission]
    return accumulator
  }, {})

  return (
    <ConfigShell
      title="Perfis de Acesso"
      subtitle="GOVERNANÇA DE PERFIS COM DUPLICAÇÃO, MATRIZ DE PERMISSÕES E CICLO DE VIDA POR PAPEL."
      icon={<Shield className="h-8 w-8 text-primary" />}
      badges={["Perfis padrão", "Matriz por módulo", "Governança de acessos"]}
      stats={[
        { label: "Perfis ativos", value: activeRoles, hint: "em operação", tone: "blue" },
        { label: "Perfis arquivados", value: archivedRoles, hint: "fora de uso", tone: "amber" },
        { label: "Perfis de sistema", value: systemRoles, hint: "base padrão do ERP", tone: "green" },
        { label: "Permissões no catálogo", value: data.permissions.length, hint: "motor completo por ação", tone: "slate" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ConfigSection
          title={selectedRole ? `Editar perfil: ${selectedRole.name}` : "Criar perfil"}
          description="NOME, DESCRIÇÃO, STATUS E OBSERVAÇÕES DO PERFIL SELECIONADO."
          actions={<Users2 className="h-5 w-5 text-blue-600" />}
        >
          <form action={saveRoleAction} className="grid gap-4">
            <input type="hidden" name="roleId" value={selectedRole?.id || ""} />
            <TwoColumnGrid>
              <FieldGroup label="Nome do perfil">
                <FieldInput name="name" defaultValue={selectedRole?.name || ""} required />
              </FieldGroup>
              <FieldGroup label="Status">
                <FieldSelect name="status" defaultValue={selectedRole?.status || "ACTIVE"}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </FieldSelect>
              </FieldGroup>
            </TwoColumnGrid>
            <FieldGroup label="Descrição">
              <FieldTextarea name="description" defaultValue={selectedRole?.description || ""} />
            </FieldGroup>
            <FieldGroup label="Observações">
              <FieldTextarea name="notes" defaultValue={selectedRole?.notes || ""} />
            </FieldGroup>
            <div className="flex justify-end">
              <Button className="rounded-2xl px-6">{selectedRole ? "Salvar perfil" : "Criar perfil"}</Button>
            </div>
          </form>
        </ConfigSection>

        <ConfigSection
          title="Base de perfis"
          description="SELECIONE UM PERFIL PARA EDITAR OU DUPLIQUE UMA BASE EXISTENTE."
          actions={<CopyPlus className="h-5 w-5 text-blue-600" />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{role.name}</div>
                    <div className="text-xs text-slate-500">{role.description || "Sem descrição"}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={role.status} />
                  </TableCell>
                  <TableCell>{role.users.length}</TableCell>
                  <TableCell>{role.permissions.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/configuracoes/perfis-de-acesso?role=${role.id}`}>
                        <Button variant="outline" className="rounded-2xl">
                          Abrir
                        </Button>
                      </Link>
                      <form action={duplicateRoleAction}>
                        <input type="hidden" name="roleId" value={role.id} />
                        <Button variant="outline" className="rounded-2xl">
                          Duplicar
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ConfigSection>
      </div>

      {selectedRole ? (
        <ConfigSection
          title={`Permissões do perfil: ${selectedRole.name}`}
          description="MARQUE O QUE ESTE PERFIL PODE EXECUTAR. ALTERAÇÕES SÃO APLICADAS AO PERFIL SELECIONADO."
          actions={
            <div className="flex gap-2">
              <form action={toggleRoleStatusAction}>
                <input type="hidden" name="roleId" value={selectedRole.id} />
                <input type="hidden" name="nextStatus" value={selectedRole.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                <Button variant="outline" className="rounded-2xl">
                  {selectedRole.status === "ACTIVE" ? "Inativar" : "Ativar"}
                </Button>
              </form>
              <form action={archiveRoleAction}>
                <input type="hidden" name="roleId" value={selectedRole.id} />
                <Button variant="outline" className="rounded-2xl">
                  Arquivar
                </Button>
              </form>
            </div>
          }
        >
          <form action={updateRolePermissionsAction} className="grid gap-6">
            <input type="hidden" name="roleId" value={selectedRole.id} />
            {Object.entries(groupedPermissions).map(([moduleName, permissions]) => (
              <div key={moduleName} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">{moduleName}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex min-h-[72px] items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="permissionId"
                        value={permission.id}
                        defaultChecked={data.selectedRolePermissionIds.has(permission.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <span className="grid gap-1">
                        <span className="font-semibold text-slate-900">{permission.name}</span>
                        <span className="text-xs text-slate-500">{permission.code}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button className="rounded-2xl px-6">Salvar matriz de permissões</Button>
            </div>
          </form>
        </ConfigSection>
      ) : null}
    </ConfigShell>
  )
}
