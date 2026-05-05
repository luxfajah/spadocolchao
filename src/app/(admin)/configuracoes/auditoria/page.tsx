import { FileClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfigSection, ConfigShell } from "@/components/configuracoes/ConfigShell"
import { FieldGroup, FieldInput, FieldSelect, TwoColumnGrid } from "@/components/configuracoes/ConfigForm"
import { getAuditData } from "@/lib/configuration-queries"

type AuditoriaPageProps = {
  searchParams?: {
    userId?: string
    module?: string
    action?: string
    entity?: string
    ipAddress?: string
    startDate?: string
    endDate?: string
  }
}

export default async function AuditoriaPage({ searchParams }: AuditoriaPageProps) {
  const data = await getAuditData(searchParams || {})

  return (
    <ConfigShell
      title="Auditoria"
      subtitle="RASTREABILIDADE DE EVENTOS COM FILTRO POR USUÁRIO, MÓDULO, AÇÃO, ENTIDADE, IP E PERÍODO."
      icon={<FileClock className="h-8 w-8 text-primary" />}
      badges={["Histórico administrativo", "Filtro por contexto", "Base de conformidade"]}
      stats={[
        { label: "Eventos listados", value: data.logs.length, hint: "resultado do filtro", tone: "blue" },
        { label: "Usuários auditáveis", value: data.users.length, hint: "base de operadores", tone: "green" },
      ]}
    >
      <ConfigSection title="Filtros" description="USE OS CAMPOS ABAIXO PARA RESTRINGIR A LEITURA DA AUDITORIA.">
        <form className="grid gap-4">
          <TwoColumnGrid>
            <FieldGroup label="Usuário">
              <FieldSelect name="userId" defaultValue={searchParams?.userId || ""}>
                <option value="">Todos</option>
                {data.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>
            <FieldGroup label="Módulo">
              <FieldInput name="module" defaultValue={searchParams?.module || ""} />
            </FieldGroup>
            <FieldGroup label="Ação">
              <FieldInput name="action" defaultValue={searchParams?.action || ""} />
            </FieldGroup>
            <FieldGroup label="Entidade">
              <FieldInput name="entity" defaultValue={searchParams?.entity || ""} />
            </FieldGroup>
            <FieldGroup label="IP">
              <FieldInput name="ipAddress" defaultValue={searchParams?.ipAddress || ""} />
            </FieldGroup>
            <FieldGroup label="Data inicial">
              <FieldInput name="startDate" type="date" defaultValue={searchParams?.startDate || ""} />
            </FieldGroup>
            <FieldGroup label="Data final">
              <FieldInput name="endDate" type="date" defaultValue={searchParams?.endDate || ""} />
            </FieldGroup>
          </TwoColumnGrid>
          <div className="flex justify-end">
            <Button className="rounded-2xl px-6">Aplicar filtros</Button>
          </div>
        </form>
      </ConfigSection>

      <ConfigSection title="Eventos" description="LEITURA DETALHADA COM DESCRIÇÃO, ORIGEM E DETALHES REGISTRADOS.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(log.createdAt)}</TableCell>
                <TableCell>{log.user?.name || "Sistema"}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.entity}</TableCell>
                <TableCell>{log.description || "-"}</TableCell>
                <TableCell>{log.origin}</TableCell>
                <TableCell>{log.ipAddress || "-"}</TableCell>
                <TableCell className="max-w-[340px] whitespace-normal text-sm text-slate-600">{log.details || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ConfigSection>
    </ConfigShell>
  )
}
